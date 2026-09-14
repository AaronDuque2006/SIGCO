import type {
  CatalogosUsuarioDto,
  Paginated,
  UsuarioConPasswordTemporalDto,
  UsuarioDto,
} from "@sicog/shared-types";
import type { ActualizarUsuarioInput, CrearUsuarioInput, ListarUsuariosQuery } from "@sicog/shared-validators";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors.js";
import { paginate } from "../../../shared/http.js";
import {
  generarPasswordTemporal,
  hashPassword,
  PASSWORD_TEMPORAL_TTL_MS,
} from "../../../shared/password.js";
import {
  sesionRepository,
  type ISesionRepository,
} from "../../auth/repositories/sesion.repository.js";
import {
  usuarioRepository,
  type IUsuarioRepository,
  type UsuarioFila,
} from "../repositories/usuario.repository.js";

// Decisión #21: cada usuario pertenece a exactamente un departamento, excepto
// el Gerente (cubre los cuatro) y el superadmin (no pertenece al negocio).
const PUESTO_SIN_DEPARTAMENTO = "Gerente";

const aDto = (u: UsuarioFila): UsuarioDto => ({
  id: u.id,
  nombre: u.nombre,
  puesto: u.puesto.nombre,
  departamento: u.departamento?.nombre ?? null,
  supervisor: u.supervisor,
  bloqueado: u.bloqueado,
  esSuperadmin: u.esSuperadmin,
  debeCambiarPassword: u.debeCambiarPassword,
});

export class UsuarioService {
  constructor(
    private readonly repo: IUsuarioRepository,
    private readonly sesiones: ISesionRepository,
  ) {}

  /**
   * Los catálogos del organigrama, para el formulario de alta. Van acá y no en
   * un módulo de catálogos aparte porque hoy su único consumidor es la gestión
   * de usuarios, y así heredan su misma puerta: sólo el superadmin.
   */
  async obtenerCatalogos(): Promise<CatalogosUsuarioDto> {
    const [puestos, departamentos] = await Promise.all([
      this.repo.listarPuestos(),
      this.repo.listarDepartamentos(),
    ]);
    return { puestos, departamentos };
  }

  async crear(input: CrearUsuarioInput): Promise<UsuarioConPasswordTemporalDto> {
    const nombrePuesto = await this.exigirPuesto(input.puestoId);
    if (input.departamentoId !== null) await this.exigirDepartamento(input.departamentoId);
    this.verificarOrganizacion(nombrePuesto, input.departamentoId !== null, input.esSuperadmin);
    await this.verificarSupervisor(input.supervisorId, null);

    // La temporal la genera el sistema, nunca la escribe el superadmin: si la
    // eligiera a mano, en la práctica todas las cuentas arrancarían con la
    // misma cadena y esa se volvería la llave maestra del sistema (#54).
    const passwordTemporal = generarPasswordTemporal();
    const passwordExpiraEn = new Date(Date.now() + PASSWORD_TEMPORAL_TTL_MS);

    const fila = await this.repo.crear({
      nombre: input.nombre,
      passwordHash: await hashPassword(passwordTemporal),
      puestoId: input.puestoId,
      departamentoId: input.departamentoId,
      supervisorId: input.supervisorId,
      esSuperadmin: input.esSuperadmin,
      passwordExpiraEn,
    });

    // Única vez que la temporal existe en claro: no se guarda ni se puede
    // volver a consultar. Si se pierde, se reinicia.
    return {
      usuario: aDto(fila),
      passwordTemporal,
      passwordExpiraEn: passwordExpiraEn.toISOString(),
    };
  }

  async listar(query: ListarUsuariosQuery): Promise<Paginated<UsuarioDto>> {
    const { filas, total } = await this.repo.listar(query);
    return paginate(filas.map(aDto), total, query.page, query.pageSize);
  }

  async obtener(id: number): Promise<UsuarioDto> {
    return aDto(await this.exigirUsuario(id));
  }

  async actualizar(id: number, input: ActualizarUsuarioInput, actorId: number): Promise<UsuarioDto> {
    const actual = await this.exigirUsuario(id);

    // Nadie puede quitarse a sí mismo el superadmin. Con esta regla sola es
    // imposible dejar al sistema sin ningún superadmin activo: el único que
    // podría quitarle el rol al último superadmin es él mismo.
    if (input.esSuperadmin === false && id === actorId) {
      throw new ConflictError("No puede quitarse a sí mismo el rol de superadmin.");
    }

    // La coherencia se verifica contra el estado *resultante*, no contra el
    // que venía: cambiar sólo el puesto puede dejar sin departamento a alguien
    // que sí necesita tenerlo.
    const nombrePuesto =
      input.puestoId !== undefined
        ? await this.exigirPuesto(input.puestoId)
        : actual.puesto.nombre;
    const tendraDepartamento =
      input.departamentoId !== undefined
        ? input.departamentoId !== null
        : actual.departamento !== null;
    if (input.departamentoId != null) await this.exigirDepartamento(input.departamentoId);

    this.verificarOrganizacion(
      nombrePuesto,
      tendraDepartamento,
      input.esSuperadmin ?? actual.esSuperadmin,
    );

    if (input.supervisorId !== undefined) {
      await this.verificarSupervisor(input.supervisorId, id);
    }

    return aDto(await this.repo.actualizar(id, input));
  }

  async establecerBloqueo(id: number, bloqueado: boolean, actorId: number): Promise<UsuarioDto> {
    if (id === actorId) {
      throw new ConflictError("No puede bloquear su propia cuenta.");
    }
    await this.exigirUsuario(id);
    const fila = await this.repo.establecerBloqueo(id, bloqueado);

    // Bloquear corta el acceso de inmediato, sin esperar a que expire el
    // refresh de 7 días (§12). El refresh igual verifica `bloqueado`; esto
    // además cierra las sesiones que ya estaban abiertas.
    if (bloqueado) await this.sesiones.revocarTodasLasSesiones(id);

    return aDto(fila);
  }

  async reiniciarPassword(id: number): Promise<UsuarioConPasswordTemporalDto> {
    await this.exigirUsuario(id);

    const passwordTemporal = generarPasswordTemporal();
    const passwordExpiraEn = new Date(Date.now() + PASSWORD_TEMPORAL_TTL_MS);
    const fila = await this.repo.establecerPassword(
      id,
      await hashPassword(passwordTemporal),
      passwordExpiraEn,
    );

    // Reiniciar la contraseña se pide justamente cuando se sospecha que la
    // cuenta quedó en manos equivocadas: dejar vivas las sesiones abiertas
    // haría inútil el reinicio.
    await this.sesiones.revocarTodasLasSesiones(id);

    return {
      usuario: aDto(fila),
      passwordTemporal,
      passwordExpiraEn: passwordExpiraEn.toISOString(),
    };
  }

  private async exigirUsuario(id: number): Promise<UsuarioFila> {
    const fila = await this.repo.buscarPorId(id);
    if (!fila) throw new NotFoundError(`No existe el usuario ${id}.`);
    return fila;
  }

  private async exigirPuesto(puestoId: number): Promise<string> {
    const nombre = await this.repo.nombrePuesto(puestoId);
    if (nombre === null) throw new ValidationError(`No existe el puesto ${puestoId}.`);
    return nombre;
  }

  private async exigirDepartamento(departamentoId: number): Promise<void> {
    if (!(await this.repo.existeDepartamento(departamentoId))) {
      throw new ValidationError(`No existe el departamento ${departamentoId}.`);
    }
  }

  // Decisión #21: sólo el Gerente (cubre los cuatro departamentos) y el
  // superadmin (que no pertenece al negocio) pueden quedar sin departamento.
  private verificarOrganizacion(
    nombrePuesto: string,
    tendraDepartamento: boolean,
    esSuperadmin: boolean,
  ): void {
    const puedeNoTenerDepartamento = esSuperadmin || nombrePuesto === PUESTO_SIN_DEPARTAMENTO;
    if (!puedeNoTenerDepartamento && !tendraDepartamento) {
      throw new ValidationError(
        `Un usuario con puesto "${nombrePuesto}" debe pertenecer a un departamento (decisión #21).`,
      );
    }
  }

  private async verificarSupervisor(
    supervisorId: number | null,
    usuarioId: number | null,
  ): Promise<void> {
    if (supervisorId === null) return;
    if (supervisorId === usuarioId) {
      throw new ValidationError("Un usuario no puede ser su propio supervisor.");
    }
    if (!(await this.repo.buscarPorId(supervisorId))) {
      throw new ValidationError(`No existe el usuario ${supervisorId} para asignarlo como supervisor.`);
    }
    // Si el candidato ya está por debajo de este usuario, asignarlo cerraría
    // un ciclo y el recorrido de la cadena (decisión #25) no terminaría nunca.
    if (usuarioId !== null) {
      const cadena = await this.repo.cadenaDeSupervision(supervisorId);
      if (cadena.includes(usuarioId)) {
        throw new ValidationError("Esa asignación crearía un ciclo en la cadena de supervisión.");
      }
    }
  }
}

export const usuarioService = new UsuarioService(usuarioRepository, sesionRepository);
