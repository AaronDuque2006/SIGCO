import type {
  ConsumoPorRegionDto,
  ConsumoPorSectorDto,
  ConsumoPorSectoresDto,
  PuntoSerieBalanceDto,
  SerieBalanceDto,
  TipoCorte,
} from "@sicog/shared-types";
import {
  consumoSectoresRepository,
  type FilaConsumo,
  type IConsumoSectoresRepository,
} from "../repositories/consumo-sectores.repository.js";
import { dateToFecha } from "../repositories/lectura-balance.repository.js";
import { sumarDias } from "./cierre-diario.service.js";

/** Redondeo a las 2 posiciones que muestra la pantalla (decisión #65). */
const dos = (n: number): number => Math.round(n * 100) / 100;

export class ReportesService {
  constructor(private readonly repo: IConsumoSectoresRepository) {}

  /**
   * Consumo por sectores: la dona y las barras por región del workbook.
   *
   * El total nacional por sector se calcula **sumando el desglose regional**,
   * no con una segunda consulta: es exactamente lo que hace el Excel
   * (`A49 = L52+L63+L70`), y así los dos números no pueden discrepar.
   */
  async consumoPorSectores(fecha: string, tipoCorte: TipoCorte): Promise<ConsumoPorSectoresDto> {
    const filas = await this.repo.consumoPorRegionYSector(fecha, tipoCorte);

    const porRegion: ConsumoPorRegionDto[] = [];
    const nacional = new Map<number, ConsumoPorSectorDto>();

    for (const f of filas) {
      const total = dos(Number(f.totalMmpced));
      const sector = { id: f.sectorId, nombre: f.sectorNombre, activo: f.sectorActivo };

      let region = porRegion.find((r) => r.region.id === f.regionId);
      if (!region) {
        region = {
          region: { id: f.regionId, nombre: f.regionNombre },
          sectores: [],
          totalMmpced: 0,
        };
        porRegion.push(region);
      }
      region.sectores.push({ sector, totalMmpced: total });
      region.totalMmpced = dos(region.totalMmpced + total);

      const acumulado = nacional.get(f.sectorId);
      if (acumulado) acumulado.totalMmpced = dos(acumulado.totalMmpced + total);
      else nacional.set(f.sectorId, { sector, totalMmpced: total });
    }

    // Mayor primero: una dona y un ranking se leen por tamaño, no por orden
    // alfabético del catálogo.
    const ordenado = [...nacional.values()].sort((a, b) => b.totalMmpced - a.totalMmpced);

    return {
      fecha,
      tipoCorte,
      nacional: ordenado,
      porRegion,
      totalMmpced: dos(ordenado.reduce((s, x) => s + x.totalMmpced, 0)),
    };
  }

  /**
   * La serie de recibido vs transportado — el gráfico de línea.
   *
   * Los días sin datos **se devuelven en cero y no se omiten**: el eje del
   * gráfico es el tiempo, y saltarse un día haría que dos puntos separados por
   * una semana se vieran contiguos. En el workbook esto no pasa porque las
   * siete filas se teclean a mano; acá el rango lo arma el servidor.
   *
   * El promedio se calcula sobre **todos** los días del rango, incluidos los
   * vacíos, igual que el `AVERAGE(C89:C95)` del workbook sobre sus siete filas.
   */
  async serieBalance(hasta: string, dias: number, tipoCorte: TipoCorte): Promise<SerieBalanceDto> {
    const desde = sumarDias(hasta, -(dias - 1));
    const filas = await this.repo.serieBalance(desde, hasta, tipoCorte);

    const porFecha = new Map(
      filas.map((f) => [
        dateToFecha(f.fecha),
        { recibido: Number(f.recibido), transportado: Number(f.transportado) },
      ]),
    );

    const puntos: PuntoSerieBalanceDto[] = [];
    for (let i = 0; i < dias; i++) {
      const fecha = sumarDias(desde, i);
      const v = porFecha.get(fecha);
      puntos.push({
        fecha,
        recibidoMmpced: dos(v?.recibido ?? 0),
        transportadoMmpced: dos(v?.transportado ?? 0),
      });
    }

    const media = (leer: (p: PuntoSerieBalanceDto) => number): number =>
      dos(puntos.reduce((s, p) => s + leer(p), 0) / puntos.length);

    return {
      desde,
      hasta,
      tipoCorte,
      dias: puntos,
      promedioRecibidoMmpced: media((p) => p.recibidoMmpced),
      promedioTransportadoMmpced: media((p) => p.transportadoMmpced),
    };
  }
}

export const reportesService = new ReportesService(consumoSectoresRepository);
