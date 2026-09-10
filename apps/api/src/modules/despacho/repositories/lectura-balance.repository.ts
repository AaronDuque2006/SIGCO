import { Prisma, PrismaClientKnownRequestError } from "@sicog/db";
import type { TipoCorte } from "@sicog/shared-types";
import { ConflictError } from "../../../shared/errors.js";
import { prisma } from "../../../shared/prisma-client.js";

// La columna es @db.Date. Se ancla todo a UTC para que "2026-09-10" vuelva
// como "2026-09-10" sin corrimiento por zona horaria del servidor.
export const fechaToDate = (fecha: string): Date => new Date(`${fecha}T00:00:00.000Z`);
export const dateToFecha = (fecha: Date): string => fecha.toISOString().slice(0, 10);

export interface FilaGrid {
  cliente: {
    id: number;
    nombre: string;
    region: { id: number; nombre: string };
    sistema: { id: number; nombre: string };
    sector: { id: number; nombre: string; activo: boolean };
  };
  lectura: LecturaBalanceRow | null;
}

export interface LecturaBalanceRow {
  id: bigint;
  clienteId: number;
  fecha: Date;
  tipoCorte: TipoCorte;
  volumenMmpced: Prisma.Decimal;
  usuarioId: number;
}

export interface HistorialRow {
  id: bigint;
  volumenMmpcedAnt: Prisma.Decimal;
  usuarioId: number;
  modificadoEn: Date;
}

export interface GridParams {
  fecha: string;
  tipoCorte: TipoCorte;
  sistemaId?: number;
  regionId?: number;
  skip?: number;
  take?: number;
}

export interface ILecturaBalanceRepository {
  findGrid(params: GridParams): Promise<FilaGrid[]>;
  countClientes(filtros: Pick<GridParams, "sistemaId" | "regionId">): Promise<number>;
  findById(id: bigint): Promise<LecturaBalanceRow | null>;
  clienteExiste(clienteId: number): Promise<boolean>;
  create(input: {
    clienteId: number;
    fecha: string;
    tipoCorte: TipoCorte;
    volumenMmpced: number;
    usuarioId: number;
  }): Promise<LecturaBalanceRow>;
  corregir(id: bigint, volumenMmpced: number, usuarioId: number): Promise<LecturaBalanceRow>;
  listHistorial(lecturaId: bigint, skip: number, take: number): Promise<HistorialRow[]>;
  countHistorial(lecturaId: bigint): Promise<number>;
}

export class PrismaLecturaBalanceRepository implements ILecturaBalanceRepository {
  async findGrid({ fecha, tipoCorte, sistemaId, regionId, skip, take }: GridParams): Promise<FilaGrid[]> {
    const clientes = await prisma.cliente.findMany({
      where: { sistemaId, regionId },
      select: {
        id: true,
        nombre: true,
        region: { select: { id: true, nombre: true } },
        sistema: { select: { id: true, nombre: true } },
        sector: { select: { id: true, nombre: true, activo: true } },
        lecturasBalance: {
          where: { fecha: fechaToDate(fecha), tipoCorte },
          select: {
            id: true,
            clienteId: true,
            fecha: true,
            tipoCorte: true,
            volumenMmpced: true,
            usuarioId: true,
          },
        },
      },
      orderBy: [{ sistema: { nombre: "asc" } }, { nombre: "asc" }],
      skip,
      take,
    });

    return clientes.map(({ lecturasBalance, ...cliente }) => ({
      cliente,
      lectura: lecturasBalance[0] ?? null,
    }));
  }

  countClientes({ sistemaId, regionId }: Pick<GridParams, "sistemaId" | "regionId">): Promise<number> {
    return prisma.cliente.count({ where: { sistemaId, regionId } });
  }

  findById(id: bigint): Promise<LecturaBalanceRow | null> {
    return prisma.lecturaBalance.findUnique({ where: { id } });
  }

  async clienteExiste(clienteId: number): Promise<boolean> {
    return (await prisma.cliente.count({ where: { id: clienteId } })) > 0;
  }

  // El @@unique(cliente,fecha,tipo_corte) es el mecanismo: se intenta insertar
  // y se traduce la violación, en vez de consultar-y-después-insertar, que
  // sería una carrera entre dos reintentos simultáneos.
  async create(input: {
    clienteId: number;
    fecha: string;
    tipoCorte: TipoCorte;
    volumenMmpced: number;
    usuarioId: number;
  }): Promise<LecturaBalanceRow> {
    try {
      return await prisma.lecturaBalance.create({
        data: { ...input, fecha: fechaToDate(input.fecha) },
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError(
          `Ya existe una lectura ${input.tipoCorte} para ese cliente en ${input.fecha}`,
        );
      }
      throw err;
    }
  }

  // Corrección y bitácora en una sola transacción: si falla el historial no
  // puede quedar el valor cambiado sin rastro (decisión #3).
  corregir(id: bigint, volumenMmpced: number, usuarioId: number): Promise<LecturaBalanceRow> {
    return prisma.$transaction(async (tx) => {
      const actual = await tx.lecturaBalance.findUniqueOrThrow({ where: { id } });
      await tx.lecturaBalanceHistorial.create({
        data: { lecturaId: id, volumenMmpcedAnt: actual.volumenMmpced, usuarioId },
      });
      return tx.lecturaBalance.update({
        where: { id },
        data: { volumenMmpced, usuarioId },
      });
    });
  }

  listHistorial(lecturaId: bigint, skip: number, take: number): Promise<HistorialRow[]> {
    return prisma.lecturaBalanceHistorial.findMany({
      where: { lecturaId },
      select: { id: true, volumenMmpcedAnt: true, usuarioId: true, modificadoEn: true },
      orderBy: { modificadoEn: "desc" },
      skip,
      take,
    });
  }

  countHistorial(lecturaId: bigint): Promise<number> {
    return prisma.lecturaBalanceHistorial.count({ where: { lecturaId } });
  }
}

export const lecturaBalanceRepository = new PrismaLecturaBalanceRepository();
