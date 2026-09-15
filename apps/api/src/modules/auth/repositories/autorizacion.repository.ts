import { prisma } from "../../../shared/prisma-client.js";

export interface EstadoPassword {
  debeCambiar: boolean;
  expiraEn: Date | null;
}

export interface IAutorizacionRepository {
  puedeEditarDepartamento(usuarioId: number, nombreDepartamento: string): Promise<boolean>;
  esSuperadmin(usuarioId: number): Promise<boolean>;
  esSupervisorOSuperior(usuarioId: number): Promise<boolean>;
  estadoPassword(usuarioId: number): Promise<EstadoPassword | null>;
  sesionesInvalidasAntesDe(usuarioId: number): Promise<Date | null>;
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

  /**
   * Decisión #31: el catálogo `SECTOR_CLIENTE` lo edita Supervisor o superior.
   *
   * El rango sale del **`id` del puesto**, no de su nombre: la decisión #23
   * fija que el id sigue el organigrama (Gerente 1 … Analista 5), y es el
   * mismo invariante del que ya depende el listado de §13 para ordenarlos.
   * Se resuelve el id de "Supervisor" contra la base en vez de cablear un 3,
   * para que una base sembrada con otros ids siga dando lo mismo.
   *
   * Falla cerrado: si no existe la fila "Supervisor", nadie pasa.
   */
  async esSupervisorOSuperior(usuarioId: number): Promise<boolean> {
    const [usuario, supervisor] = await Promise.all([
      prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { bloqueado: true, puestoId: true },
      }),
      prisma.puesto.findFirst({ where: { nombre: "Supervisor" }, select: { id: true } }),
    ]);
    if (!usuario || usuario.bloqueado || !supervisor) return false;
    return usuario.puestoId <= supervisor.id;
  }

  // El rol de sistema también se resuelve contra la BD y no contra el token:
  // quitarle el superadmin a alguien debe surtir efecto en la petición
  // siguiente, no cuando expire su access token.
  async esSuperadmin(usuarioId: number): Promise<boolean> {
    const u = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { bloqueado: true, esSuperadmin: true },
    });
    return u !== null && !u.bloqueado && u.esSuperadmin;
  }

  // El sello de revocación: todo access token emitido antes de esta marca
  // dejó de valer. Se consulta en requireAuth porque el JWT no se puede
  // retirar una vez emitido (§12.2).
  async sesionesInvalidasAntesDe(usuarioId: number): Promise<Date | null> {
    const u = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { sesionesInvalidasAntesDe: true },
    });
    return u?.sesionesInvalidasAntesDe ?? null;
  }

  async estadoPassword(usuarioId: number): Promise<EstadoPassword | null> {
    const u = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { debeCambiarPassword: true, passwordExpiraEn: true },
    });
    return u === null ? null : { debeCambiar: u.debeCambiarPassword, expiraEn: u.passwordExpiraEn };
  }
}

export const autorizacionRepository = new PrismaAutorizacionRepository();
