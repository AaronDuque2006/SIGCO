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

export interface FilaAgrupacion {
  sistemaId: number;
  sistemaNombre: string;
  subSistemaId: number | null;
  subSistemaNombre: string | null;
  totalMmpced: Prisma.Decimal;
}

export interface IConsumoSectoresRepository {
  consumoPorRegionYSector(fecha: string, tipoCorte: TipoCorte): Promise<FilaConsumo[]>;
  entregaPorAgrupacion(fecha: string, tipoCorte: TipoCorte): Promise<FilaAgrupacion[]>;
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
   * Lo entregado agrupado por sub-sistema cuando el cliente tiene uno, y por
   * sistema cuando no (decisión #78).
   *
   * El `GROUP BY` lleva las dos columnas y el `LEFT JOIN` deja `NULL` en la
   * del sub-sistema: cada sistema produce una fila por cada rama suya con
   * consumo, más una fila con `NULL` que junta a los que cuelgan directo. Eso
   * **es** la regla, sin ramificar en JavaScript.
   */
  entregaPorAgrupacion(fecha: string, tipoCorte: TipoCorte): Promise<FilaAgrupacion[]> {
    const dia = fechaToDate(fecha);
    // Dos orígenes, un mismo eje: lo entregado a clientes y lo que sale por un
    // punto de transferencia (decisión #79). Se unen antes de agrupar porque en
    // el workbook viven en el mismo bloque y suman al mismo total; separarlos
    // dejaría la barra corta, que es justo el error que esto corrige.
    return prisma.$queryRaw<FilaAgrupacion[]>`
      WITH entregado AS (
        SELECT c.sistema_id, c.sub_sistema_id, lb.volumen_mmpced AS mmpced
        FROM lecturas_balance lb
        JOIN clientes c ON c.id = lb.cliente_id
        WHERE lb.fecha = ${dia} AND lb.tipo_corte = ${tipoCorte}::tipo_corte
        UNION ALL
        SELECT p.sistema_id, p.sub_sistema_id, lt.mmpced
        FROM lecturas_transferencia lt
        JOIN puntos_transferencia p ON p.id = lt.punto_id
        WHERE lt.fecha = ${dia} AND lt.tipo_corte = ${tipoCorte}::tipo_corte
      )
      SELECT s.id      AS "sistemaId",
             s.nombre  AS "sistemaNombre",
             ss.id     AS "subSistemaId",
             ss.nombre AS "subSistemaNombre",
             SUM(e.mmpced) AS "totalMmpced"
      FROM entregado e
      JOIN sistemas s           ON s.id = e.sistema_id
      LEFT JOIN sub_sistemas ss ON ss.id = e.sub_sistema_id
      GROUP BY s.id, s.nombre, ss.id, ss.nombre
      ORDER BY 5 DESC
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
   * La quema y las transferencias van **dentro** del transportado, y el desvío
   * y las entregas directas dentro del recibido, igual que en el Balance
   * Nación (decisiones #74, #79 y #107).
   */
  serieBalance(desde: string, hasta: string, tipoCorte: TipoCorte): Promise<FilaSerie[]> {
    const d = fechaToDate(desde);
    const h = fechaToDate(hasta);
    return prisma.$queryRaw<FilaSerie[]>`
      WITH recibido AS (
        SELECT fecha, SUM(total) AS total FROM (
          SELECT fecha, SUM(volumen_mmpced + COALESCE(desvio, 0)) AS total
          FROM lecturas_fuente
          WHERE fecha BETWEEN ${d} AND ${h}
          GROUP BY fecha
          UNION ALL
          SELECT lb.fecha, SUM(lb.volumen_mmpced) AS total
          FROM lecturas_balance lb
          JOIN clientes c ON c.id = lb.cliente_id
          WHERE lb.fecha BETWEEN ${d} AND ${h} AND lb.tipo_corte = ${tipoCorte}::tipo_corte
            AND c.entrega_directa
          GROUP BY lb.fecha
        ) u
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
          UNION ALL
          SELECT fecha, SUM(mmpced) AS total
          FROM lecturas_transferencia
          WHERE fecha BETWEEN ${d} AND ${h} AND tipo_corte = ${tipoCorte}::tipo_corte
          GROUP BY fecha
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
