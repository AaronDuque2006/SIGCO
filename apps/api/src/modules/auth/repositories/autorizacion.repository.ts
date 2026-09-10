import { prisma } from "../../../shared/prisma-client.js";

export interface IAutorizacionRepository {
  puedeEditarDepartamento(usuarioId: number, nombreDepartamento: string): Promise<boolean>;
}

// Regla de las decisiones #21-#24: un Gerente cubre los 4 departamentos; un
// Superintendente cubre los que le asigna SUPERINTENDENCIA_DEPARTAMENTO; el
// resto sólo edita el propio. Consultar siempre contra la BD y no confiar en
// lo que venga en el token: el token dice quién sos, la BD dice qué podés hacer.
export class PrismaAutorizacionRepository implements IAutorizacionRepository {
  async puedeEditarDepartamento(usuarioId: number, nombreDepartamento: string): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        bloqueado: true,
        puesto: { select: { nombre: true } },
        departamento: { select: { nombre: true } },
        superintendencias: { select: { departamento: { select: { nombre: true } } } },
      },
    });

    if (!usuario || usuario.bloqueado) return false;
    if (usuario.puesto.nombre === "Gerente") return true;
    if (usuario.departamento?.nombre === nombreDepartamento) return true;

    return usuario.superintendencias.some((s) => s.departamento.nombre === nombreDepartamento);
  }
}

export const autorizacionRepository = new PrismaAutorizacionRepository();
