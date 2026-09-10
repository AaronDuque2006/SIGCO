import { Prisma } from "@sicog/db";
import { prisma } from "../../../shared/prisma-client.js";
import { dateToFecha, fechaToDate } from "./lectura-balance.repository.js";

// Un valor que tuvo el PUNTUAL ese día, con el usuario responsable del último.
export interface ValoresDelDia {
  lecturaId: bigint;
  clienteId: number;
  usuarioId: number;
  valores: Prisma.Decimal[];
}

export interface CierreExistente {
  id: bigint;
  clienteId: number;
  volumenMmpced: Prisma.Decimal;
}

export interface ICierreDiarioRepository {
  fechasConPuntualHasta(hasta: string): Promise<string[]>;
  ultimaFechaConPuntual(): Promise<string | null>;
  valoresPuntualDelDia(fecha: string): Promise<ValoresDelDia[]>;
  cierresDelDia(fecha: string): Promise<CierreExistente[]>;
  guardarCierres(
    fecha: string,
    nuevos: { clienteId: number; volumenMmpced: Prisma.Decimal; usuarioId: number }[],
    correcciones: { id: bigint; volumenMmpced: Prisma.Decimal; usuarioId: number }[],
  ): Promise<void>;
  clientesConPuntual(fecha: string): Promise<number[]>;
  copiarPuntualAlDiaSiguiente(desde: string, hacia: string): Promise<number>;
  quemaValoresDelDia(fecha: string): Promise<ValoresDelDia | null>;
  quemaCierreDelDia(fecha: string): Promise<{ id: bigint; mmpced: Prisma.Decimal } | null>;
  guardarQuemaCierre(
    fecha: string,
    valor: Prisma.Decimal,
    usuarioId: number,
    existente: { id: bigint } | null,
  ): Promise<void>;
}

export class PrismaCierreDiarioRepository implements ICierreDiarioRepository {
  async fechasConPuntualHasta(hasta: string): Promise<string[]> {
    const filas = await prisma.lecturaBalance.groupBy({
      by: ["fecha"],
      where: { tipoCorte: "PUNTUAL", fecha: { lte: fechaToDate(hasta) } },
      orderBy: { fecha: "asc" },
    });
    return filas.map((f) => dateToFecha(f.fecha));
  }

  async ultimaFechaConPuntual(): Promise<string | null> {
    const fila = await prisma.lecturaBalance.findFirst({
      where: { tipoCorte: "PUNTUAL" },
      orderBy: { fecha: "desc" },
      select: { fecha: true },
    });
    return fila ? dateToFecha(fila.fecha) : null;
  }

  // Todo el historial de la lectura cuenta, sin filtrar por cuándo se hizo la
  // corrección: la fila ya está atada a una fecha, así que sus valores son los
  // que tuvo ese día aunque alguien la corrija días después (decisión #44).
  async valoresPuntualDelDia(fecha: string): Promise<ValoresDelDia[]> {
    const lecturas = await prisma.lecturaBalance.findMany({
      where: { fecha: fechaToDate(fecha), tipoCorte: "PUNTUAL" },
      select: {
        id: true,
        clienteId: true,
        usuarioId: true,
        volumenMmpced: true,
        historial: { select: { volumenMmpcedAnt: true } },
      },
    });
    return lecturas.map((l) => ({
      lecturaId: l.id,
      clienteId: l.clienteId,
      usuarioId: l.usuarioId,
      valores: [...l.historial.map((h) => h.volumenMmpcedAnt), l.volumenMmpced],
    }));
  }

  cierresDelDia(fecha: string): Promise<CierreExistente[]> {
    return prisma.lecturaBalance.findMany({
      where: { fecha: fechaToDate(fecha), tipoCorte: "CIERRE_PROMEDIO" },
      select: { id: true, clienteId: true, volumenMmpced: true },
    });
  }

  async guardarCierres(
    fecha: string,
    nuevos: { clienteId: number; volumenMmpced: Prisma.Decimal; usuarioId: number }[],
    correcciones: { id: bigint; volumenMmpced: Prisma.Decimal; usuarioId: number }[],
  ): Promise<void> {
    if (nuevos.length === 0 && correcciones.length === 0) return;

    await prisma.$transaction(async (tx) => {
      if (nuevos.length > 0) {
        await tx.lecturaBalance.createMany({
          data: nuevos.map((n) => ({ ...n, fecha: fechaToDate(fecha), tipoCorte: "CIERRE_PROMEDIO" as const })),
        });
      }
      // Recalcular un cierre ya emitido es una corrección como cualquier otra:
      // deja su fila de historial (decisión #44).
      for (const c of correcciones) {
        const actual = await tx.lecturaBalance.findUniqueOrThrow({ where: { id: c.id } });
        await tx.lecturaBalanceHistorial.create({
          data: { lecturaId: c.id, volumenMmpcedAnt: actual.volumenMmpced, usuarioId: c.usuarioId },
        });
        await tx.lecturaBalance.update({
          where: { id: c.id },
          data: { volumenMmpced: c.volumenMmpced, usuarioId: c.usuarioId },
        });
      }
    });
  }

  async clientesConPuntual(fecha: string): Promise<number[]> {
    const filas = await prisma.lecturaBalance.findMany({
      where: { fecha: fechaToDate(fecha), tipoCorte: "PUNTUAL" },
      select: { clienteId: true },
    });
    return filas.map((f) => f.clienteId);
  }

  // Carry-forward (decisión #43): el día nuevo arranca con el último valor
  // vigente. `skipDuplicates` deja la operación repetible sin duplicar filas.
  async copiarPuntualAlDiaSiguiente(desde: string, hacia: string): Promise<number> {
    const origen = await prisma.lecturaBalance.findMany({
      where: { fecha: fechaToDate(desde), tipoCorte: "PUNTUAL" },
      select: { clienteId: true, volumenMmpced: true, usuarioId: true },
    });
    if (origen.length === 0) return 0;

    const { count } = await prisma.lecturaBalance.createMany({
      data: origen.map((o) => ({ ...o, fecha: fechaToDate(hacia), tipoCorte: "PUNTUAL" as const })),
      skipDuplicates: true,
    });
    return count;
  }

  async quemaValoresDelDia(fecha: string): Promise<ValoresDelDia | null> {
    const quema = await prisma.quemaNacional.findFirst({
      where: { fecha: fechaToDate(fecha), tipoCorte: "PUNTUAL" },
      select: { id: true, usuarioId: true, mmpced: true, historial: { select: { mmpcedAnt: true } } },
    });
    if (!quema) return null;
    return {
      lecturaId: quema.id,
      clienteId: 0,
      usuarioId: quema.usuarioId,
      valores: [...quema.historial.map((h) => h.mmpcedAnt), quema.mmpced],
    };
  }

  quemaCierreDelDia(fecha: string): Promise<{ id: bigint; mmpced: Prisma.Decimal } | null> {
    return prisma.quemaNacional.findFirst({
      where: { fecha: fechaToDate(fecha), tipoCorte: "CIERRE_PROMEDIO" },
      select: { id: true, mmpced: true },
    });
  }

  async guardarQuemaCierre(
    fecha: string,
    valor: Prisma.Decimal,
    usuarioId: number,
    existente: { id: bigint } | null,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      if (!existente) {
        await tx.quemaNacional.create({
          data: { fecha: fechaToDate(fecha), tipoCorte: "CIERRE_PROMEDIO", mmpced: valor, usuarioId },
        });
        return;
      }
      const actual = await tx.quemaNacional.findUniqueOrThrow({ where: { id: existente.id } });
      await tx.quemaNacionalHistorial.create({
        data: { quemaNacionalId: existente.id, mmpcedAnt: actual.mmpced, usuarioId },
      });
      await tx.quemaNacional.update({
        where: { id: existente.id },
        data: { mmpced: valor, usuarioId },
      });
    });
  }
}

export const cierreDiarioRepository = new PrismaCierreDiarioRepository();
