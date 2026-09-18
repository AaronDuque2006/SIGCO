import { Prisma } from "@sicog/db";
import type { ActividadRegistroDto, ResponsableDto } from "@sicog/shared-types";
import type { ListActividadRegistrosQuery } from "@sicog/shared-validators";
import { prisma } from "../../../shared/prisma-client.js";
import { traducirEscritura } from "../../../shared/prisma-errores.js";
import { dateToFecha, fechaToDate } from "../../../shared/fechas.js";

export interface DatosRegistro {
  productoServicioId: number;
  gerenciaRequirienteId: number;
  regionId: number | null;
  usuarioId: number;
  fechaDesde: string;
  fechaHasta: string;
  cantidad: number;
  hh: number | null;
  estatus: string;
  detalle: string | null;
}

export interface IRegistroActividadRepository {
  listar(
    filtros: ListActividadRegistrosQuery,
  ): Promise<{ filas: ActividadRegistroDto[]; total: number }>;
  obtener(id: bigint): Promise<ActividadRegistroDto | null>;
  crear(datos: DatosRegistro): Promise<ActividadRegistroDto>;
  actualizar(id: bigint, datos: Partial<DatosRegistro>): Promise<ActividadRegistroDto>;
  /** El departamento dueño de un producto/servicio, vía su insumo. */
  departamentoDeProducto(id: number): Promise<number | null>;
  departamentoDeGerencia(id: number): Promise<number | null>;
  /** Toda la cadena de supervisión **hacia abajo**, incluida la persona. */
  cadenaHaciaAbajo(usuarioId: number): Promise<number[]>;
  /** A nombre de quién se puede registrar en un departamento. */
  responsables(departamentoId: number): Promise<ResponsableDto[]>;
}

const select = {
  id: true,
  fechaDesde: true,
  fechaHasta: true,
  cantidad: true,
  hh: true,
  estatus: true,
  detalle: true,
  productoServicio: {
    select: {
      id: true,
      nombre: true,
      descripcionActividad: true,
      activo: true,
      insumo: {
        select: {
          id: true,
          nombre: true,
          activo: true,
          departamento: { select: { id: true, nombre: true } },
        },
      },
    },
  },
  gerenciaRequiriente: {
    select: {
      id: true,
      nombre: true,
      activo: true,
      departamento: { select: { id: true, nombre: true } },
    },
  },
  region: { select: { id: true, nombre: true } },
  usuario: { select: { id: true, nombre: true, puesto: { select: { nombre: true } } } },
} as const;

type Fila = Prisma.ActividadRegistroGetPayload<{ select: typeof select }>;

const aDto = (f: Fila): ActividadRegistroDto => ({
  id: String(f.id),
  productoServicio: {
    id: f.productoServicio.id,
    insumo: {
      id: f.productoServicio.insumo.id,
      departamento: f.productoServicio.insumo.departamento,
      nombre: f.productoServicio.insumo.nombre,
      activo: f.productoServicio.insumo.activo,
    },
    nombre: f.productoServicio.nombre,
    descripcionActividad: f.productoServicio.descripcionActividad,
    activo: f.productoServicio.activo,
  },
  gerenciaRequiriente: {
    id: f.gerenciaRequiriente.id,
    departamento: f.gerenciaRequiriente.departamento,
    nombre: f.gerenciaRequiriente.nombre,
    activo: f.gerenciaRequiriente.activo,
  },
  region: f.region,
  usuario: { id: f.usuario.id, nombre: f.usuario.nombre, puesto: f.usuario.puesto.nombre },
  fechaDesde: dateToFecha(f.fechaDesde),
  fechaHasta: dateToFecha(f.fechaHasta),
  cantidad: f.cantidad,
  // `Decimal` viaja como number (§11.1). Es `null` mientras la tarea esté
  // asignada y sin ejecutar.
  hh: f.hh === null ? null : Number(f.hh),
  estatus: f.estatus as ActividadRegistroDto["estatus"],
  detalle: f.detalle,
});

const aDatosPrisma = (d: Partial<DatosRegistro>): Prisma.ActividadRegistroUncheckedUpdateInput => ({
  ...(d.productoServicioId === undefined ? {} : { productoServicioId: d.productoServicioId }),
  ...(d.gerenciaRequirienteId === undefined
    ? {}
    : { gerenciaRequirienteId: d.gerenciaRequirienteId }),
  ...(d.regionId === undefined ? {} : { regionId: d.regionId }),
  ...(d.usuarioId === undefined ? {} : { usuarioId: d.usuarioId }),
  ...(d.fechaDesde === undefined ? {} : { fechaDesde: fechaToDate(d.fechaDesde) }),
  ...(d.fechaHasta === undefined ? {} : { fechaHasta: fechaToDate(d.fechaHasta) }),
  ...(d.cantidad === undefined ? {} : { cantidad: d.cantidad }),
  ...(d.hh === undefined ? {} : { hh: d.hh }),
  ...(d.estatus === undefined ? {} : { estatus: d.estatus }),
  ...(d.detalle === undefined ? {} : { detalle: d.detalle }),
});

export class PrismaRegistroActividadRepository implements IRegistroActividadRepository {
  async listar(
    f: ListActividadRegistrosQuery,
  ): Promise<{ filas: ActividadRegistroDto[]; total: number }> {
    const where: Prisma.ActividadRegistroWhereInput = {
      ...(f.productoServicioId === undefined
        ? {}
        : { productoServicioId: f.productoServicioId }),
      ...(f.gerenciaRequirienteId === undefined
        ? {}
        : { gerenciaRequirienteId: f.gerenciaRequirienteId }),
      ...(f.estatus === undefined ? {} : { estatus: f.estatus }),
      // El alcance nacional **es** la ausencia de región, así que no se puede
      // pedir con `regionId`: hace falta la bandera propia.
      ...(f.soloNacional === true ? { regionId: null } : {}),
      ...(f.regionId === undefined ? {} : { regionId: f.regionId }),
      ...(f.insumoId === undefined ? {} : { productoServicio: { insumoId: f.insumoId } }),
      ...(f.departamentoId === undefined
        ? {}
        : { productoServicio: { insumo: { departamentoId: f.departamentoId } } }),
      ...(f.q === undefined ? {} : { detalle: { contains: f.q, mode: "insensitive" } }),
    };

    if (f.usuarioId !== undefined) {
      where.usuarioId =
        f.cadena === true ? { in: await this.cadenaHaciaAbajo(f.usuarioId) } : f.usuarioId;
    }

    // El rango se compara contra el solapamiento y no contra `fechaDesde`: una
    // actividad que empezó en enero y terminó en febrero pertenece a los dos
    // meses cuando alguien filtra por cualquiera de ellos.
    if (f.desde !== undefined) where.fechaHasta = { gte: fechaToDate(f.desde) };
    if (f.hasta !== undefined) where.fechaDesde = { lte: fechaToDate(f.hasta) };

    const [filas, total] = await Promise.all([
      prisma.actividadRegistro.findMany({
        where,
        select,
        orderBy: [{ fechaHasta: "desc" }, { id: "desc" }],
        skip: (f.page - 1) * f.pageSize,
        take: f.pageSize,
      }),
      prisma.actividadRegistro.count({ where }),
    ]);

    return { filas: filas.map(aDto), total };
  }

  async obtener(id: bigint): Promise<ActividadRegistroDto | null> {
    const f = await prisma.actividadRegistro.findUnique({ where: { id }, select });
    return f === null ? null : aDto(f);
  }

  async crear(datos: DatosRegistro): Promise<ActividadRegistroDto> {
    try {
      const f = await prisma.actividadRegistro.create({
        data: {
          productoServicioId: datos.productoServicioId,
          gerenciaRequirienteId: datos.gerenciaRequirienteId,
          regionId: datos.regionId,
          usuarioId: datos.usuarioId,
          fechaDesde: fechaToDate(datos.fechaDesde),
          fechaHasta: fechaToDate(datos.fechaHasta),
          cantidad: datos.cantidad,
          hh: datos.hh,
          estatus: datos.estatus,
          detalle: datos.detalle,
        },
        select,
      });
      return aDto(f);
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe ese registro",
        noExiste: "Alguna referencia del registro no existe",
      });
    }
  }

  async actualizar(id: bigint, datos: Partial<DatosRegistro>): Promise<ActividadRegistroDto> {
    try {
      const f = await prisma.actividadRegistro.update({
        where: { id },
        data: aDatosPrisma(datos),
        select,
      });
      return aDto(f);
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe ese registro",
        noExiste: "No existe el registro, o alguna de sus referencias",
      });
    }
  }

  async departamentoDeProducto(id: number): Promise<number | null> {
    const f = await prisma.productoServicio.findUnique({
      where: { id },
      select: { insumo: { select: { departamentoId: true } } },
    });
    return f?.insumo.departamentoId ?? null;
  }

  async departamentoDeGerencia(id: number): Promise<number | null> {
    const f = await prisma.gerenciaRequiriente.findUnique({
      where: { id },
      select: { departamentoId: true },
    });
    return f?.departamentoId ?? null;
  }

  /**
   * La cadena completa hacia abajo, en **una** consulta recursiva.
   *
   * La decisión #25 dice "toda la cadena", no un nivel, así que recorrerla en
   * JavaScript serían tantas consultas como niveles tenga el organigrama. El
   * `CTE` recursivo lo resuelve de una y no puede entrar en bucle: la
   * decisión #13.2 hace cumplir que la cadena no tenga ciclos, y aun así el
   * `UNION` descarta los repetidos.
   *
   * Parametrizado, nunca concatenado (§3).
   */
  /**
   * Quiénes pueden ser responsables de una actividad del departamento.
   *
   * Existe porque `/api/usuarios` es exclusivo del superadmin (decisión #11) y
   * un Supervisor tiene que poder asignarle trabajo a su gente sin serlo. Sólo
   * expone id, nombre y puesto — nada que la pantalla no muestre ya en cada
   * fila de la bitácora— y deja fuera las cuentas bloqueadas, que no pueden
   * recibir una asignación.
   */
  async responsables(departamentoId: number): Promise<ResponsableDto[]> {
    const filas = await prisma.usuario.findMany({
      where: { departamentoId, bloqueado: false },
      select: { id: true, nombre: true, puesto: { select: { nombre: true } } },
      orderBy: { nombre: "asc" },
    });
    return filas.map((f) => ({ id: f.id, nombre: f.nombre, puesto: f.puesto.nombre }));
  }

  async cadenaHaciaAbajo(usuarioId: number): Promise<number[]> {
    const filas = await prisma.$queryRaw<{ id: number }[]>`
      WITH RECURSIVE cadena AS (
        SELECT id FROM usuarios WHERE id = ${usuarioId}
        UNION
        SELECT u.id FROM usuarios u JOIN cadena c ON u.supervisor_id = c.id
      )
      SELECT id FROM cadena
    `;
    return filas.map((f) => f.id);
  }
}

export const registroActividadRepository = new PrismaRegistroActividadRepository();
