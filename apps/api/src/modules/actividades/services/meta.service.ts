import type { MatrizMetasDto, ParticipacionDto, PlanVsRealDto } from "@sicog/shared-types";
import type { ReemplazarMetasInput, UpdateMetaInput } from "@sicog/shared-validators";
import { ValidationError } from "../../../shared/errors.js";
import type { IMetaActividadRepository } from "../repositories/meta.repository.js";
import { metaActividadRepository } from "../repositories/meta.repository.js";

/**
 * El plan anual de horas-hombre (decisión #30: lo carga el Supervisor de cada
 * departamento, una vez al año) y los dos reportes del §14.4.
 *
 * La puerta de escritura vive en el middleware, que es quien tiene contexto
 * HTTP para dejar registro del 403. Acá queda lo que es regla de negocio.
 */
export class MetaActividadService {
  constructor(private readonly repo: IMetaActividadRepository) {}

  matriz(anio: number, departamentoId?: number): Promise<MatrizMetasDto> {
    return this.repo.matriz(anio, departamentoId);
  }

  async reemplazarAnio(anio: number, datos: ReemplazarMetasInput): Promise<MatrizMetasDto> {
    // Dos celdas para el mismo producto y mes no las ataja el `@@unique` de
    // forma útil: el `createMany` fallaría a mitad de la transacción con un
    // mensaje del motor. Se dice acá, que es donde se puede señalar cuál.
    const vistas = new Set<string>();
    for (const c of datos.celdas) {
      const clave = `${c.productoServicioId}|${c.mes}`;
      if (vistas.has(clave)) {
        throw new ValidationError(
          `El plan trae dos veces el producto ${c.productoServicioId} en el mes ${c.mes}.`,
        );
      }
      vistas.add(clave);
    }

    // Todas las celdas tienen que ser del departamento que autorizó la carga.
    // Sin esto, quien puede cargar el plan de Mantenimiento podría escribir
    // metas de Calidad de Gas en la misma petición.
    const ids = [...new Set(datos.celdas.map((c) => c.productoServicioId))];
    const departamentos = await this.repo.departamentosDeProductos(ids);
    for (const id of ids) {
      const dep = departamentos.get(id);
      if (dep === undefined) {
        throw new ValidationError(`El producto/servicio ${id} no existe.`);
      }
      if (dep !== datos.departamentoId) {
        throw new ValidationError(
          `El producto/servicio ${id} no pertenece al departamento del plan.`,
        );
      }
    }

    await this.repo.reemplazarAnio(anio, datos.departamentoId, datos.celdas);
    return this.repo.matriz(anio, datos.departamentoId);
  }

  async actualizarCelda(id: bigint, datos: UpdateMetaInput): Promise<{ id: string }> {
    const fila = await this.repo.actualizarCelda(id, datos);
    return { id: String(fila.id) };
  }

  planVsReal(anio: number, departamentoId?: number): Promise<PlanVsRealDto> {
    return this.repo.planVsReal(anio, departamentoId);
  }

  participacion(anio: number, mes: number, departamentoId?: number): Promise<ParticipacionDto> {
    return this.repo.participacion(anio, mes, departamentoId);
  }
}

export const metaActividadService = new MetaActividadService(metaActividadRepository);
