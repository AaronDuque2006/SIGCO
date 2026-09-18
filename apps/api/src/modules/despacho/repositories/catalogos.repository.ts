import { prisma } from "../../../shared/prisma-client.js";
import { traducirEscritura } from "../../../shared/prisma-errores.js";

// Se reexporta porque los repositorios de Despacho ya lo importaban desde acá
// cuando vivía en este archivo; mudarlo a `shared/` no tiene por qué obligar a
// tocarlos a todos.
export { traducirEscritura };

export interface CatalogoRow {
  id: number;
  nombre: string;
}

export interface SectorRow extends CatalogoRow {
  activo: boolean;
}

export interface ICatalogosRepository {
  listSistemas(): Promise<CatalogoRow[]>;
  listRegiones(): Promise<CatalogoRow[]>;
  listSectores(): Promise<SectorRow[]>;
  findSector(id: number): Promise<SectorRow | null>;
  createSector(nombre: string): Promise<SectorRow>;
  updateSector(id: number, datos: { nombre?: string; activo?: boolean }): Promise<SectorRow>;
}

const CAMPOS_SECTOR = { id: true, nombre: true, activo: true } as const;

/**
 * Los tres catálogos de Despacho viven en un solo repositorio.
 *
 * Son tres listas de 7, 4 y 7 filas con el mismo consumidor; darle a cada una
 * su propio archivo de tres capas sería el mismo sobre-diseño que se descartó
 * en la decisión #61 para los catálogos del organigrama. `SISTEMA` y
 * `REGION_OPERATIVA` son de sólo lectura —se siembran y no se editan por la
 * API—; el único con escritura es `SECTOR_CLIENTE` (decisión #31).
 */
export class PrismaCatalogosRepository implements ICatalogosRepository {
  listSistemas(): Promise<CatalogoRow[]> {
    return prisma.sistema.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
  }

  listRegiones(): Promise<CatalogoRow[]> {
    return prisma.regionOperativa.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
  }

  // Devuelve también los desactivados, con su bandera `activo`. Un sector dado
  // de baja tiene que seguir siendo resoluble: los reportes históricos lo
  // nombran, y para eso existe el soft-delete en vez del DELETE (decisión #31).
  // Quién arma un desplegable filtra por `activo`; quién pinta un reporte no.
  listSectores(): Promise<SectorRow[]> {
    return prisma.sectorCliente.findMany({
      select: CAMPOS_SECTOR,
      orderBy: { nombre: "asc" },
    });
  }

  findSector(id: number): Promise<SectorRow | null> {
    return prisma.sectorCliente.findUnique({ where: { id }, select: CAMPOS_SECTOR });
  }

  async createSector(nombre: string): Promise<SectorRow> {
    try {
      return await prisma.sectorCliente.create({ data: { nombre }, select: CAMPOS_SECTOR });
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: `Ya existe un sector llamado "${nombre}"`,
        noExiste: "No existe el sector",
      });
    }
  }

  async updateSector(
    id: number,
    datos: { nombre?: string; activo?: boolean },
  ): Promise<SectorRow> {
    try {
      return await prisma.sectorCliente.update({
        where: { id },
        data: datos,
        select: CAMPOS_SECTOR,
      });
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: `Ya existe un sector llamado "${datos.nombre ?? ""}"`,
        noExiste: `No existe el sector ${id}`,
      });
    }
  }
}

export const catalogosRepository = new PrismaCatalogosRepository();
