import cron from "node-cron";
import { cierreDiarioService, hoyEn } from "../modules/despacho/services/cierre-diario.service.js";
import { ingestaService } from "../modules/rag/services/ingesta.service.js";
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

// Fase 2 — RAG (§16.7). Cada 30 segundos: procesa documentos pendientes y pone
// al día las novedades nuevas o editadas. Si Ollama no está, cada pasada lo
// registra y la siguiente reintenta; la API sigue funcionando igual.
const INTERVALO_RAG_MS = 30_000;

export function iniciarWorkerRag(): void {
  if (!env.RAG_HABILITADO) {
    console.log("[rag] Worker apagado (RAG_HABILITADO=false)");
    return;
  }
  const pasada = (): void => {
    ingestaService.ejecutarPasada().catch((err) => console.error("[rag] Falló la pasada:", err));
  };
  pasada();
  setInterval(pasada, INTERVALO_RAG_MS);
  console.log(`[rag] Worker cada ${INTERVALO_RAG_MS / 1000}s contra ${env.OLLAMA_URL}`);
}
