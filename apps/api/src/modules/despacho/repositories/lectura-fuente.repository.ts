import { Prisma, PrismaClientKnownRequestError } from "@sicog/db";
import { ConflictError } from "../../../shared/errors.js";
import { prisma } from "../../../shared/prisma-client.js";
import { fechaToDate } from "./lectura-balance.repository.js";

export interface FilaGridFuente {
  fuente: {
    id: number;
    nombre: string;
    sistema: { id: number; nombre: string };
  };
  lectura: LecturaFuenteRow | null;
  /** Ver `FilaGrid.correcciones` en `lectura-balance.repository.ts`. */
  correcciones: number;
}

export interface LecturaFuenteRow {
  id: bigint;
  fuenteId: number;
  fecha: Date;
  volumenMmpced: Prisma.Decimal;
  usuarioId: number;
}

export interface HistorialFuenteRow {
  id: bigint;
  volumenMmpcedAnt: Prisma.Decimal;
  usuarioId: number;
  usuario: { nombre: string };
  modificadoEn: Date;
}

export interface GridFuenteParams {
  fecha: string;
  sistemaId?: number;
  skip?: number;
  take?: number;
}

export interface ILecturaFuenteRepository {
  findGrid(params: GridFuenteParams): Promise<FilaGridFuente[]>;
  countFuentes(filtros: Pick<GridFuenteParams, "sistemaId">): Promise<number>;
  findById(id: bigint): Promise<LecturaFuenteRow | null>;
  fuenteExiste(fuenteId: number): Promise<boolean>;
  create(input: {
    fuenteId: number;
    fecha: string;
    volumenMmpced: number;
    usuarioId: number;
  }): Promise<LecturaFuenteRow>;
  corregir(id: bigint, volumenMmpced: number, usuarioId: number): Promise<LecturaFuenteRow>;
  listHistorial(lecturaId: bigint, skip: number, take: number): Promise<HistorialFuenteRow[]>;
  countHistorial(lecturaId: bigint): Promise<number>;
}

// Sin `tipoCorte` en ningún lado: el modelo tiene @@unique(fuenteId, fecha),
// una lectura por fuente por día. La mecánica puntual/cierre de la decisión
// #34 aplica a clientes y a la quema nacional, no a las fuentes.
export class PrismaLecturaFuenteRepository implements ILecturaFuenteRepository {
  async findGrid({ fecha, sistemaId, skip, take }: GridFuenteParams): Promise<FilaGridFuente[]> {
    const fuentes = await prisma.fuente.findMany({
      where: { sistemaId },
      select: {
        id: true,
        nombre: true,
        sistema: { select: { id: true, nombre: true } },
        lecturasFuente: {
          where: { fecha: fechaToDate(fecha) },
          select: {
            id: true,
            fuenteId: true,
            fecha: true,
            volumenMmpced: true,
            usuarioId: true,
            _count: { select: { historial: true } },
          },
        },
      },
      orderBy: [{ sistema: { nombre: "asc" } }, { nombre: "asc" }],
      skip,
      take,
    });

    return fuentes.map(({ lecturasFuente, ...fuente }) => {
      const fila = lecturasFuente[0];
      if (!fila) return { fuente, lectura: null, correcciones: 0 };
      const { _count, ...lectura } = fila;
      return { fuente, lectura, correcciones: _count.historial };
    });
  }

  countFuentes({ sistemaId }: Pick<GridFuenteParams, "sistemaId">): Promise<number> {
    return prisma.fuente.count({ where: { sistemaId } });
  }

  findById(id: bigint): Promise<LecturaFuenteRow | null> {
    return prisma.lecturaFuente.findUnique({ where: { id } });
  }

  async fuenteExiste(fuenteId: number): Promise<boolean> {
    return (await prisma.fuente.count({ where: { id: fuenteId } })) > 0;
  }

  // Mismo criterio que en balance: se intenta insertar y se traduce la
  // violación del @@unique, en vez de consultar-y-después-insertar, que sería
  // una carrera entre dos reintentos simultáneos.
  async create(input: {
    fuenteId: number;
    fecha: string;
    volumenMmpced: number;
    usuarioId: number;
  }): Promise<LecturaFuenteRow> {
    try {
      return await prisma.lecturaFuente.create({
        data: { ...input, fecha: fechaToDate(input.fecha) },
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError(`Ya existe una lectura para esa fuente en ${input.fecha}`);
      }
      throw err;
    }
  }

  // Corrección y bitácora en una sola transacción (decisión #3).
  corregir(id: bigint, volumenMmpced: number, usuarioId: number): Promise<LecturaFuenteRow> {
    return prisma.$transaction(async (tx) => {
      const actual = await tx.lecturaFuente.findUniqueOrThrow({ where: { id } });
      await tx.lecturaFuenteHistorial.create({
        data: { lecturaFuenteId: id, volumenMmpcedAnt: actual.volumenMmpced, usuarioId },
      });
      return tx.lecturaFuente.update({ where: { id }, data: { volumenMmpced, usuarioId } });
    });
  }

  listHistorial(lecturaId: bigint, skip: number, take: number): Promise<HistorialFuenteRow[]> {
    return prisma.lecturaFuenteHistorial.findMany({
      where: { lecturaFuenteId: lecturaId },
      select: {
        id: true,
        volumenMmpcedAnt: true,
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
    return prisma.lecturaFuenteHistorial.count({ where: { lecturaFuenteId: lecturaId } });
  }
}

export const lecturaFuenteRepository = new PrismaLecturaFuenteRepository();
