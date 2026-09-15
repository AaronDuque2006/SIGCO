import type { BalanceNacionDto, CondicionBalance, TipoCorte } from "@sicog/shared-types";
import {
  balanceNacionRepository,
  type IBalanceNacionRepository,
} from "../repositories/balance-nacion.repository.js";

/**
 * Regla de la condición, leída de la fórmula del workbook real
 * (`EJECUTIVO PUNTUAL!G14`): `=IF(variacion>0,"EMPAQUE","DESEMPAQUE")`.
 *
 * Es un corte **estricto** en cero, sin umbral de tolerancia, y por lo tanto la
 * variación exactamente 0 cae en `DESEMPAQUE` — eso sale de la rama else del
 * `IF`, no de una decisión deliberada del área (§11.5). Si algún día se
 * confirma que el cero debería tener su propio estado, cambia acá y en el tipo.
 */
const condicionDe = (variacion: number): CondicionBalance =>
  variacion > 0 ? "EMPAQUE" : "DESEMPAQUE";

export class BalanceNacionService {
  constructor(private readonly repo: IBalanceNacionRepository) {}

  async obtener(fecha: string, tipoCorte: TipoCorte): Promise<BalanceNacionDto> {
    const { recibidoMmpced, transportadoMmpced, quemaMmpced } = await this.repo.totales(
      fecha,
      tipoCorte,
    );
    const variacionMmpced = recibidoMmpced - transportadoMmpced;
    return {
      fecha,
      tipoCorte,
      recibidoMmpced,
      transportadoMmpced,
      quemaMmpced,
      variacionMmpced,
      condicion: condicionDe(variacionMmpced),
    };
  }
}

export const balanceNacionService = new BalanceNacionService(balanceNacionRepository);
