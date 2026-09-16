import { Prisma, PrismaClientKnownRequestError } from "@sicog/db";
import type { TipoCorte } from "@sicog/shared-types";
import { ConflictError } from "../../../shared/errors.js";
import { prisma } from "../../../shared/prisma-client.js";
import { fechaToDate } from "./lectura-balance.repository.js";

export interface PuntoRow {
  id: number;
  nombre: string;
  destino: string;
  bidireccional: boolean;
  sistema: { id: number; nombre: string };
  subSistema: { id: number; nombre: string } | null;
}

export interface LecturaTransferenciaRow {
  id: bigint;
  puntoId: number;
  fecha: Date;
  tipoCorte: TipoCorte;
  mmpced: Prisma.Decimal;
  usuarioId: number;
}

export interface FilaTransferencia {
  punto: PuntoRow;
  lectura: LecturaTransferenciaRow | null;
  correcciones: number;
}

export interface HistorialTransferenciaRow {
  id: bigint;
  mmpcedAnt: Prisma.Decimal;
  usuarioId: number;
  usuario: { nombre: string };
  modificadoEn: Date;
}

export interface ITransferenciaRepository {
  findGrid(fecha: string, tipoCorte: TipoCorte): Promise<FilaTransferencia[]>;
  findPunto(puntoId: number): Promise<PuntoRow | null>;
  findById(id: bigint): Promise<LecturaTransferenciaRow | null>;
  create(input: {
    puntoId: number;
    fecha: string;
    mmpced: number;
    usuarioId: number;
  }): Promise<LecturaTransferenciaRow>;
  corregir(id: bigint, mmpced: number, usuarioId: number): Promise<LecturaTransferenciaRow>;
  listHistorial(
    lecturaId: bigint,
    skip: number,
    take: number,
  ): Promise<HistorialTransferenciaRow[]>;
  countHistorial(lecturaId: bigint): Promise<number>;
}

const CAMPOS_PUNTO = {
  id: true,
  nombre: true,
  destino: true,
  bidireccional: true,
  sistema: { select: { id: true, nombre: true } },
  subSistema: { select: { id: true, nombre: true } },
} as const;

/**
 * Las transferencias son pocas —cinco puntos— y se digitan junto al balance
 * del día, así que la grilla viene entera y sin paginar: no hay techo que
 * crezca.
 *
 * La mecánica es la misma que la de `LECTURA_BALANCE`: un valor por punto,
 * fecha y corte, historial obligatorio en la misma transacción (decisión #3), y
 * el `@@unique` traduciendo el reintento a `409`.
 */
export class PrismaTransferenciaRepository implements ITransferenciaRepository {
  async findGrid(fecha: string, tipoCorte: TipoCorte): Promise<FilaTransferencia[]> {
    const puntos = await prisma.puntoTransferencia.findMany({
      select: {
        ...CAMPOS_PUNTO,
        lecturas: {
          where: { fecha: fechaToDate(fecha), tipoCorte },
          select: {
            id: true,
            puntoId: true,
            fecha: true,
            tipoCorte: true,
            mmpced: true,
            usuarioId: true,
            _count: { select: { historial: true } },
          },
        },
      },
      orderBy: [{ sistema: { nombre: "asc" } }, { nombre: "asc" }],
    });

    return puntos.map(({ lecturas, ...punto }) => {
      const fila = lecturas[0];
      if (!fila) return { punto, lectura: null, correcciones: 0 };
      const { _count, ...lectura } = fila;
      return { punto, lectura, correcciones: _count.historial };
    });
  }

  findPunto(puntoId: number): Promise<PuntoRow | null> {
    return prisma.puntoTransferencia.findUnique({
      where: { id: puntoId },
      select: CAMPOS_PUNTO,
    });
  }

  findById(id: bigint): Promise<LecturaTransferenciaRow | null> {
    return prisma.lecturaTransferencia.findUnique({ where: { id } });
  }

  async create(input: {
    puntoId: number;
    fecha: string;
    mmpced: number;
    usuarioId: number;
  }): Promise<LecturaTransferenciaRow> {
    try {
      return await prisma.lecturaTransferencia.create({
        data: {
          puntoId: input.puntoId,
          fecha: fechaToDate(input.fecha),
          tipoCorte: "PUNTUAL",
          mmpced: input.mmpced,
          usuarioId: input.usuarioId,
        },
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError(
          `Ya existe una transferencia PUNTUAL para ese punto en ${input.fecha}`,
        );
      }
      throw err;
    }
  }

  corregir(id: bigint, mmpced: number, usuarioId: number): Promise<LecturaTransferenciaRow> {
    return prisma.$transaction(async (tx) => {
      const actual = await tx.lecturaTransferencia.findUniqueOrThrow({ where: { id } });
      await tx.lecturaTransferenciaHistorial.create({
        data: { lecturaId: id, mmpcedAnt: actual.mmpced, usuarioId },
      });
      return tx.lecturaTransferencia.update({ where: { id }, data: { mmpced, usuarioId } });
    });
  }

  listHistorial(
    lecturaId: bigint,
    skip: number,
    take: number,
  ): Promise<HistorialTransferenciaRow[]> {
    return prisma.lecturaTransferenciaHistorial.findMany({
      where: { lecturaId },
      select: {
        id: true,
        mmpcedAnt: true,
        usuarioId: true,
        usuario: { select: { nombre: true } },
        modificadoEn: true,
      },
      orderBy: { modificadoEn: "desc" },
      skip,
      take,
    });
  }

  countHistorial(lecturaId: bigint): Promise<number> {
    return prisma.lecturaTransferenciaHistorial.count({ where: { lecturaId } });
  }
}

export const transferenciaRepository = new PrismaTransferenciaRepository();
