import { Prisma } from "@sicog/db";
import type { TipoCorte } from "@sicog/shared-types";
import { prisma } from "../../../shared/prisma-client.js";
import { fechaToDate } from "./lectura-balance.repository.js";

export interface FilaConsumo {
  regionId: number;
  regionNombre: string;
  sectorId: number;
  sectorNombre: string;
  sectorActivo: boolean;
  totalMmpced: Prisma.Decimal;
}

export interface FilaSerie {
  fecha: Date;
  recibido: Prisma.Decimal;
  transportado: Prisma.Decimal;
}

export interface IConsumoSectoresRepository {
  consumoPorRegionYSector(fecha: string, tipoCorte: TipoCorte): Promise<FilaConsumo[]>;
  serieBalance(desde: string, hasta: string, tipoCorte: TipoCorte): Promise<FilaSerie[]>;
}

/**
 * Los dos reportes que sí necesitan agrupar y cruzar, y por eso van en
 * `$queryRaw` **parametrizado** (§11.2, decisiones #15 y #37) en vez de traer
 * las filas y sumarlas en JavaScript: son agregaciones que Postgres hace con
 * `numeric` exacto, sobre 111 clientes y varios días.
 *
 * Nunca se concatena SQL: `Prisma.sql` interpola como parámetros, incluido el
 * `::tipo_corte` del enum.
 */
export class PrismaConsumoSectoresRepository implements IConsumoSectoresRepository {
  /**
   * Una fila por región y sector con consumo ese día.
   *
   * El resultado es **disperso a propósito**: sólo aparecen los pares que
   * tuvieron lectura. El workbook hace lo mismo — CENTRO lista 3 sectores y
   * CEN-OCC lista 6 — y rellenar con ceros inventaría filas que el área no ve.
   *
   * No entra la quema nacional: no es consumo de ningún sector, y en el
   * workbook queda fuera del rango de la gráfica a propósito.
   */
  consumoPorRegionYSector(fecha: string, tipoCorte: TipoCorte): Promise<FilaConsumo[]> {
    return prisma.$queryRaw<FilaConsumo[]>`
      SELECT r.id            AS "regionId",
             r.nombre        AS "regionNombre",
             s.id            AS "sectorId",
             s.nombre        AS "sectorNombre",
             s.activo        AS "sectorActivo",
             SUM(lb.volumen_mmpced) AS "totalMmpced"
      FROM lecturas_balance lb
      JOIN clientes c            ON c.id = lb.cliente_id
      JOIN regiones_operativa r  ON r.id = c.region_id
      JOIN sectores_cliente s    ON s.id = c.sector_id
      WHERE lb.fecha = ${fechaToDate(fecha)}
        AND lb.tipo_corte = ${tipoCorte}::tipo_corte
      GROUP BY r.id, r.nombre, s.id, s.nombre, s.activo
      ORDER BY r.nombre, s.nombre
    `;
  }

  /**
   * Un día por fila entre `desde` y `hasta`, con lo recibido y lo
   * transportado.
   *
   * Los tres términos viven en tablas distintas y con reglas distintas —las
   * fuentes no tienen corte, los clientes y la quema sí—, así que se suman por
   * separado y se unen por fecha con un `FULL OUTER JOIN`: un día puede tener
   * fuentes y no clientes, o al revés.
   *
   * La quema va **dentro** del transportado, igual que en el Balance Nación
   * (decisión #74).
   */
  serieBalance(desde: string, hasta: string, tipoCorte: TipoCorte): Promise<FilaSerie[]> {
    const d = fechaToDate(desde);
    const h = fechaToDate(hasta);
    return prisma.$queryRaw<FilaSerie[]>`
      WITH recibido AS (
        SELECT fecha, SUM(volumen_mmpced) AS total
        FROM lecturas_fuente
        WHERE fecha BETWEEN ${d} AND ${h}
        GROUP BY fecha
      ),
      transportado AS (
        SELECT fecha, SUM(total) AS total FROM (
          SELECT fecha, SUM(volumen_mmpced) AS total
          FROM lecturas_balance
          WHERE fecha BETWEEN ${d} AND ${h} AND tipo_corte = ${tipoCorte}::tipo_corte
          GROUP BY fecha
          UNION ALL
          SELECT fecha, mmpced AS total
          FROM quemas_nacional
          WHERE fecha BETWEEN ${d} AND ${h} AND tipo_corte = ${tipoCorte}::tipo_corte
        ) u
        GROUP BY fecha
      )
      SELECT COALESCE(r.fecha, t.fecha)  AS "fecha",
             COALESCE(r.total, 0)        AS "recibido",
             COALESCE(t.total, 0)        AS "transportado"
      FROM recibido r
      FULL OUTER JOIN transportado t ON t.fecha = r.fecha
      ORDER BY 1
    `;
  }
}

export const consumoSectoresRepository = new PrismaConsumoSectoresRepository();
