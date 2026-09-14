import { PrismaClientKnownRequestError } from "@sicog/db";
import { ConflictError } from "../../../shared/errors.js";
import { prisma } from "../../../shared/prisma-client.js";

export interface UsuarioFila {
  id: number;
  nombre: string;
  bloqueado: boolean;
  esSuperadmin: boolean;
  debeCambiarPassword: boolean;
  puesto: { nombre: string };
  departamento: { nombre: string } | null;
  supervisor: { id: number; nombre: string } | null;
}

export interface CredencialesUsuario {
  id: number;
  nombre: string;
  passwordHash: string;
  bloqueado: boolean;
  debeCambiarPassword: boolean;
  passwordExpiraEn: Date | null;
}

export interface DatosAlta {
  nombre: string;
  passwordHash: string;
  puestoId: number;
  departamentoId: number | null;
  supervisorId: number | null;
  esSuperadmin: boolean;
  passwordExpiraEn: Date;
}

export interface DatosEdicion {
  puestoId?: number;
  departamentoId?: number | null;
  supervisorId?: number | null;
  esSuperadmin?: boolean;
}

export interface FiltroListado {
  busqueda?: string;
  soloBloqueados?: boolean;
  page: number;
  pageSize: number;
}

export interface IUsuarioRepository {
  crear(datos: DatosAlta): Promise<UsuarioFila>;
  buscarPorId(id: number): Promise<UsuarioFila | null>;
  listar(filtro: FiltroListado): Promise<{ filas: UsuarioFila[]; total: number }>;
  actualizar(id: number, datos: DatosEdicion): Promise<UsuarioFila>;
  establecerBloqueo(id: number, bloqueado: boolean): Promise<UsuarioFila>;
  establecerPassword(
    id: number,
    passwordHash: string,
    expiraEn: Date | null,
  ): Promise<UsuarioFila>;
  credencialesPorId(id: number): Promise<CredencialesUsuario | null>;
  nombrePuesto(puestoId: number): Promise<string | null>;
  existeDepartamento(departamentoId: number): Promise<boolean>;
  cadenaDeSupervision(desdeId: number): Promise<number[]>;
}

const seleccion = {
  id: true,
  nombre: true,
  bloqueado: true,
  esSuperadmin: true,
  debeCambiarPassword: true,
  puesto: { select: { nombre: true } },
  departamento: { select: { nombre: true } },
  supervisor: { select: { id: true, nombre: true } },
};

// Profundidad máxima al recorrer la cadena de supervisión. La jerarquía real
// tiene 4 niveles (decisión #23); el tope está por si una fila corrupta
// creara un ciclo, para que el recorrido termine igual.
const MAX_PROFUNDIDAD_JERARQUIA = 20;

export class PrismaUsuarioRepository implements IUsuarioRepository {
  async crear(datos: DatosAlta): Promise<UsuarioFila> {
    try {
      return await prisma.usuario.create({
        data: { ...datos, debeCambiarPassword: true },
        select: seleccion,
      });
    } catch (err) {
      // El Repository traduce los códigos de Prisma a errores de dominio para
      // que Service y Controller nunca los vean.
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError(`Ya existe un usuario llamado "${datos.nombre}".`);
      }
      throw err;
    }
  }

  async buscarPorId(id: number): Promise<UsuarioFila | null> {
    return prisma.usuario.findUnique({ where: { id }, select: seleccion });
  }

  async listar(filtro: FiltroListado): Promise<{ filas: UsuarioFila[]; total: number }> {
    const where = {
      ...(filtro.busqueda
        ? { nombre: { contains: filtro.busqueda, mode: "insensitive" as const } }
        : {}),
      ...(filtro.soloBloqueados ? { bloqueado: true } : {}),
    };
    const [filas, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: seleccion,
        orderBy: { nombre: "asc" },
        skip: (filtro.page - 1) * filtro.pageSize,
        take: filtro.pageSize,
      }),
      prisma.usuario.count({ where }),
    ]);
    return { filas, total };
  }

  async actualizar(id: number, datos: DatosEdicion): Promise<UsuarioFila> {
    return prisma.usuario.update({ where: { id }, data: datos, select: seleccion });
  }

  async establecerBloqueo(id: number, bloqueado: boolean): Promise<UsuarioFila> {
    return prisma.usuario.update({ where: { id }, data: { bloqueado }, select: seleccion });
  }

  // `expiraEn` no nulo significa contraseña temporal: las dos columnas se
  // escriben juntas para no violar el CHECK que las amarra en la migración.
  async establecerPassword(
    id: number,
    passwordHash: string,
    expiraEn: Date | null,
  ): Promise<UsuarioFila> {
    return prisma.usuario.update({
      where: { id },
      data: {
        passwordHash,
        debeCambiarPassword: expiraEn !== null,
        passwordExpiraEn: expiraEn,
        // Toda contraseña nueva invalida los access token ya emitidos. Se
        // sella acá y no en los dos Services que llaman a este método porque
        // es el único punto por el que pasan el reinicio del superadmin y el
        // cambio propio: puesto arriba, un tercer camino podría olvidarlo.
        sesionesInvalidasAntesDe: new Date(),
      },
      select: seleccion,
    });
  }

  async credencialesPorId(id: number): Promise<CredencialesUsuario | null> {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        passwordHash: true,
        bloqueado: true,
        debeCambiarPassword: true,
        passwordExpiraEn: true,
      },
    });
  }

  async nombrePuesto(puestoId: number): Promise<string | null> {
    const p = await prisma.puesto.findUnique({ where: { id: puestoId }, select: { nombre: true } });
    return p?.nombre ?? null;
  }

  async existeDepartamento(departamentoId: number): Promise<boolean> {
    return (await prisma.departamento.count({ where: { id: departamentoId } })) > 0;
  }

  /**
   * Ids de todos los supervisores por encima de `desdeId`, de abajo hacia
   * arriba. Se usa para no armar un ciclo al asignar supervisor: si A ya está
   * arriba de B, B no puede pasar a ser supervisor de A. Sin esto, la decisión
   * #25 ("un superior ve toda la cadena hacia abajo") se recorrería infinito.
   */
  async cadenaDeSupervision(desdeId: number): Promise<number[]> {
    const cadena: number[] = [];
    let actual: number | null = desdeId;
    for (let i = 0; i < MAX_PROFUNDIDAD_JERARQUIA && actual !== null; i++) {
      const fila: { supervisorId: number | null } | null = await prisma.usuario.findUnique({
        where: { id: actual },
        select: { supervisorId: true },
      });
      actual = fila?.supervisorId ?? null;
      if (actual !== null) {
        if (cadena.includes(actual)) break;
        cadena.push(actual);
      }
    }
    return cadena;
  }
}

export const usuarioRepository = new PrismaUsuarioRepository();
