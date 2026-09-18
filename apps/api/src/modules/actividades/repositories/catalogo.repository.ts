import { Prisma } from "@sicog/db";
import type {
  GerenciaRequirienteDto,
  InsumoDto,
  ProductoServicioDto,
  RegionMttoDto,
} from "@sicog/shared-types";
import { prisma } from "../../../shared/prisma-client.js";
import { traducirEscritura } from "../../../shared/prisma-errores.js";

/**
 * Los catálogos del módulo, que son tres tablas con la misma forma: nombre,
 * departamento dueño y bandera de baja lógica.
 *
 * **El único de la base es el mecanismo de unicidad, no un chequeo previo**
 * (decisión #82, que aplica acá el criterio de la #66). Entre un `SELECT` y un
 * `INSERT` hay una carrera, así que se intenta insertar y se traduce la
 * violación: dos peticiones simultáneas con el mismo nombre no pueden pasar
 * las dos.
 */
export interface ICatalogoActividadesRepository {
  listarInsumos(departamentoId?: number): Promise<InsumoDto[]>;
  crearInsumo(datos: { departamentoId: number; nombre: string }): Promise<InsumoDto>;
  actualizarInsumo(id: number, datos: { nombre?: string; activo?: boolean }): Promise<InsumoDto>;
  departamentoDeInsumo(id: number): Promise<number | null>;

  listarProductos(filtros: { departamentoId?: number; insumoId?: number }): Promise<ProductoServicioDto[]>;
  crearProducto(datos: {
    insumoId: number;
    nombre: string;
    descripcionActividad: string | null;
  }): Promise<ProductoServicioDto>;
  actualizarProducto(
    id: number,
    datos: { nombre?: string; descripcionActividad?: string | null; activo?: boolean },
  ): Promise<ProductoServicioDto>;
  departamentoDeProducto(id: number): Promise<number | null>;

  listarGerencias(departamentoId?: number): Promise<GerenciaRequirienteDto[]>;
  crearGerencia(datos: { departamentoId: number; nombre: string }): Promise<GerenciaRequirienteDto>;
  actualizarGerencia(
    id: number,
    datos: { nombre?: string; activo?: boolean },
  ): Promise<GerenciaRequirienteDto>;
  departamentoDeGerencia(id: number): Promise<number | null>;

  listarRegiones(): Promise<RegionMttoDto[]>;
}

const insumoSelect = {
  id: true,
  nombre: true,
  activo: true,
  departamento: { select: { id: true, nombre: true } },
} as const;

const productoSelect = {
  id: true,
  nombre: true,
  descripcionActividad: true,
  activo: true,
  insumo: { select: insumoSelect },
} as const;

type FilaInsumo = Prisma.InsumoGetPayload<{ select: typeof insumoSelect }>;
type FilaProducto = Prisma.ProductoServicioGetPayload<{ select: typeof productoSelect }>;

const aInsumo = (f: FilaInsumo): InsumoDto => ({
  id: f.id,
  departamento: f.departamento,
  nombre: f.nombre,
  activo: f.activo,
});

const aProducto = (f: FilaProducto): ProductoServicioDto => ({
  id: f.id,
  insumo: aInsumo(f.insumo),
  nombre: f.nombre,
  descripcionActividad: f.descripcionActividad,
  activo: f.activo,
});

export class PrismaCatalogoActividadesRepository implements ICatalogoActividadesRepository {
  // Los listados devuelven **también los inactivos**, con su bandera: los
  // reportes históricos nombran filas dadas de baja, y para eso existe el
  // soft-delete (decisión #31). Quien arma un desplegable filtra; quien pinta
  // un reporte no.
  async listarInsumos(departamentoId?: number): Promise<InsumoDto[]> {
    const filas = await prisma.insumo.findMany({
      where: departamentoId === undefined ? {} : { departamentoId },
      select: insumoSelect,
      orderBy: { nombre: "asc" },
    });
    return filas.map(aInsumo);
  }

  async crearInsumo(datos: { departamentoId: number; nombre: string }): Promise<InsumoDto> {
    try {
      return aInsumo(await prisma.insumo.create({ data: datos, select: insumoSelect }));
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe un insumo con ese nombre en el departamento",
        noExiste: "No existe el insumo",
      });
    }
  }

  async actualizarInsumo(
    id: number,
    datos: { nombre?: string; activo?: boolean },
  ): Promise<InsumoDto> {
    try {
      return aInsumo(await prisma.insumo.update({ where: { id }, data: datos, select: insumoSelect }));
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe un insumo con ese nombre en el departamento",
        noExiste: "No existe el insumo",
      });
    }
  }

  async departamentoDeInsumo(id: number): Promise<number | null> {
    const f = await prisma.insumo.findUnique({ where: { id }, select: { departamentoId: true } });
    return f?.departamentoId ?? null;
  }

  async listarProductos(filtros: {
    departamentoId?: number;
    insumoId?: number;
  }): Promise<ProductoServicioDto[]> {
    const filas = await prisma.productoServicio.findMany({
      where: {
        ...(filtros.insumoId === undefined ? {} : { insumoId: filtros.insumoId }),
        ...(filtros.departamentoId === undefined
          ? {}
          : { insumo: { departamentoId: filtros.departamentoId } }),
      },
      select: productoSelect,
      // Por insumo y después por nombre: es como se lee el catálogo, y como lo
      // agrupa la hoja de plan del workbook.
      orderBy: [{ insumo: { nombre: "asc" } }, { nombre: "asc" }],
    });
    return filas.map(aProducto);
  }

  async crearProducto(datos: {
    insumoId: number;
    nombre: string;
    descripcionActividad: string | null;
  }): Promise<ProductoServicioDto> {
    try {
      return aProducto(
        await prisma.productoServicio.create({ data: datos, select: productoSelect }),
      );
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe un producto con ese nombre en el insumo",
        noExiste: "No existe el producto o su insumo",
      });
    }
  }

  async actualizarProducto(
    id: number,
    datos: { nombre?: string; descripcionActividad?: string | null; activo?: boolean },
  ): Promise<ProductoServicioDto> {
    try {
      return aProducto(
        await prisma.productoServicio.update({ where: { id }, data: datos, select: productoSelect }),
      );
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe un producto con ese nombre en el insumo",
        noExiste: "No existe el producto o su insumo",
      });
    }
  }

  async departamentoDeProducto(id: number): Promise<number | null> {
    const f = await prisma.productoServicio.findUnique({
      where: { id },
      select: { insumo: { select: { departamentoId: true } } },
    });
    return f?.insumo.departamentoId ?? null;
  }

  async listarGerencias(departamentoId?: number): Promise<GerenciaRequirienteDto[]> {
    const filas = await prisma.gerenciaRequiriente.findMany({
      where: departamentoId === undefined ? {} : { departamentoId },
      select: insumoSelect,
      orderBy: { nombre: "asc" },
    });
    return filas.map(aInsumo);
  }

  async crearGerencia(datos: {
    departamentoId: number;
    nombre: string;
  }): Promise<GerenciaRequirienteDto> {
    try {
      return aInsumo(
        await prisma.gerenciaRequiriente.create({ data: datos, select: insumoSelect }),
      );
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe una gerencia con ese nombre en el departamento",
        noExiste: "No existe la gerencia",
      });
    }
  }

  async actualizarGerencia(
    id: number,
    datos: { nombre?: string; activo?: boolean },
  ): Promise<GerenciaRequirienteDto> {
    try {
      return aInsumo(
        await prisma.gerenciaRequiriente.update({
          where: { id },
          data: datos,
          select: insumoSelect,
        }),
      );
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe una gerencia con ese nombre en el departamento",
        noExiste: "No existe la gerencia",
      });
    }
  }

  async departamentoDeGerencia(id: number): Promise<number | null> {
    const f = await prisma.gerenciaRequiriente.findUnique({
      where: { id },
      select: { departamentoId: true },
    });
    return f?.departamentoId ?? null;
  }

  // Sólo lectura: las 6 regiones de Mantenimiento se siembran y este módulo
  // las **reutiliza** (decisión #19). No son suyas para editarlas.
  async listarRegiones(): Promise<RegionMttoDto[]> {
    return prisma.regionMtto.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
  }
}

export const catalogoActividadesRepository = new PrismaCatalogoActividadesRepository();
