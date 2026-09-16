import { prisma } from "../../../shared/prisma-client.js";
import { fechaToDate } from "./lectura-balance.repository.js";
import type { TipoCorte } from "@sicog/shared-types";

export interface TotalesBalance {
  recibidoMmpced: number;
  transportadoMmpced: number;
  /** Cuánto de `transportadoMmpced` es quema. Se devuelve aparte para poder
   *  mostrarlo desglosado sin volver a consultar. */
  quemaMmpced: number;
  /** Cuánto es transferencia fuera del sistema (decisión #79). */
  transferenciasMmpced: number;
}

export interface IBalanceNacionRepository {
  totales(fecha: string, tipoCorte: TipoCorte): Promise<TotalesBalance>;
}

/**
 * "Balance Nación" es query-calculado y no una tabla (decisión #15): se suma en
 * la base y no se guarda, porque no alimenta ningún informe formal — el que sí
 * lo hace es el `CIERRE_PROMEDIO`, que el job persiste como fila propia.
 *
 * Composición de cada término:
 * - `recibido` = todo lo leído en las FUENTES ese día. Las fuentes no tienen
 *   tipo de corte (una lectura por día), así que no se filtran por él.
 * - `transportado` = lo entregado a CLIENTES en ese corte, **más la quema
 *   nacional y más las transferencias** fuera del sistema (decisión #79: el
 *   workbook las cuenta dentro del total de su bloque, y excluirlas dejaba el
 *   transportado corto). Corregido el 2026-09-15 al leer la fórmula del workbook
 *   (`EJECUTIVO PUNTUAL!C45 = SUM(C36,C38:C44) + G49`, donde `G49` es
 *   `FUENTES!I29`, rotulado "QUEMA PUNTUAL"): el Excel sí la suma. La
 *   decisión #62 había dicho lo contrario y se revisó (decisión #74).
 *
 * La quema se consulta con el mismo `tipoCorte` que los clientes: el modelo
 * tiene `@@unique(fecha, tipoCorte)` y la mecánica puntual/cierre de la
 * decisión #34 le aplica igual (decisión #14).
 */
export class PrismaBalanceNacionRepository implements IBalanceNacionRepository {
  async totales(fecha: string, tipoCorte: TipoCorte): Promise<TotalesBalance> {
    const dia = fechaToDate(fecha);

    // `aggregate` de Prisma y no `$queryRaw`: son tres sumas simples sobre una
    // sola tabla cada una. El `$queryRaw` parametrizado del §11 queda para los
    // reportes que sí necesitan agrupar y cruzar (Consumo por Sectores).
    const [fuentes, clientes, quema, transferencias] = await Promise.all([
      prisma.lecturaFuente.aggregate({
        _sum: { volumenMmpced: true },
        where: { fecha: dia },
      }),
      prisma.lecturaBalance.aggregate({
        _sum: { volumenMmpced: true },
        where: { fecha: dia, tipoCorte },
      }),
      prisma.quemaNacional.findUnique({
        where: { fecha_tipoCorte: { fecha: dia, tipoCorte } },
        select: { mmpced: true },
      }),
      prisma.lecturaTransferencia.aggregate({
        _sum: { mmpced: true },
        where: { fecha: dia, tipoCorte },
      }),
    ]);

    // Un día sin ninguna lectura da `null`, no 0: se normaliza acá para que el
    // Service no tenga que saberlo. Lo mismo con un día sin quema cargada.
    const quemaMmpced = quema?.mmpced.toNumber() ?? 0;
    const transferenciasMmpced = transferencias._sum.mmpced?.toNumber() ?? 0;
    return {
      recibidoMmpced: fuentes._sum.volumenMmpced?.toNumber() ?? 0,
      transportadoMmpced:
        (clientes._sum.volumenMmpced?.toNumber() ?? 0) + quemaMmpced + transferenciasMmpced,
      quemaMmpced,
      transferenciasMmpced,
    };
  }
}

export const balanceNacionRepository = new PrismaBalanceNacionRepository();
