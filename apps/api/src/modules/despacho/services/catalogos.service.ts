import type {
  Paginated,
  RegionOperativaDto,
  SectorClienteDto,
  SistemaDto,
} from "@sicog/shared-types";
import type { UpdateSectorClienteInput } from "@sicog/shared-validators";
import { NotFoundError } from "../../../shared/errors.js";
import { singlePage } from "../../../shared/http.js";
import {
  catalogosRepository,
  type ICatalogosRepository,
} from "../repositories/catalogos.repository.js";

/**
 * Los tres catálogos van **sin paginar**, envueltos igual en `Paginated<T>`.
 *
 * Son 7, 4 y 7 filas y no crecen sin techo: paginarlos sería obligar al
 * consumidor a recorrer páginas de una lista que entra entera en una pantalla.
 * Pero la envoltura se mantiene porque §11.1 fija que la forma de una lista no
 * cambia según los parámetros — quien consume lee `data` y ya, sin ramificar
 * por tipo de respuesta.
 */
export class CatalogosService {
  constructor(private readonly repo: ICatalogosRepository) {}

  async listarSistemas(): Promise<Paginated<SistemaDto>> {
    return singlePage(await this.repo.listSistemas());
  }

  async listarRegiones(): Promise<Paginated<RegionOperativaDto>> {
    return singlePage(await this.repo.listRegiones());
  }

  async listarSectores(): Promise<Paginated<SectorClienteDto>> {
    return singlePage(await this.repo.listSectores());
  }

  crearSector(nombre: string): Promise<SectorClienteDto> {
    return this.repo.createSector(nombre);
  }

  /**
   * `activo: false` es la baja: no hay DELETE (decisión #31). Un sector que se
   * borrara de verdad dejaría huérfanos los reportes históricos que lo nombran.
   */
  async actualizarSector(id: number, datos: UpdateSectorClienteInput): Promise<SectorClienteDto> {
    if (!(await this.repo.findSector(id))) throw new NotFoundError(`No existe el sector ${id}`);
    return this.repo.updateSector(id, datos);
  }
}

export const catalogosService = new CatalogosService(catalogosRepository);
