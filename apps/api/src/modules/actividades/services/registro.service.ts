import type { ActividadRegistroDto, Paginated } from "@sicog/shared-types";
import type {
  CreateActividadRegistroInput,
  ListActividadRegistrosQuery,
  UpdateActividadRegistroInput,
} from "@sicog/shared-validators";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors.js";
import { paginate } from "../../../shared/http.js";
import { prisma } from "../../../shared/prisma-client.js";
import type { IRegistroActividadRepository } from "../repositories/registro.repository.js";
import { registroActividadRepository } from "../repositories/registro.repository.js";

/** El único puesto que no crea registros: recibe asignaciones (decisión #83). */
const PUESTO_SIN_ALTA = "Analista";

interface Actor {
  id: number;
  puesto: string;
  departamentoId: number | null;
}

/**
 * Los registros de actividad y horas-hombre.
 *
 * La regla de escritura es **propia de este módulo** y no se deduce del
 * organigrama (decisión #83): crean todos menos el Analista, que en cambio
 * recibe la tarea de su supervisor y después la completa. Por eso el catálogo
 * de tres estados de la decisión #29 existe — `RECIBIDO` es una tarea asignada
 * y sin empezar, y en el workbook no aparece ni una vez justamente porque ahí
 * no hay flujo de asignación.
 */
export class RegistroActividadService {
  constructor(private readonly repo: IRegistroActividadRepository) {}

  async listar(filtros: ListActividadRegistrosQuery): Promise<Paginated<ActividadRegistroDto>> {
    // `cadena` sin `usuarioId` no significa nada: se avisa en vez de
    // ignorarlo en silencio, que dejaría a quien lo pidió creyendo que filtró.
    if (filtros.cadena === true && filtros.usuarioId === undefined) {
      throw new ValidationError("`cadena` necesita un `usuarioId` del que colgar.");
    }
    const { filas, total } = await this.repo.listar(filtros);
    return paginate(filas, total, filtros.page, filtros.pageSize);
  }

  async obtener(id: bigint): Promise<ActividadRegistroDto> {
    const fila = await this.repo.obtener(id);
    if (!fila) throw new NotFoundError("No existe el registro");
    return fila;
  }

  async crear(
    actorId: number,
    datos: CreateActividadRegistroInput,
  ): Promise<ActividadRegistroDto> {
    const actor = await this.cargarActor(actorId);

    if (actor.puesto === PUESTO_SIN_ALTA) {
      throw new ForbiddenError(
        "Un Analista no crea registros: su supervisor le asigna la tarea, y él la completa.",
      );
    }

    // El producto y la gerencia tienen que ser **del mismo departamento**, y
    // el actor tiene que poder editar ese departamento. Sin esto se podría
    // imputar una actividad de Mantenimiento contra una gerencia de otro
    // departamento, y el reporte por departamento dejaría de cerrar.
    const departamento = await this.departamentoCoherente(
      datos.productoServicioId,
      datos.gerenciaRequirienteId,
    );
    await this.exigirQuePuedaEditar(actor, departamento);

    const responsableId = datos.usuarioId ?? actor.id;
    if (responsableId !== actor.id) {
      await this.exigirResponsableDelDepartamento(responsableId, departamento);
    }

    return this.repo.crear({
      productoServicioId: datos.productoServicioId,
      gerenciaRequirienteId: datos.gerenciaRequirienteId,
      regionId: datos.regionId,
      usuarioId: responsableId,
      fechaDesde: datos.fechaDesde,
      fechaHasta: datos.fechaHasta,
      cantidad: datos.cantidad,
      hh: datos.hh,
      estatus: datos.estatus,
      detalle: datos.detalle,
    });
  }

  async actualizar(
    actorId: number,
    id: bigint,
    datos: UpdateActividadRegistroInput,
  ): Promise<ActividadRegistroDto> {
    const [actor, actual] = await Promise.all([this.cargarActor(actorId), this.obtener(id)]);

    // El Analista completa **lo suyo**: mueve el estatus y carga las horas.
    // Cualquier otro puesto corrige lo de su departamento. Reasignar no es
    // corregir, así que `usuarioId` no está en el schema del PATCH.
    const departamento = actual.productoServicio.insumo.departamento.id;
    const esSuyo = actual.usuario.id === actor.id;
    if (!esSuyo) {
      if (actor.puesto === PUESTO_SIN_ALTA) {
        throw new ForbiddenError("Un Analista sólo puede completar los registros a su nombre.");
      }
      await this.exigirQuePuedaEditar(actor, departamento);
    }

    // El rango se verifica contra el **estado resultante** y no contra lo que
    // llega: el PATCH es parcial, así que mandar sólo `fechaHasta` dejaría al
    // `refine` del schema sin el `fechaDesde` con el que compararlo. Mismo
    // criterio que §13.2 con el departamento y §11 con el fin de una novedad.
    const desde = datos.fechaDesde ?? actual.fechaDesde;
    const hasta = datos.fechaHasta ?? actual.fechaHasta;
    if (desde > hasta) {
      throw new ValidationError("La fecha de fin no puede ser anterior a la de inicio");
    }

    // Si se mueve el producto o la gerencia, tienen que seguir siendo del
    // mismo departamento entre sí.
    if (datos.productoServicioId !== undefined || datos.gerenciaRequirienteId !== undefined) {
      await this.departamentoCoherente(
        datos.productoServicioId ?? actual.productoServicio.id,
        datos.gerenciaRequirienteId ?? actual.gerenciaRequiriente.id,
      );
    }

    return this.repo.actualizar(id, datos);
  }

  private async cargarActor(id: number): Promise<Actor> {
    const u = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, departamentoId: true, puesto: { select: { nombre: true } } },
    });
    if (!u) throw new NotFoundError("No existe el usuario");
    return { id: u.id, puesto: u.puesto.nombre, departamentoId: u.departamentoId };
  }

  private async departamentoCoherente(
    productoServicioId: number,
    gerenciaRequirienteId: number,
  ): Promise<number> {
    const [dProducto, dGerencia] = await Promise.all([
      this.repo.departamentoDeProducto(productoServicioId),
      this.repo.departamentoDeGerencia(gerenciaRequirienteId),
    ]);
    if (dProducto === null) throw new NotFoundError("No existe el producto o servicio");
    if (dGerencia === null) throw new NotFoundError("No existe la gerencia requiriente");
    if (dProducto !== dGerencia) {
      throw new ValidationError(
        "El producto/servicio y la gerencia requiriente son de departamentos distintos.",
      );
    }
    return dProducto;
  }

  /**
   * La autorización se resuelve contra la base, nunca contra el token, y sigue
   * la misma regla de las decisiones #21-#24 que ya usa `requireDepartamento`:
   * el Gerente cubre los cuatro departamentos, el Superintendente los que le
   * asignaron, y el resto sólo el propio.
   */
  private async exigirQuePuedaEditar(actor: Actor, departamentoId: number): Promise<void> {
    if (actor.departamentoId === departamentoId) return;

    const u = await prisma.usuario.findUnique({
      where: { id: actor.id },
      select: {
        puesto: { select: { nombre: true } },
        superintendencias: { select: { departamentoId: true } },
      },
    });
    if (u?.puesto.nombre === "Gerente") return;
    if (u?.superintendencias.some((s) => s.departamentoId === departamentoId) === true) return;

    throw new ForbiddenError("No puede registrar actividades de ese departamento");
  }

  /** A nombre de quién se puede registrar: alguien de ese mismo departamento.
   *  Imputarle horas a una persona de otro departamento descuadraría su
   *  propio reporte sin que nadie de allá se entere. */
  private async exigirResponsableDelDepartamento(
    responsableId: number,
    departamentoId: number,
  ): Promise<void> {
    const u = await prisma.usuario.findUnique({
      where: { id: responsableId },
      select: { departamentoId: true, bloqueado: true },
    });
    if (!u) throw new NotFoundError("No existe el usuario responsable");
    if (u.bloqueado) {
      throw new ValidationError("No se puede registrar a nombre de una cuenta bloqueada");
    }
    if (u.departamentoId !== departamentoId) {
      throw new ValidationError("El responsable no pertenece a ese departamento");
    }
  }
}

export const registroActividadService = new RegistroActividadService(registroActividadRepository);
