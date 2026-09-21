import { Prisma } from "@sicog/db";
import type {
  AreaMttoDto,
  CausaFallaDto,
  EstacionDetalleDto,
  EstacionDto,
  TipoInstrumentoDto,
} from "@sicog/shared-types";
import type { ListEstacionesQuery } from "@sicog/shared-validators";
import { prisma } from "../../../shared/prisma-client.js";
import { traducirEscritura } from "../../../shared/prisma-errores.js";
import { dateToFecha, fechaToDate } from "../../../shared/fechas.js";
import { diasEntre, hoyUtc } from "../mantenimiento.fechas.js";

export interface IEstacionRepository {
  listar(
    filtros: ListEstacionesQuery,
    alDia: Date,
  ): Promise<{ items: EstacionDto[]; total: number }>;
  obtener(id: number, alDia: Date): Promise<EstacionDetalleDto | null>;
  crear(datos: {
    nodo: string;
    nombre: string;
    areaId: number;
    tipoEnlaceCom: string;
    tipoRed: "TRANSPORTE" | "DISTRIBUCION" | null;
  }): Promise<EstacionDetalleDto>;
  actualizar(
    id: number,
    datos: {
      nombre?: string;
      areaId?: number;
      tipoEnlaceCom?: string;
      tipoRed?: "TRANSPORTE" | "DISTRIBUCION" | null;
    },
  ): Promise<EstacionDetalleDto>;
  reemplazarInstrumentos(
    id: number,
    instrumentos: { tipoInstrumentoId: number; cantidad: number }[],
  ): Promise<EstacionDetalleDto>;

  listarAreas(regionId?: number): Promise<AreaMttoDto[]>;
  listarTiposInstrumento(): Promise<TipoInstrumentoDto[]>;
  listarCausas(): Promise<CausaFallaDto[]>;
  crearCausa(nombre: string): Promise<CausaFallaDto>;
  actualizarCausa(id: number, datos: { nombre?: string; activo?: boolean }): Promise<CausaFallaDto>;
}

const estacionSelect = {
  id: true,
  nodo: true,
  nombre: true,
  tipoEnlaceCom: true,
  tipoRed: true,
  area: { select: { id: true, nombre: true, region: { select: { id: true, nombre: true } } } },
} satisfies Prisma.EstacionSelect;

const fallaSelect = {
  id: true,
  desde: true,
  observacion: true,
  causaFalla: { select: { id: true, nombre: true, activo: true } },
} satisfies Prisma.FallaEstacionSelect;

type EstacionFila = Prisma.EstacionGetPayload<{ select: typeof estacionSelect }> & {
  fallas?: Prisma.FallaEstacionGetPayload<{ select: typeof fallaSelect }>[];
};

/**
 * La falla que cubre una fecha: empezó ese día o antes, y o sigue abierta o se
 * resolvió **después**. El índice único parcial de la migración garantiza que
 * hay a lo sumo una abierta, así que la estación tiene un solo estado.
 *
 * `gt` y no `gte`: **el día en que una falla se resuelve la estación ya cuenta
 * como disponible**. Con `gte`, resolver una falla con fecha de hoy la dejaba
 * cubriendo hoy, así que "Resolver hoy" no movía ni el inventario ni el
 * indicador hasta el día siguiente y parecía que el botón no hacía nada.
 */
export const fallaVigenteWhere = (alDia: Date): Prisma.FallaEstacionWhereInput => ({
  desde: { lte: alDia },
  OR: [{ resueltaEn: null }, { resueltaEn: { gt: alDia } }],
});

const aDto = (fila: EstacionFila, alDia: Date): EstacionDto => {
  const falla = fila.fallas?.[0];
  return {
    id: fila.id,
    nodo: fila.nodo,
    nombre: fila.nombre,
    area: { id: fila.area.id, nombre: fila.area.nombre },
    region: { id: fila.area.region.id, nombre: fila.area.region.nombre },
    tipoEnlaceCom: fila.tipoEnlaceCom as EstacionDto["tipoEnlaceCom"],
    tipoRed: fila.tipoRed,
    estado: falla ? "EN_FALLA" : "OPERATIVA",
    fallaAbierta: falla
      ? {
          id: falla.id.toString(),
          causaFalla: falla.causaFalla,
          desde: dateToFecha(falla.desde),
          diasCaida: diasEntre(falla.desde, alDia),
          observacion: falla.observacion,
        }
      : null,
  };
};

const detalleInclude = {
  ...estacionSelect,
  instrumentos: {
    select: { cantidad: true, tipoInstrumento: { select: { id: true, nombre: true } } },
    orderBy: { tipoInstrumento: { nombre: "asc" } },
  },
} satisfies Prisma.EstacionSelect;

async function detalle(id: number, alDia: Date): Promise<EstacionDetalleDto | null> {
  const fila = await prisma.estacion.findUnique({
    where: { id },
    select: {
      ...detalleInclude,
      fallas: { where: fallaVigenteWhere(alDia), select: fallaSelect, take: 1 },
    },
  });
  if (!fila) return null;
  const instrumentos = fila.instrumentos.map((i) => ({
    tipoInstrumento: i.tipoInstrumento,
    cantidad: i.cantidad,
  }));
  return {
    ...aDto(fila, alDia),
    instrumentos,
    totalInstrumentos: instrumentos.reduce((a, i) => a + i.cantidad, 0),
  };
}

export const estacionRepository: IEstacionRepository = {
  async listar(filtros, alDia) {
    const { page, pageSize, regionId, areaId, tipoRed, tipoEnlaceCom, estado, causaFallaId, desde, hasta, q } =
      filtros;

    const vigente = fallaVigenteWhere(alDia);

    // Las condiciones sobre la falla abierta van en un `AND` y no sueltas en el
    // objeto: son varias y todas escriben la clave `fallas`, así que en un
    // literal la última tapaba a las anteriores en silencio.
    const sobreLaFalla: Prisma.EstacionWhereInput[] = [];
    if (estado === "EN_FALLA") sobreLaFalla.push({ fallas: { some: vigente } });
    if (estado === "OPERATIVA") sobreLaFalla.push({ fallas: { none: vigente } });
    if (causaFallaId) sobreLaFalla.push({ fallas: { some: { AND: [vigente, { causaFallaId }] } } });
    // El rango filtra por **solapamiento**, no por cuándo empezó la falla: una
    // estación caída desde hace meses o años y que sigue así entra al pedir el
    // rango de hoy, igual que en la bitácora (`falla.repository.ts`). No va
    // `AND: [vigente, ...]` porque `vigente` mira sólo `alDia` (hoy) y dejaría
    // afuera fallas que ya se resolvieron dentro del rango pedido.
    if (desde || hasta) {
      sobreLaFalla.push({
        fallas: {
          some: {
            AND: [
              ...(desde
                ? [
                    {
                      OR: [{ resueltaEn: null }, { resueltaEn: { gte: fechaToDate(desde) } }],
                    } satisfies Prisma.FallaEstacionWhereInput,
                  ]
                : []),
              ...(hasta ? [{ desde: { lte: fechaToDate(hasta) } }] : []),
            ],
          },
        },
      });
    }

    const where: Prisma.EstacionWhereInput = {
      ...(areaId ? { areaId } : {}),
      ...(regionId ? { area: { regionId } } : {}),
      ...(tipoEnlaceCom ? { tipoEnlaceCom } : {}),
      // `tipoRed: undefined` no filtra; para pedir las no clasificadas hay que
      // preguntar por `null` explícitamente, y el schema no lo admite hoy.
      ...(tipoRed ? { tipoRed } : {}),
      ...(sobreLaFalla.length > 0 ? { AND: sobreLaFalla } : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { nodo: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [filas, total] = await Promise.all([
      prisma.estacion.findMany({
        where,
        select: {
          ...estacionSelect,
          fallas: { where: vigente, select: fallaSelect, take: 1 },
        },
        orderBy: [{ area: { region: { nombre: "asc" } } }, { area: { nombre: "asc" } }, { nodo: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.estacion.count({ where }),
    ]);

    return { items: filas.map((f) => aDto(f, alDia)), total };
  },

  obtener: (id, alDia) => detalle(id, alDia),

  async crear(datos) {
    try {
      const creada = await prisma.estacion.create({ data: datos, select: { id: true } });
      return (await detalle(creada.id, hoyUtc()))!;
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: `Ya existe una estación con el nodo ${datos.nodo}`,
        noExiste: "No existe el área indicada",
      });
    }
  },

  async actualizar(id, datos) {
    try {
      await prisma.estacion.update({ where: { id }, data: datos, select: { id: true } });
      return (await detalle(id, hoyUtc()))!;
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe una estación con ese nodo",
        noExiste: "No existe la estación o el área indicada",
      });
    }
  },

  async reemplazarInstrumentos(id, instrumentos) {
    try {
      await prisma.$transaction([
        prisma.estacionInstrumento.deleteMany({ where: { estacionId: id } }),
        prisma.estacionInstrumento.createMany({
          data: instrumentos.map((i) => ({ estacionId: id, ...i })),
        }),
      ]);
      return (await detalle(id, hoyUtc()))!;
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "No se puede repetir el mismo tipo de instrumento",
        noExiste: "No existe la estación o alguno de los tipos de instrumento",
      });
    }
  },

  async listarAreas(regionId) {
    const filas = await prisma.areaMtto.findMany({
      where: regionId ? { regionId } : {},
      select: {
        id: true,
        nombre: true,
        region: { select: { id: true, nombre: true } },
        _count: { select: { estaciones: true } },
      },
      orderBy: [{ region: { nombre: "asc" } }, { nombre: "asc" }],
    });
    return filas.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      region: a.region,
      totalEstaciones: a._count.estaciones,
    }));
  },

  listarTiposInstrumento: () =>
    prisma.tipoInstrumento.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),

  // Devuelve también las inactivas, con su bandera: las fallas históricas las
  // nombran (decisión #31).
  listarCausas: () =>
    prisma.causaFalla.findMany({
      select: { id: true, nombre: true, activo: true },
      orderBy: { nombre: "asc" },
    }),

  async crearCausa(nombre) {
    try {
      return await prisma.causaFalla.create({
        data: { nombre },
        select: { id: true, nombre: true, activo: true },
      });
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: `Ya existe una causa de falla llamada "${nombre}"`,
        noExiste: "No existe la causa de falla",
      });
    }
  },

  async actualizarCausa(id, datos) {
    try {
      return await prisma.causaFalla.update({
        where: { id },
        data: datos,
        select: { id: true, nombre: true, activo: true },
      });
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe una causa de falla con ese nombre",
        noExiste: "No existe la causa de falla",
      });
    }
  },
};
