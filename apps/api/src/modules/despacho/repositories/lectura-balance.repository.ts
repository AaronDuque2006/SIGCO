import { Prisma, PrismaClientKnownRequestError } from "@sicog/db";
import type { TipoCorte } from "@sicog/shared-types";
import { ConflictError } from "../../../shared/errors.js";
import { prisma } from "../../../shared/prisma-client.js";

import { dateToFecha, dateToHora, fechaToDate, horaToDate } from "../../../shared/fechas.js";

// Se reexportan: vivían acá y media docena de repositorios de Despacho las
// importan desde este archivo. Mudarlas a `shared/` no tiene por qué obligar a
// tocarlos a todos.
export { dateToFecha, fechaToDate };

export interface FilaGrid {
  cliente: {
    id: number;
    nombre: string;
    region: { id: number; nombre: string };
    sistema: { id: number; nombre: string };
    sector: { id: number; nombre: string; activo: boolean };
  };
  lectura: LecturaBalanceRow | null;
  /** Largo del historial de esa lectura; 0 si no hay lectura. */
  correcciones: number;
  /** El valor que tenía antes de la última corrección, para que la grilla
   *  pueda decir si subió o bajó. `null` si nunca se corrigió. */
  valorAnterior: Prisma.Decimal | null;
}

export interface LecturaBalanceRow {
  id: bigint;
  clienteId: number;
  fecha: Date;
  tipoCorte: TipoCorte;
  volumenMmpced: Prisma.Decimal;
  horaLectura: Date | null;
  usuarioId: number;
  /** Quién fijó el valor vigente. El historial ya traía el nombre de quien
   *  hizo cada corrección; la fila vigente lo necesita por lo mismo: el
   *  `usuarioId` solo no le dice nada a quien mira la cuadrícula. */
  usuario: { nombre: string };
  /** Y quién lo corrigió en el lugar después, si alguien lo hizo. */
  editadoEn: Date | null;
  editadoPor: { nombre: string } | null;
}

// Se repite en las consultas que devuelven `LecturaBalanceRow`.
const CON_USUARIO = {
  usuario: { select: { nombre: true } },
  editadoPor: { select: { nombre: true } },
} as const;

export interface HistorialRow {
  id: bigint;
  volumenMmpcedAnt: Prisma.Decimal;
  horaLecturaAnt: Date | null;
  editadoEn: Date | null;
  editadoPor: { nombre: string } | null;
  usuarioId: number;
  usuario: { nombre: string };
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
  findPuntualDe(clienteId: number, fecha: string): Promise<LecturaBalanceRow | null>;
  clienteExiste(clienteId: number): Promise<boolean>;
  create(input: {
    clienteId: number;
    fecha: string;
    tipoCorte: TipoCorte;
    volumenMmpced: number;
    horaLectura?: string | null;
    usuarioId: number;
  }): Promise<LecturaBalanceRow>;
  corregir(
    id: bigint,
    volumenMmpced: number,
    horaLectura: string | null | undefined,
    usuarioId: number,
  ): Promise<LecturaBalanceRow>;
  listHistorial(lecturaId: bigint, skip: number, take: number): Promise<HistorialRow[]>;
  countHistorial(lecturaId: bigint): Promise<number>;
  findHistorialById(id: bigint): Promise<{ id: bigint; lecturaId: bigint; fecha: Date } | null>;
  editarHistorial(id: bigint, valorAnterior: number, editadoPorId: number): Promise<void>;
  editarValorVigente(id: bigint, valor: number, editadoPorId: number): Promise<void>;
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
            horaLectura: true,
            usuarioId: true,
            editadoEn: true,
            ...CON_USUARIO,
            // El conteo del historial viaja con la grilla, en el mismo viaje.
            // Sirve para que la pantalla marque sólo las filas corregidas.
            _count: { select: { historial: true } },
            // Y con él, el valor que la corrección más reciente reemplazó:
            // es lo único que hace falta para dibujar la flecha de subió/bajó
            // en la grilla, y traerlo acá evita pedir el historial completo de
            // las 111 filas sólo para compararlo.
            historial: {
              orderBy: { modificadoEn: "desc" },
              take: 1,
              select: { volumenMmpcedAnt: true },
            },
          },
        },
      },
      orderBy: [{ sistema: { nombre: "asc" } }, { nombre: "asc" }],
      skip,
      take,
    });

    return clientes.map(({ lecturasBalance, ...cliente }) => {
      const fila = lecturasBalance[0];
      if (!fila) return { cliente, lectura: null, correcciones: 0, valorAnterior: null };
      const { _count, historial, ...lectura } = fila;
      return {
        cliente,
        lectura,
        correcciones: _count.historial,
        valorAnterior: historial[0]?.volumenMmpcedAnt ?? null,
      };
    });
  }

  countClientes({ sistemaId, regionId }: Pick<GridParams, "sistemaId" | "regionId">): Promise<number> {
    return prisma.cliente.count({ where: { sistemaId, regionId } });
  }

  findById(id: bigint): Promise<LecturaBalanceRow | null> {
    return prisma.lecturaBalance.findUnique({ where: { id }, include: CON_USUARIO });
  }

  findPuntualDe(clienteId: number, fecha: string): Promise<LecturaBalanceRow | null> {
    return prisma.lecturaBalance.findUnique({
      where: {
        clienteId_fecha_tipoCorte: { clienteId, fecha: fechaToDate(fecha), tipoCorte: "PUNTUAL" },
      },
      include: CON_USUARIO,
    });
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
    horaLectura?: string | null;
    usuarioId: number;
  }): Promise<LecturaBalanceRow> {
    try {
      return await prisma.lecturaBalance.create({
        data: {
          ...input,
          fecha: fechaToDate(input.fecha),
          horaLectura: horaToDate(input.horaLectura),
        },
        include: CON_USUARIO,
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
  //
  // `horaLectura === undefined` significa "no tocar" (el PATCH no la envió);
  // `null` es "borrarla" explícitamente. La foto en el historial guarda la
  // hora que tenía antes, igual que ya hace con el volumen.
  corregir(
    id: bigint,
    volumenMmpced: number,
    horaLectura: string | null | undefined,
    usuarioId: number,
  ): Promise<LecturaBalanceRow> {
    return prisma.$transaction(async (tx) => {
      const actual = await tx.lecturaBalance.findUniqueOrThrow({ where: { id } });
      await tx.lecturaBalanceHistorial.create({
        data: {
          lecturaId: id,
          volumenMmpcedAnt: actual.volumenMmpced,
          horaLecturaAnt: actual.horaLectura,
          usuarioId,
        },
      });
      return tx.lecturaBalance.update({
        where: { id },
        data: {
          volumenMmpced,
          ...(horaLectura !== undefined ? { horaLectura: horaToDate(horaLectura) } : {}),
          usuarioId,
        },
        include: CON_USUARIO,
      });
    });
  }

  listHistorial(lecturaId: bigint, skip: number, take: number): Promise<HistorialRow[]> {
    return prisma.lecturaBalanceHistorial.findMany({
      where: { lecturaId },
      select: {
        id: true,
        volumenMmpcedAnt: true,
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

  countHistorial(lecturaId: bigint): Promise<number> {
    return prisma.lecturaBalanceHistorial.count({ where: { lecturaId } });
  }

  async findHistorialById(
    id: bigint,
  ): Promise<{ id: bigint; lecturaId: bigint; fecha: Date } | null> {
    const fila = await prisma.lecturaBalanceHistorial.findUnique({
      where: { id },
      select: { id: true, lecturaId: true, lectura: { select: { fecha: true } } },
    });
    return fila ? { id: fila.id, lecturaId: fila.lecturaId, fecha: fila.lectura.fecha } : null;
  }

  /**
   * Pisa el valor vigente sin bajar el viejo al historial — a diferencia de
   * `corregir`, que sí registra la corrección. `usuarioId` no se toca: sigue
   * siendo quien fijó el valor, y el editor queda en `editadoPorId`.
   */
  async editarValorVigente(id: bigint, valor: number, editadoPorId: number): Promise<void> {
    await prisma.lecturaBalance.update({
      where: { id },
      data: { volumenMmpced: valor, editadoPorId, editadoEn: new Date() },
    });
  }

  // Pisa el valor que el analista había tecleado y deja constancia de quién
  // lo retocó: es el único rastro que queda (ver el comentario del schema).
  async editarHistorial(id: bigint, valorAnterior: number, editadoPorId: number): Promise<void> {
    await prisma.lecturaBalanceHistorial.update({
      where: { id },
      data: { volumenMmpcedAnt: valorAnterior, editadoPorId, editadoEn: new Date() },
    });
  }
}

export const lecturaBalanceRepository = new PrismaLecturaBalanceRepository();
