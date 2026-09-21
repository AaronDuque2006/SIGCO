import type {
  AreaMttoDto,
  CausaFallaDto,
  EstacionDetalleDto,
  EstacionDto,
  TipoInstrumentoDto,
} from "@sicog/shared-types";
import type { ListEstacionesQuery } from "@sicog/shared-validators";
import { NotFoundError } from "../../../shared/errors.js";
import { estacionRepository as repo } from "../repositories/estacion.repository.js";
import { hoyUtc } from "../mantenimiento.fechas.js";

export const estacionService = {
  listar: (filtros: ListEstacionesQuery): Promise<{ items: EstacionDto[]; total: number }> =>
    repo.listar(filtros, hoyUtc()),

  async obtener(id: number): Promise<EstacionDetalleDto> {
    const estacion = await repo.obtener(id, hoyUtc());
    if (!estacion) throw new NotFoundError("No existe la estación");
    return estacion;
  },

  crear: repo.crear,
  actualizar: repo.actualizar,
  reemplazarInstrumentos: repo.reemplazarInstrumentos,

  listarAreas: (regionId?: number): Promise<AreaMttoDto[]> => repo.listarAreas(regionId),
  listarTiposInstrumento: (): Promise<TipoInstrumentoDto[]> => repo.listarTiposInstrumento(),
  listarCausas: (): Promise<CausaFallaDto[]> => repo.listarCausas(),
  crearCausa: (nombre: string): Promise<CausaFallaDto> => repo.crearCausa(nombre),
  actualizarCausa: repo.actualizarCausa,
};
