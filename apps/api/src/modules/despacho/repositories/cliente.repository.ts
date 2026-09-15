import { Prisma, PrismaClientKnownRequestError } from "@sicog/db";
import { NotFoundError } from "../../../shared/errors.js";
import { prisma } from "../../../shared/prisma-client.js";
import { traducirEscritura } from "./catalogos.repository.js";

export interface ClienteRow {
  id: number;
  nombre: string;
  region: { id: number; nombre: string };
  sistema: { id: number; nombre: string };
  sector: { id: number; nombre: string; activo: boolean };
}

export interface ListClientesParams {
  sistemaId?: number;
  regionId?: number;
  sectorId?: number;
  q?: string;
  skip: number;
  take: number;
}

export interface ClienteInput {
  nombre: string;
  regionId: number;
  sistemaId: number;
  sectorId: number;
}

export interface IClienteRepository {
  list(params: ListClientesParams): Promise<ClienteRow[]>;
  count(filtros: Omit<ListClientesParams, "skip" | "take">): Promise<number>;
  findById(id: number): Promise<ClienteRow | null>;
  create(input: ClienteInput): Promise<ClienteRow>;
  update(id: number, input: Partial<ClienteInput>): Promise<ClienteRow>;
}

const CAMPOS = {
  id: true,
  nombre: true,
  region: { select: { id: true, nombre: true } },
  sistema: { select: { id: true, nombre: true } },
  sector: { select: { id: true, nombre: true, activo: true } },
} as const;

// `q` busca por nombre, sin distinguir mayúsculas: es un buscador de pantalla,
// y nadie teclea "PEQUIVEN" tal cual para encontrarlo.
const where = ({
  sistemaId,
  regionId,
  sectorId,
  q,
}: Omit<ListClientesParams, "skip" | "take">): Prisma.ClienteWhereInput => ({
  sistemaId,
  regionId,
  sectorId,
  ...(q ? { nombre: { contains: q, mode: "insensitive" as const } } : {}),
});

export class PrismaClienteRepository implements IClienteRepository {
  // Orden alfabético, a diferencia de la grilla diaria, que agrupa por sistema:
  // son dos vistas distintas del mismo catálogo. Acá se busca un cliente por
  // nombre; allá se recorre el día sistema por sistema.
  list({ skip, take, ...filtros }: ListClientesParams): Promise<ClienteRow[]> {
    return prisma.cliente.findMany({
      where: where(filtros),
      select: CAMPOS,
      orderBy: { nombre: "asc" },
      skip,
      take,
    });
  }

  count(filtros: Omit<ListClientesParams, "skip" | "take">): Promise<number> {
    return prisma.cliente.count({ where: where(filtros) });
  }

  findById(id: number): Promise<ClienteRow | null> {
    return prisma.cliente.findUnique({ where: { id }, select: CAMPOS });
  }

  async create(input: ClienteInput): Promise<ClienteRow> {
    try {
      return await prisma.cliente.create({ data: input, select: CAMPOS });
    } catch (err) {
      throw traducirClienteError(err, input.nombre);
    }
  }

  async update(id: number, input: Partial<ClienteInput>): Promise<ClienteRow> {
    try {
      return await prisma.cliente.update({ where: { id }, data: input, select: CAMPOS });
    } catch (err) {
      throw traducirClienteError(err, input.nombre ?? "", id);
    }
  }
}

/**
 * Además del nombre repetido, acá se traduce `P2003`: la violación de clave
 * foránea que deja una región, un sistema o un sector inexistentes.
 *
 * Se apoya en el constraint en vez de verificar antes las tres FK con tres
 * consultas: son tres viajes a la base en el camino feliz para cubrir un caso
 * que sólo ocurre con ids inventados, y además seguirían siendo una carrera si
 * el catálogo se borrara en el medio.
 */
function traducirClienteError(err: unknown, nombre: string, id?: number): unknown {
  if (err instanceof PrismaClientKnownRequestError && err.code === "P2003") {
    return new NotFoundError("La región, el sistema o el sector indicado no existe");
  }
  return traducirEscritura(err, {
    repetido: `Ya existe un cliente llamado "${nombre}"`,
    noExiste: id === undefined ? "No existe el cliente" : `No existe el cliente ${id}`,
  });
}

export const clienteRepository = new PrismaClienteRepository();
