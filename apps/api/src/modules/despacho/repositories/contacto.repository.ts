import { Prisma, PrismaClientKnownRequestError } from "@sicog/db";
import { NotFoundError } from "../../../shared/errors.js";
import { prisma } from "../../../shared/prisma-client.js";

export interface ContactoRow {
  id: number;
  cliente: {
    id: number;
    nombre: string;
    region: { id: number; nombre: string };
    sistema: { id: number; nombre: string };
    sector: { id: number; nombre: string; activo: boolean };
  } | null;
  fuente: { id: number; nombre: string; sistema: { id: number; nombre: string } } | null;
  nombreOperador: string;
  telefono: string;
}

export interface ListContactosParams {
  clienteId?: number;
  fuenteId?: number;
  q?: string;
  skip: number;
  take: number;
}

export interface ContactoInput {
  clienteId?: number | null;
  fuenteId?: number | null;
  nombreOperador: string;
  telefono: string;
}

export interface IContactoRepository {
  list(params: ListContactosParams): Promise<ContactoRow[]>;
  count(filtros: Omit<ListContactosParams, "skip" | "take">): Promise<number>;
  findById(id: number): Promise<ContactoRow | null>;
  create(input: ContactoInput): Promise<ContactoRow>;
  update(id: number, input: Partial<ContactoInput>): Promise<ContactoRow>;
  remove(id: number): Promise<void>;
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
  nombreOperador: true,
  telefono: true,
} as const;

const where = ({
  clienteId,
  fuenteId,
  q,
}: Omit<ListContactosParams, "skip" | "take">): Prisma.ContactoWhereInput => {
  const contiene = { contains: q, mode: "insensitive" as const };
  return {
    clienteId,
    fuenteId,
    // Se busca por donde la gente lo piensa: el nombre del operador, el número
    // (búsqueda inversa) y el nombre de a quién pertenece.
    ...(q
      ? {
          OR: [
            { nombreOperador: contiene },
            { telefono: contiene },
            { cliente: { nombre: contiene } },
            { fuente: { nombre: contiene } },
          ],
        }
      : {}),
  };
};

/**
 * Directorio telefónico. Es el **único recurso del módulo con borrado físico**:
 * un teléfono viejo no es un dato operativo histórico que haya que conservar,
 * es ruido en una lista que se consulta con apuro.
 *
 * Por lo mismo no tiene historial ni `usuarioId`: el modelo `CONTACTO` son
 * cuatro columnas y nada más.
 */
export class PrismaContactoRepository implements IContactoRepository {
  list({ skip, take, ...filtros }: ListContactosParams): Promise<ContactoRow[]> {
    return prisma.contacto.findMany({
      where: where(filtros),
      select: CAMPOS,
      orderBy: { nombreOperador: "asc" },
      skip,
      take,
    });
  }

  count(filtros: Omit<ListContactosParams, "skip" | "take">): Promise<number> {
    return prisma.contacto.count({ where: where(filtros) });
  }

  findById(id: number): Promise<ContactoRow | null> {
    return prisma.contacto.findUnique({ where: { id }, select: CAMPOS });
  }

  async create(input: ContactoInput): Promise<ContactoRow> {
    try {
      return await prisma.contacto.create({
        data: {
          clienteId: input.clienteId ?? null,
          fuenteId: input.fuenteId ?? null,
          nombreOperador: input.nombreOperador,
          telefono: input.telefono,
        },
        select: CAMPOS,
      });
    } catch (err) {
      throw traducir(err);
    }
  }

  /**
   * El origen no se mueve: `updateContactoSchema` omite los dos campos, así
   * que nunca llegan. Un teléfono que pasa de un cliente a otro es otro
   * contacto.
   */
  async update(id: number, input: Partial<ContactoInput>): Promise<ContactoRow> {
    try {
      return await prisma.contacto.update({
        where: { id },
        data: {
          ...(input.nombreOperador === undefined
            ? {}
            : { nombreOperador: input.nombreOperador }),
          ...(input.telefono === undefined ? {} : { telefono: input.telefono }),
        },
        select: CAMPOS,
      });
    } catch (err) {
      throw traducir(err, id);
    }
  }

  // Borrado real: la fila desaparece. Nada cuelga de `CONTACTO`, así que no
  // deja huérfanos.
  async remove(id: number): Promise<void> {
    try {
      await prisma.contacto.delete({ where: { id } });
    } catch (err) {
      throw traducir(err, id);
    }
  }
}

function traducir(err: unknown, id?: number): unknown {
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2003") return new NotFoundError("El cliente o la fuente indicada no existe");
    if (err.code === "P2025") {
      return new NotFoundError(id === undefined ? "No existe el contacto" : `No existe el contacto ${id}`);
    }
  }
  return err;
}

export const contactoRepository = new PrismaContactoRepository();
