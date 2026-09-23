import { Prisma, PrismaClientKnownRequestError } from "@sicog/db";
import { ConflictError } from "../../../shared/errors.js";
import { horaToDate } from "../../../shared/fechas.js";
import { prisma } from "../../../shared/prisma-client.js";
import { fechaToDate } from "./lectura-balance.repository.js";

export interface QuemaRow {
  id: bigint;
  fecha: Date;
  tipoCorte: "PUNTUAL" | "CIERRE_PROMEDIO";
  mmpced: Prisma.Decimal;
  horaLectura: Date | null;
  usuarioId: number;
  /** Ver `LecturaBalanceRow.usuario`. */
  usuario: { nombre: string };
  editadoEn: Date | null;
  editadoPor: { nombre: string } | null;
}

const CON_USUARIO = {
  usuario: { select: { nombre: true } },
  editadoPor: { select: { nombre: true } },
} as const;

export interface HistorialQuemaRow {
  id: bigint;
  mmpcedAnt: Prisma.Decimal;
  horaLecturaAnt: Date | null;
  editadoEn: Date | null;
  editadoPor: { nombre: string } | null;
  usuarioId: number;
  usuario: { nombre: string };
  modificadoEn: Date;
}

export interface IQuemaNacionalRepository {
  findDelDia(fecha: string, tipoCorte: "PUNTUAL" | "CIERRE_PROMEDIO"): Promise<QuemaRow | null>;
  findById(id: bigint): Promise<QuemaRow | null>;
  create(input: {
    fecha: string;
    mmpced: number;
    horaLectura?: string | null;
    usuarioId: number;
  }): Promise<QuemaRow>;
  corregir(
    id: bigint,
    mmpced: number,
    horaLectura: string | null | undefined,
    usuarioId: number,
  ): Promise<QuemaRow>;
  listHistorial(quemaId: bigint, skip: number, take: number): Promise<HistorialQuemaRow[]>;
  countHistorial(quemaId: bigint): Promise<number>;
  findHistorialById(id: bigint): Promise<{ id: bigint; quemaNacionalId: bigint; fecha: Date } | null>;
  editarHistorial(id: bigint, valorAnterior: number, editadoPorId: number): Promise<void>;
  editarValorVigente(id: bigint, valor: number, editadoPorId: number): Promise<void>;
}

/**
 * Una sola cifra por día y por corte — `@@unique(fecha, tipoCorte)`.
 *
 * Mismo trato que `LECTURA_BALANCE` (decisión #14): el `PUNTUAL` se corrige
 * varias veces al día y cada corrección deja historial, y el `CIERRE_PROMEDIO`
 * es la media de ese historial más el valor vigente, calculada por el job de
 * medianoche (decisión #34). Por eso el `create` de acá fija `PUNTUAL` y no lo
 * recibe: por la API no se digita un cierre.
 *
 * A diferencia de la quema por cliente, esta no cuelga de ninguna fila del
 * catálogo: es el total nacional, y no entra ni en el recibido ni en el
 * transportado del Balance Nación (decisión #62).
 */
export class PrismaQuemaNacionalRepository implements IQuemaNacionalRepository {
  findDelDia(
    fecha: string,
    tipoCorte: "PUNTUAL" | "CIERRE_PROMEDIO",
  ): Promise<QuemaRow | null> {
    return prisma.quemaNacional.findUnique({
      where: { fecha_tipoCorte: { fecha: fechaToDate(fecha), tipoCorte } },
      include: CON_USUARIO,
    });
  }

  findById(id: bigint): Promise<QuemaRow | null> {
    return prisma.quemaNacional.findUnique({ where: { id }, include: CON_USUARIO });
  }

  async create(input: {
    fecha: string;
    mmpced: number;
    horaLectura?: string | null;
    usuarioId: number;
  }): Promise<QuemaRow> {
    try {
      return await prisma.quemaNacional.create({
        data: {
          fecha: fechaToDate(input.fecha),
          tipoCorte: "PUNTUAL",
          mmpced: input.mmpced,
          horaLectura: horaToDate(input.horaLectura),
          usuarioId: input.usuarioId,
        },
        include: CON_USUARIO,
      });
    } catch (err) {
      // Se intenta insertar y se traduce la violación del @@unique, en vez de
      // consultar-y-después-insertar, que sería una carrera entre dos
      // reintentos simultáneos. Mismo criterio que las dos lecturas.
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError(`Ya existe la quema PUNTUAL de ${input.fecha}`);
      }
      throw err;
    }
  }

  // Corrección y bitácora en una sola transacción (decisión #3): si fallara el
  // historial no puede quedar el valor cambiado sin rastro.
  corregir(
    id: bigint,
    mmpced: number,
    horaLectura: string | null | undefined,
    usuarioId: number,
  ): Promise<QuemaRow> {
    return prisma.$transaction(async (tx) => {
      const actual = await tx.quemaNacional.findUniqueOrThrow({ where: { id } });
      await tx.quemaNacionalHistorial.create({
        data: {
          quemaNacionalId: id,
          mmpcedAnt: actual.mmpced,
          horaLecturaAnt: actual.horaLectura,
          usuarioId,
        },
      });
      return tx.quemaNacional.update({
        where: { id },
        data: {
          mmpced,
          ...(horaLectura !== undefined ? { horaLectura: horaToDate(horaLectura) } : {}),
          usuarioId,
        },
        include: CON_USUARIO,
      });
    });
  }

  listHistorial(quemaId: bigint, skip: number, take: number): Promise<HistorialQuemaRow[]> {
    return prisma.quemaNacionalHistorial.findMany({
      where: { quemaNacionalId: quemaId },
      select: {
        id: true,
        mmpcedAnt: true,
        horaLecturaAnt: true,
        editadoEn: true,
        editadoPor: { select: { nombre: true } },
        usuarioId: true,
        usuario: { select: { nombre: true } },
        modificadoEn: true,
      },
      orderBy: { modificadoEn: "desc" },
      skip,
      take,
    });
  }

  countHistorial(quemaId: bigint): Promise<number> {
    return prisma.quemaNacionalHistorial.count({ where: { quemaNacionalId: quemaId } });
  }

  async findHistorialById(
    id: bigint,
  ): Promise<{ id: bigint; quemaNacionalId: bigint; fecha: Date } | null> {
    const fila = await prisma.quemaNacionalHistorial.findUnique({
      where: { id },
      select: { id: true, quemaNacionalId: true, quemaNacional: { select: { fecha: true } } },
    });
    return fila
      ? { id: fila.id, quemaNacionalId: fila.quemaNacionalId, fecha: fila.quemaNacional.fecha }
      : null;
  }

  /** Ver `PrismaLecturaBalanceRepository.editarValorVigente`. */
  async editarValorVigente(id: bigint, valor: number, editadoPorId: number): Promise<void> {
    await prisma.quemaNacional.update({
      where: { id },
      data: { mmpced: valor, editadoPorId, editadoEn: new Date() },
    });
  }

  /** Ver `PrismaLecturaBalanceRepository.editarHistorial`. */
  async editarHistorial(id: bigint, valorAnterior: number, editadoPorId: number): Promise<void> {
    await prisma.quemaNacionalHistorial.update({
      where: { id },
      data: { mmpcedAnt: valorAnterior, editadoPorId, editadoEn: new Date() },
    });
  }
}

export const quemaNacionalRepository = new PrismaQuemaNacionalRepository();
