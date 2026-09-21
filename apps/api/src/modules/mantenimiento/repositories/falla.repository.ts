import { Prisma } from "@sicog/db";
import type {
  DisponibilidadDto,
  FallaEstacionDto,
  FallaHistorialEntryDto,
  SemanaDisponibilidadDto,
  SerieDisponibilidadDto,
} from "@sicog/shared-types";
import type { ListFallasQuery } from "@sicog/shared-validators";
import { prisma } from "../../../shared/prisma-client.js";
import { traducirEscritura } from "../../../shared/prisma-errores.js";
import { dateToFecha, fechaToDate } from "../../../shared/fechas.js";
import { diasEntre, hoyUtc, lunesDelAnio } from "../mantenimiento.fechas.js";
import { fallaVigenteWhere } from "./estacion.repository.js";

export interface IFallaRepository {
  listar(filtros: ListFallasQuery): Promise<{ items: FallaEstacionDto[]; total: number }>;
  obtener(id: bigint): Promise<FallaEstacionDto | null>;
  crear(datos: {
    estacionId: number;
    causaFallaId: number;
    desde: Date;
    observacion: string | null;
    usuarioId: number;
  }): Promise<FallaEstacionDto>;
  actualizar(
    id: bigint,
    datos: { causaFallaId?: number; desde?: Date; observacion?: string | null },
    usuarioId: number,
  ): Promise<FallaEstacionDto>;
  resolver(
    id: bigint,
    datos: { resueltaEn: Date; observacion?: string | null },
    usuarioId: number,
  ): Promise<FallaEstacionDto>;
  disponibilidad(alDia: Date): Promise<DisponibilidadDto>;
  serie(anio: number): Promise<SerieDisponibilidadDto>;
  listHistorial(fallaId: bigint, skip: number, take: number): Promise<FallaHistorialEntryDto[]>;
  countHistorial(fallaId: bigint): Promise<number>;
}

const fallaSelect = {
  id: true,
  desde: true,
  resueltaEn: true,
  observacion: true,
  causaFalla: { select: { id: true, nombre: true, activo: true } },
  usuario: { select: { id: true, nombre: true } },
  usuarioResolvio: { select: { id: true, nombre: true } },
  estacion: {
    select: {
      id: true,
      nodo: true,
      nombre: true,
      tipoRed: true,
      area: { select: { id: true, nombre: true, region: { select: { id: true, nombre: true } } } },
    },
  },
  _count: { select: { historial: true } },
} satisfies Prisma.FallaEstacionSelect;

const aDto = (f: Prisma.FallaEstacionGetPayload<{ select: typeof fallaSelect }>): FallaEstacionDto => ({
  id: f.id.toString(),
  estacion: {
    id: f.estacion.id,
    nodo: f.estacion.nodo,
    nombre: f.estacion.nombre,
    area: { id: f.estacion.area.id, nombre: f.estacion.area.nombre },
    region: { id: f.estacion.area.region.id, nombre: f.estacion.area.region.nombre },
    tipoRed: f.estacion.tipoRed,
  },
  causaFalla: f.causaFalla,
  desde: dateToFecha(f.desde),
  resueltaEn: f.resueltaEn ? dateToFecha(f.resueltaEn) : null,
  diasCaida: diasEntre(f.desde, f.resueltaEn ?? hoyUtc()),
  observacion: f.observacion,
  registradaPor: { id: f.usuario.id, nombre: f.usuario.nombre },
  resueltaPor: f.usuarioResolvio ? { id: f.usuarioResolvio.id, nombre: f.usuarioResolvio.nombre } : null,
  correcciones: f._count.historial,
});

const mensajes = {
  repetido: "Esa estación ya tiene una falla abierta: hay que resolverla antes de abrir otra",
  noExiste: "No existe la estación o la causa de falla",
};

/** Un porcentaje sólo existe si hay denominador; si no, viaja `null` y la
 *  pantalla lo dice, en vez de inventar un 0 o un 100 (mismo criterio §14.4). */
const porcentaje = (parte: number, total: number): number | null =>
  total === 0 ? null : Number(((parte / total) * 100).toFixed(2));

export const fallaRepository: IFallaRepository = {
  async listar(filtros) {
    const {
      page,
      pageSize,
      estacionId,
      regionId,
      areaId,
      causaFallaId,
      soloAbiertas,
      tipoRed,
      desde,
      hasta,
      q,
    } = filtros;

    const sobreLaEstacion: Prisma.EstacionWhereInput = {
      ...(areaId ? { areaId } : {}),
      ...(regionId ? { area: { regionId } } : {}),
      ...(tipoRed ? { tipoRed } : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { nodo: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const where: Prisma.FallaEstacionWhereInput = {
      ...(estacionId ? { estacionId } : {}),
      ...(causaFallaId ? { causaFallaId } : {}),
      ...(soloAbiertas ? { resueltaEn: null } : {}),
      ...(Object.keys(sobreLaEstacion).length > 0 ? { estacion: sobreLaEstacion } : {}),
      // El rango filtra por **solapamiento**, no por contención: una falla
      // abierta en 2018 es parte de lo que pasa en 2026. Va en un `AND` porque
      // las dos mitades escriben claves que el resto del filtro también usa.
      ...(desde || hasta
        ? {
            AND: [
              ...(desde
                ? [
                    {
                      OR: [
                        { resueltaEn: null },
                        { resueltaEn: { gte: fechaToDate(desde) } },
                      ],
                    } satisfies Prisma.FallaEstacionWhereInput,
                  ]
                : []),
              ...(hasta ? [{ desde: { lte: fechaToDate(hasta) } }] : []),
            ],
          }
        : {}),
    };

    const [filas, total] = await Promise.all([
      prisma.fallaEstacion.findMany({
        where,
        select: fallaSelect,
        orderBy: [{ resueltaEn: { sort: "asc", nulls: "first" } }, { desde: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.fallaEstacion.count({ where }),
    ]);
    return { items: filas.map(aDto), total };
  },

  async obtener(id) {
    const f = await prisma.fallaEstacion.findUnique({ where: { id }, select: fallaSelect });
    return f ? aDto(f) : null;
  },

  async crear(datos) {
    try {
      return aDto(await prisma.fallaEstacion.create({ data: datos, select: fallaSelect }));
    } catch (err) {
      throw traducirEscritura(err, mensajes);
    }
  },

  // Corrección y bitácora en una sola transacción: si falla el historial no
  // puede quedar el estado cambiado sin rastro (§15.5, mismo criterio que
  // `LecturaBalanceRepository.corregir`, decisión #3).
  async actualizar(id, datos, usuarioId) {
    try {
      return await prisma.$transaction(async (tx) => {
        const actual = await tx.fallaEstacion.findUniqueOrThrow({ where: { id } });
        await tx.fallaEstacionHistorial.create({
          data: {
            fallaId: id,
            causaFallaIdAnt: actual.causaFallaId,
            desdeAnt: actual.desde,
            observacionAnt: actual.observacion,
            usuarioId,
          },
        });
        return aDto(
          await tx.fallaEstacion.update({ where: { id }, data: datos, select: fallaSelect }),
        );
      });
    } catch (err) {
      throw traducirEscritura(err, { ...mensajes, noExiste: "No existe la falla o la causa indicada" });
    }
  },

  async resolver(id, datos, usuarioId) {
    try {
      return aDto(
        await prisma.fallaEstacion.update({
          where: { id },
          data: { ...datos, usuarioResolvioId: usuarioId },
          select: fallaSelect,
        }),
      );
    } catch (err) {
      throw traducirEscritura(err, { ...mensajes, noExiste: "No existe la falla" });
    }
  },

  listHistorial(fallaId, skip, take) {
    return prisma.fallaEstacionHistorial
      .findMany({
        where: { fallaId },
        select: {
          id: true,
          causaFallaIdAnt: true,
          desdeAnt: true,
          observacionAnt: true,
          usuarioId: true,
          usuario: { select: { nombre: true } },
          modificadoEn: true,
        },
        orderBy: { modificadoEn: "desc" },
        skip,
        take,
      })
      .then((filas) =>
        filas.map(
          (h): FallaHistorialEntryDto => ({
            id: h.id.toString(),
            causaFallaIdAnt: h.causaFallaIdAnt,
            desdeAnt: dateToFecha(h.desdeAnt),
            observacionAnt: h.observacionAnt,
            usuarioId: h.usuarioId,
            usuarioNombre: h.usuario.nombre,
            modificadoEn: h.modificadoEn.toISOString(),
          }),
        ),
      );
  },

  countHistorial(fallaId) {
    return prisma.fallaEstacionHistorial.count({ where: { fallaId } });
  },

  async disponibilidad(alDia) {
    const vigente = fallaVigenteWhere(alDia);

    const [estaciones, fallas] = await Promise.all([
      prisma.estacion.findMany({
        select: { id: true, tipoRed: true, areaId: true, area: { select: { regionId: true } } },
      }),
      prisma.fallaEstacion.findMany({
        where: vigente,
        select: {
          estacionId: true,
          causaFalla: { select: { id: true, nombre: true, activo: true } },
        },
      }),
    ]);

    const caidas = new Set(fallas.map((f) => f.estacionId));
    const total = estaciones.length;
    const enFalla = estaciones.filter((e) => caidas.has(e.id)).length;
    const disponibles = total - enFalla;

    const disponiblesPorRed = estaciones.filter((e) => !caidas.has(e.id));
    const agrupar = (
      claves: Map<number, string>,
      clave: (e: (typeof estaciones)[number]) => number,
    ) =>
      [...claves.entries()]
        .map(([id, nombre]) => {
          const propias = estaciones.filter((e) => clave(e) === id);
          const caidasAca = propias.filter((e) => caidas.has(e.id)).length;
          return {
            id,
            nombre,
            total: propias.length,
            disponibles: propias.length - caidasAca,
            enFalla: caidasAca,
            porcentajeDisponible: porcentaje(propias.length - caidasAca, propias.length),
          };
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const [regiones, areas] = await Promise.all([
      prisma.regionMtto.findMany({ select: { id: true, nombre: true } }),
      prisma.areaMtto.findMany({ select: { id: true, nombre: true } }),
    ]);

    const porCausa = new Map<number, { causaFalla: (typeof fallas)[number]["causaFalla"]; cantidad: number }>();
    for (const f of fallas) {
      const previa = porCausa.get(f.causaFalla.id);
      if (previa) previa.cantidad += 1;
      else porCausa.set(f.causaFalla.id, { causaFalla: f.causaFalla, cantidad: 1 });
    }

    return {
      fecha: dateToFecha(alDia),
      total,
      disponibles,
      enFalla,
      porcentajeDisponible: porcentaje(disponibles, total),
      porTipoRed: {
        transporte: disponiblesPorRed.filter((e) => e.tipoRed === "TRANSPORTE").length,
        distribucion: disponiblesPorRed.filter((e) => e.tipoRed === "DISTRIBUCION").length,
        sinClasificar: disponiblesPorRed.filter((e) => e.tipoRed === null).length,
      },
      porRegion: agrupar(new Map(regiones.map((r) => [r.id, r.nombre])), (e) => e.area.regionId),
      porArea: agrupar(new Map(areas.map((a) => [a.id, a.nombre])), (e) => e.areaId),
      porCausa: [...porCausa.values()].sort((a, b) => b.cantidad - a.cantidad),
    };
  },

  /**
   * Las 52 semanas del año contra la meta. Se resuelve con **una** consulta de
   * todas las fallas que tocan el año y el cruce en memoria: preguntar la
   * disponibilidad semana por semana serían 52 viajes a la base para un
   * gráfico.
   */
  async serie(anio) {
    const lunes = lunesDelAnio(anio);
    const finDeAnio = new Date(Date.UTC(anio, 11, 31));

    const [estaciones, fallas] = await Promise.all([
      prisma.estacion.findMany({ select: { id: true, tipoRed: true } }),
      prisma.fallaEstacion.findMany({
        where: {
          desde: { lte: finDeAnio },
          OR: [{ resueltaEn: null }, { resueltaEn: { gte: new Date(Date.UTC(anio, 0, 1)) } }],
        },
        select: { estacionId: true, desde: true, resueltaEn: true },
      }),
    ]);

    const porRed = new Map(estaciones.map((e) => [e.id, e.tipoRed]));
    const total = estaciones.length;

    const semanas: SemanaDisponibilidadDto[] = lunes.map((fecha, i) => {
      // Mismo criterio que `fallaVigenteWhere`: el día en que se resuelve, la
      // estación ya cuenta como disponible.
      const caidas = new Set(
        fallas
          .filter((f) => f.desde <= fecha && (f.resueltaEn === null || f.resueltaEn > fecha))
          .map((f) => f.estacionId),
      );
      let transporte = 0;
      let distribucion = 0;
      let disponibles = 0;
      for (const [id, red] of porRed) {
        if (caidas.has(id)) continue;
        disponibles += 1;
        if (red === "TRANSPORTE") transporte += 1;
        else if (red === "DISTRIBUCION") distribucion += 1;
      }
      return {
        semana: i + 1,
        fecha: dateToFecha(fecha),
        transporte,
        distribucion,
        total: disponibles,
        porcentajeDisponible: porcentaje(disponibles, total),
      };
    });

    return { anio: String(anio), metaPorcentaje: 95, totalEstaciones: total, semanas };
  },
};
