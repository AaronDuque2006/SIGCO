import type {
  GerenciaRequirienteDto,
  InsumoDto,
  OpcionCatalogoDto,
  ProductoServicioDto,
  RegionMttoDto,
} from "@sicog/shared-types";
import type {
  CreateGerenciaRequirienteInput,
  CreateInsumoInput,
  CreateProductoServicioInput,
  UpdateGerenciaRequirienteInput,
  UpdateInsumoInput,
  UpdateProductoServicioInput,
} from "@sicog/shared-validators";
import type { ICatalogoActividadesRepository } from "../repositories/catalogo.repository.js";
import { catalogoActividadesRepository } from "../repositories/catalogo.repository.js";

/**
 * Los catálogos del módulo.
 *
 * El Service no verifica unicidad ni autorización: la primera la hace el único
 * de la base (decisión #82) y la segunda el middleware, que es quien tiene el
 * contexto HTTP para dejar registro del 403. Acá queda lo que es regla de
 * negocio y no de infraestructura.
 */
export class CatalogoActividadesService {
  constructor(private readonly repo: ICatalogoActividadesRepository) {}

  listarInsumos(departamentoId?: number): Promise<InsumoDto[]> {
    return this.repo.listarInsumos(departamentoId);
  }

  crearInsumo(datos: CreateInsumoInput): Promise<InsumoDto> {
    return this.repo.crearInsumo(datos);
  }

  actualizarInsumo(id: number, datos: UpdateInsumoInput): Promise<InsumoDto> {
    return this.repo.actualizarInsumo(id, datos);
  }

  listarProductos(filtros: {
    departamentoId?: number;
    insumoId?: number;
  }): Promise<ProductoServicioDto[]> {
    return this.repo.listarProductos(filtros);
  }

  crearProducto(datos: CreateProductoServicioInput): Promise<ProductoServicioDto> {
    return this.repo.crearProducto(datos);
  }

  actualizarProducto(id: number, datos: UpdateProductoServicioInput): Promise<ProductoServicioDto> {
    return this.repo.actualizarProducto(id, datos);
  }

  listarGerencias(departamentoId?: number): Promise<GerenciaRequirienteDto[]> {
    return this.repo.listarGerencias(departamentoId);
  }

  crearGerencia(datos: CreateGerenciaRequirienteInput): Promise<GerenciaRequirienteDto> {
    return this.repo.crearGerencia(datos);
  }

  actualizarGerencia(
    id: number,
    datos: UpdateGerenciaRequirienteInput,
  ): Promise<GerenciaRequirienteDto> {
    return this.repo.actualizarGerencia(id, datos);
  }

  listarRegiones(): Promise<RegionMttoDto[]> {
    return this.repo.listarRegiones();
  }

  listarDepartamentos(): Promise<OpcionCatalogoDto[]> {
    return this.repo.listarDepartamentos();
  }
}

export const catalogoActividadesService = new CatalogoActividadesService(
  catalogoActividadesRepository,
);
