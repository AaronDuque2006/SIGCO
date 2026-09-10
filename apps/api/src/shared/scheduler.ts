import cron from "node-cron";
import { cierreDiarioService, hoyEn } from "../modules/despacho/services/cierre-diario.service.js";
import { env } from "./env.js";

async function correrCierre(motivo: string): Promise<void> {
  try {
    const resumen = await cierreDiarioService.ejecutarPendientes(hoyEn(env.CIERRE_DIARIO_TZ));
    const hubo =
      resumen.diasAbiertos.length > 0 || resumen.diasCerrados.length > 0 || resumen.truncado;
    if (hubo) {
      console.log(`[cierre] (${motivo})`, {
        abiertos: resumen.diasAbiertos,
        cerrados: resumen.diasCerrados,
        creados: resumen.cierresCreados,
        recalculados: resumen.cierresRecalculados,
        truncado: resumen.truncado,
      });
    }
  } catch (err) {
    // Que falle el cierre no puede tumbar la API: se registra y se reintenta
    // en la próxima corrida, que es idempotente.
    console.error(`[cierre] Falló la corrida (${motivo}):`, err);
  }
}

export function iniciarCierreDiario(): void {
  // Al arrancar además de a medianoche: si el proceso estuvo caído justo a esa
  // hora, el día igual se cierra apenas vuelve, en vez de quedar sin cerrar.
  void correrCierre("arranque");

  cron.schedule("5 0 * * *", () => void correrCierre("medianoche"), {
    timezone: env.CIERRE_DIARIO_TZ,
  });

  console.log(`[cierre] Programado 00:05 ${env.CIERRE_DIARIO_TZ}`);
}
