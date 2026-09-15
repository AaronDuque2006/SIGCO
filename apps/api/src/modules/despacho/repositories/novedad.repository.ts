import { Prisma, PrismaClientKnownRequestError } from "@sicog/db";
import { env } from "../../../shared/env.js";
import { NotFoundError } from "../../../shared/errors.js";
import { prisma } from "../../../shared/prisma-client.js";
import { sumarDias } from "../services/cierre-diario.service.js";

export interface NovedadRow {
  id: bigint;
  cliente: {
    id: number;
    nombre: string;
    region: { id: number; nombre: string };
    sistema: { id: number; nombre: string };
    sector: { id: number; nombre: string; activo: boolean };
  } | null;
  fuente: { id: number; nombre: string; sistema: { id: number; nombre: string } } | null;
  tipo: string;
  impacto: string;
  inicio: Date;
  fin: Date | null;
  causa: string;
  mmpcedAfectados: Prisma.Decimal;
  usuarioId: number;
  usuario: { nombre: string };
}

export interface ListNovedadesParams {
  desde?: string;
  hasta?: string;
  clienteId?: number;
  fuenteId?: number;
  skip: number;
  take: number;
}

export interface NovedadInput {
  clienteId?: number | null;
  fuenteId?: number | null;
  tipo: string;
  impacto: string;
  inicio: string;
  fin?: string | null;
  causa: string;
  mmpcedAfectados: number;
}

export interface INovedadRepository {
  list(params: ListNovedadesParams): Promise<NovedadRow[]>;
  count(filtros: Omit<ListNovedadesParams, "skip" | "take">): Promise<number>;
  findById(id: bigint): Promise<NovedadRow | null>;
  create(input: NovedadInput & { usuarioId: number }): Promise<NovedadRow>;
  update(id: bigint, input: Partial<NovedadInput>, usuarioId: number): Promise<NovedadRow>;
  listTipos(): Promise<string[]>;
}

const CAMPOS = {
  id: true,
  cliente: {
    select: {
      id: true,
      nombre: true,
      region: { select: { id: true, nombre: true } },
      sistema: { select: { id: true, nombre: true } },
      sector: { select: { id: true, nombre: true, activo: true } },
    },
  },
  fuente: {
    select: { id: true, nombre: true, sistema: { select: { id: true, nombre: true } } },
  },
  tipo: true,
  impacto: true,
  inicio: true,
  fin: true,
  causa: true,
  mmpcedAfectados: true,
  usuarioId: true,
  usuario: { select: { nombre: true } },
} as const;

/**
 * El desfase de `timeZone` respecto de UTC en ese instante, en milisegundos.
 *
 * Se calcula en vez de cablear `-04:00` porque la zona sale de
 * `CIERRE_DIARIO_TZ`, la misma que usa el job de cierre: si alguna vez se
 * despliega para otra gerencia, el filtro sigue siendo el del día de allá.
 */
const desfaseMs = (instante: Date, timeZone: string): number => {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instante);
  const valor = (tipo: string): number =>
    Number(partes.find((p) => p.type === tipo)?.value ?? "0");
  const local = Date.UTC(
    valor("year"),
    valor("month") - 1,
    valor("day"),
    valor("hour"),
    valor("minute"),
    valor("second"),
  );
  return instante.getTime() - local;
};

/**
 * El instante UTC en que arranca `fecha` en esa zona.
 *
 * `inicio` es un timestamp y no un `@db.Date` como las lecturas, así que
 * filtrar por medianoche UTC correría el corte cuatro horas: una novedad de
 * las 21:00 en Venezuela es 01:00 UTC del día siguiente, y aparecería en el
 * día equivocado. La guardia nocturna es justo cuando pasan las cosas.
 */
export const inicioDelDiaEn = (fecha: string, timeZone: string): Date => {
  const medianocheUtc = new Date(`${fecha}T00:00:00.000Z`);
  return new Date(medianocheUtc.getTime() + desfaseMs(medianocheUtc, timeZone));
};

export class PrismaNovedadRepository implements INovedadRepository {
  constructor(private readonly timeZone: string) {}

  private where({
    desde,
    hasta,
    clienteId,
    fuenteId,
  }: Omit<ListNovedadesParams, "skip" | "take">): Prisma.NovedadOperativaWhereInput {
    // `hasta` es inclusivo: se compara contra el arranque del día siguiente,
    // que es lo mismo y no deja fuera los últimos milisegundos de la jornada.
    const rango = {
      ...(desde ? { gte: inicioDelDiaEn(desde, this.timeZone) } : {}),
      ...(hasta ? { lt: inicioDelDiaEn(sumarDias(hasta, 1), this.timeZone) } : {}),
    };
    return {
      clienteId,
      fuenteId,
      ...(desde || hasta ? { inicio: rango } : {}),
    };
  }

  // Más recientes primero: una novedad se consulta por lo que está pasando
  // ahora, no por lo que pasó hace un mes.
  list({ skip, take, ...filtros }: ListNovedadesParams): Promise<NovedadRow[]> {
    return prisma.novedadOperativa.findMany({
      where: this.where(filtros),
      select: CAMPOS,
      orderBy: { inicio: "desc" },
      skip,
      take,
    });
  }

  count(filtros: Omit<ListNovedadesParams, "skip" | "take">): Promise<number> {
    return prisma.novedadOperativa.count({ where: this.where(filtros) });
  }

  findById(id: bigint): Promise<NovedadRow | null> {
    return prisma.novedadOperativa.findUnique({ where: { id }, select: CAMPOS });
  }

  async create(input: NovedadInput & { usuarioId: number }): Promise<NovedadRow> {
    try {
      return await prisma.novedadOperativa.create({
        data: {
          clienteId: input.clienteId ?? null,
          fuenteId: input.fuenteId ?? null,
          tipo: input.tipo,
          impacto: input.impacto,
          inicio: new Date(input.inicio),
          fin: input.fin ? new Date(input.fin) : null,
          causa: input.causa,
          mmpcedAfectados: input.mmpcedAfectados,
          usuarioId: input.usuarioId,
        },
        select: CAMPOS,
      });
    } catch (err) {
      throw traducir(err);
    }
  }

  /**
   * El origen no se puede mover (cliente ↔ fuente): `updateNovedadSchema` ya
   * omite los dos campos, así que nunca llegan acá. Cambiar de origen sería
   * otra novedad, no una corrección de esta.
   *
   * `usuarioId` pasa a ser el de quien edita, igual que en las lecturas: la
   * fila dice siempre quién responde por el contenido actual. A diferencia de
   * las lecturas, acá no hay tabla de historial — el modelo no la tiene.
   */
  async update(
    id: bigint,
    input: Partial<NovedadInput>,
    usuarioId: number,
  ): Promise<NovedadRow> {
    try {
      return await prisma.novedadOperativa.update({
        where: { id },
        data: {
          ...(input.tipo === undefined ? {} : { tipo: input.tipo }),
          ...(input.impacto === undefined ? {} : { impacto: input.impacto }),
          ...(input.inicio === undefined ? {} : { inicio: new Date(input.inicio) }),
          ...(input.fin === undefined ? {} : { fin: input.fin ? new Date(input.fin) : null }),
          ...(input.causa === undefined ? {} : { causa: input.causa }),
          ...(input.mmpcedAfectados === undefined
            ? {}
            : { mmpcedAfectados: input.mmpcedAfectados }),
          usuarioId,
        },
        select: CAMPOS,
      });
    } catch (err) {
      throw traducir(err, id);
    }
  }

  /**
   * Los valores de `tipo` ya usados, para sugerirlos al cargar una novedad.
   *
   * La lista cerrada del catálogo sigue abierta (§9.2 #4): el único valor
   * conocido es "Corrida de Pig". En vez de inventar un catálogo, la pantalla
   * ofrece lo que el área ya escribió. Cuando la lista se cierre, esto se
   * reemplaza por una tabla editable como se hizo con Actividades y Telemetría.
   */
  async listTipos(): Promise<string[]> {
    const filas = await prisma.novedadOperativa.findMany({
      distinct: ["tipo"],
      select: { tipo: true },
      orderBy: { tipo: "asc" },
    });
    return filas.map((f) => f.tipo);
  }
}

function traducir(err: unknown, id?: bigint): unknown {
  if (err instanceof PrismaClientKnownRequestError) {
    // El cliente o la fuente indicada no existe.
    if (err.code === "P2003") return new NotFoundError("El cliente o la fuente indicada no existe");
    if (err.code === "P2025") return new NotFoundError(`No existe la novedad ${id ?? ""}`.trim());
  }
  return err;
}

// La misma zona que usa el job de cierre: el día operativo es uno solo.
export const novedadRepository = new PrismaNovedadRepository(env.CIERRE_DIARIO_TZ);
