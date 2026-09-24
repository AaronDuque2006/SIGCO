import type { FuenteRagDto } from "@sicog/shared-types";
import { Prisma } from "@sicog/db";
import { prisma } from "../../../shared/prisma-client.js";

export interface ConsultaPropiaFila {
  id: bigint;
  pregunta: string;
  respuesta: string | null;
  fuentes: FuenteRagDto[] | null;
  creadoEn: Date;
  duracionMs: number | null;
  util: boolean | null;
}

export interface ValoracionFila {
  id: bigint;
  usuario: { nombre: string };
  pregunta: string;
  respuesta: string | null;
  util: boolean | null;
  comentario: string | null;
  creadoEn: Date;
  valoradaEn: Date | null;
}

export interface IConsultaRagRepository {
  /**
   * Auditoría (§16.8): quién preguntó qué. Se crea apenas llega la pregunta,
   * para que el navegador tenga el id con que valorarla, y se completa al
   * terminar con lo que se le mostró y lo que se le contestó.
   */
  crear(input: { usuarioId: number; pregunta: string }): Promise<bigint>;
  completar(
    id: bigint,
    input: { chunkIds: bigint[]; fuentes: FuenteRagDto[]; respuesta: string | null; duracionMs: number },
  ): Promise<void>;
  /** Las consultas de un usuario desde una fecha, la más reciente primero. */
  listarPropias(usuarioId: number, desde: Date, limite: number): Promise<ConsultaPropiaFila[]>;
  /** Devuelve false si la consulta no existe o no es de ese usuario. */
  valorar(id: bigint, usuarioId: number, input: { util: boolean; comentario: string | null }): Promise<boolean>;
  listarValoradas(util: boolean | undefined, limite: number): Promise<ValoracionFila[]>;
}

export class PrismaConsultaRagRepository implements IConsultaRagRepository {
  async crear(input: { usuarioId: number; pregunta: string }): Promise<bigint> {
    const { id } = await prisma.consultaRag.create({ data: { ...input, chunkIds: [] }, select: { id: true } });
    return id;
  }

  async completar(
    id: bigint,
    input: { chunkIds: bigint[]; fuentes: FuenteRagDto[]; respuesta: string | null; duracionMs: number },
  ): Promise<void> {
    await prisma.consultaRag.update({
      where: { id },
      data: { ...input, fuentes: input.fuentes as unknown as Prisma.InputJsonValue },
    });
  }

  async listarPropias(usuarioId: number, desde: Date, limite: number): Promise<ConsultaPropiaFila[]> {
    const filas = await prisma.consultaRag.findMany({
      where: { usuarioId, creadoEn: { gte: desde } },
      select: { id: true, pregunta: true, respuesta: true, fuentes: true, creadoEn: true, duracionMs: true, util: true },
      orderBy: { creadoEn: "desc" },
      take: limite,
    });
    return filas.map((f) => ({ ...f, fuentes: (f.fuentes as unknown as FuenteRagDto[] | null) ?? null }));
  }

  async valorar(id: bigint, usuarioId: number, input: { util: boolean; comentario: string | null }): Promise<boolean> {
    // updateMany con el usuario en el filtro: valorar la consulta de otro es
    // lo mismo que valorar una que no existe, sin revelar cuál de las dos es.
    const { count } = await prisma.consultaRag.updateMany({
      where: { id, usuarioId },
      data: { ...input, valoradaEn: new Date() },
    });
    return count > 0;
  }

  async listarValoradas(util: boolean | undefined, limite: number): Promise<ValoracionFila[]> {
    return prisma.consultaRag.findMany({
      where: util === undefined ? { util: { not: null } } : { util },
      select: {
        id: true,
        usuario: { select: { nombre: true } },
        pregunta: true,
        respuesta: true,
        util: true,
        comentario: true,
        creadoEn: true,
        valoradaEn: true,
      },
      orderBy: { valoradaEn: "desc" },
      take: limite,
    });
  }
}

export const consultaRagRepository: IConsultaRagRepository = new PrismaConsultaRagRepository();
