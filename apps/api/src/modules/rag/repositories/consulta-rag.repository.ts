import { prisma } from "../../../shared/prisma-client.js";

export interface IConsultaRagRepository {
  /** Auditoría (§16.8): quién preguntó qué y qué se le mostró. */
  registrar(input: { usuarioId: number; pregunta: string; chunkIds: bigint[]; duracionMs: number }): Promise<void>;
}

export class PrismaConsultaRagRepository implements IConsultaRagRepository {
  async registrar(input: { usuarioId: number; pregunta: string; chunkIds: bigint[]; duracionMs: number }): Promise<void> {
    await prisma.consultaRag.create({ data: input });
  }
}

export const consultaRagRepository: IConsultaRagRepository = new PrismaConsultaRagRepository();
