import { Prisma, PrismaClientKnownRequestError } from "@sicog/db";
import { NotFoundError } from "../../../shared/errors.js";
import { prisma } from "../../../shared/prisma-client.js";
import { traducirEscritura } from "./catalogos.repository.js";

export interface FuenteRow {
  id: number;
  nombre: string;
  sistema: { id: number; nombre: string };
}

export interface ListFuentesParams {
  sistemaId?: number;
  q?: string;
  skip: number;
  take: number;
}

export interface FuenteInput {
  nombre: string;
  sistemaId: number;
}

export interface IFuenteRepository {
  list(params: ListFuentesParams): Promise<FuenteRow[]>;
  count(filtros: Omit<ListFuentesParams, "skip" | "take">): Promise<number>;
  findById(id: number): Promise<FuenteRow | null>;
  create(input: FuenteInput): Promise<FuenteRow>;
  update(id: number, input: Partial<FuenteInput>): Promise<FuenteRow>;
}

const CAMPOS = {
  id: true,
  nombre: true,
  sistema: { select: { id: true, nombre: true } },
} as const;

const where = ({
  sistemaId,
  q,
}: Omit<ListFuentesParams, "skip" | "take">): Prisma.FuenteWhereInput => ({
  sistemaId,
  ...(q ? { nombre: { contains: q, mode: "insensitive" as const } } : {}),
});

/**
 * `FUENTE` es simple por decisión #8: `id`, `nombre`, `sistema_id` y nada más.
 * Lo que en Mantenimiento sería una estación con UTM y telemetría no pertenece
 * a este dominio.
 *
 * Tampoco lleva sector: el sector económico es una propiedad de quien consume
 * el gas, no del punto que lo entrega (decisión #64).
 */
export class PrismaFuenteRepository implements IFuenteRepository {
  // Alfabético, igual que clientes y por el mismo motivo: la grilla diaria
  // agrupa por sistema porque se recorre el día, este listado se busca.
  list({ skip, take, ...filtros }: ListFuentesParams): Promise<FuenteRow[]> {
    return prisma.fuente.findMany({
      where: where(filtros),
      select: CAMPOS,
      orderBy: { nombre: "asc" },
      skip,
      take,
    });
  }

  count(filtros: Omit<ListFuentesParams, "skip" | "take">): Promise<number> {
    return prisma.fuente.count({ where: where(filtros) });
  }

  findById(id: number): Promise<FuenteRow | null> {
    return prisma.fuente.findUnique({ where: { id }, select: CAMPOS });
  }

  async create(input: FuenteInput): Promise<FuenteRow> {
    try {
      return await prisma.fuente.create({ data: input, select: CAMPOS });
    } catch (err) {
      throw traducirFuenteError(err, input.nombre);
    }
  }

  async update(id: number, input: Partial<FuenteInput>): Promise<FuenteRow> {
    try {
      return await prisma.fuente.update({ where: { id }, data: input, select: CAMPOS });
    } catch (err) {
      throw traducirFuenteError(err, input.nombre ?? "", id);
    }
  }
}

function traducirFuenteError(err: unknown, nombre: string, id?: number): unknown {
  // FK: el `sistemaId` no existe.
  if (err instanceof PrismaClientKnownRequestError && err.code === "P2003") {
    return new NotFoundError("El sistema indicado no existe");
  }
  return traducirEscritura(err, {
    repetido: `Ya existe una fuente llamada "${nombre}"`,
    noExiste: id === undefined ? "No existe la fuente" : `No existe la fuente ${id}`,
  });
}

export const fuenteRepository = new PrismaFuenteRepository();
