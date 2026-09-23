import puppeteer, { type Browser } from "puppeteer";
import { COOKIE_ACCESS } from "../../auth/controllers/auth.controller.js";
import { env } from "../../../shared/env.js";
import type { TipoCorte } from "@sicog/shared-types";

// Un solo navegador para todo el proceso: levantar Chromium tarda ~1s, y
// exportar un PDF no es tan raro como para pagar eso en cada pedido. Se
// levanta perezoso, en el primer export, no al arrancar la API — la mayoría
// de los arranques (dev, tests) no exportan nunca un PDF.
let navegador: Browser | null = null;

async function obtenerNavegador(): Promise<Browser> {
  if (navegador && navegador.connected) return navegador;
  navegador = await puppeteer.launch({
    headless: true,
    // Sandbox de Chromium apagado: es lo estándar corriendo como root dentro
    // de un contenedor Docker (el resto del stack ya corre así, decisión de
    // despliegue en Coolify), no una relajación de seguridad de la app.
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return navegador;
}

/**
 * Arma el PDF del reporte de Despacho navegando la propia vista de impresión
 * de `apps/web` (`/imprimir/reportes`) con Puppeteer, en vez de dibujar las
 * gráficas de nuevo del lado del servidor.
 *
 * Se eligió así — y no una librería de PDF sin navegador — porque el pedido
 * fue explícito: "que se vea igual que la aplicación", y las gráficas son SVG
 * a mano (`components/graficas.tsx`); reimplementar su geometría en el
 * servidor sería una segunda fuente de la verdad que diverge la primera vez
 * que alguien retoque una sin acordarse de la otra.
 *
 * La cookie de sesión se reenvía tal cual llegó a este endpoint: la vista de
 * impresión pide los mismos datos que la pantalla normal (`useBalanceNacion`,
 * `useConsumoPorSectores`), autenticados igual, sin un modo especial "para
 * Puppeteer" que hubiera que mantener aparte.
 */
export async function generarReportePdf(
  fecha: string,
  tipoCorte: TipoCorte,
  accessToken: string,
): Promise<Buffer> {
  const browser = await obtenerNavegador();
  const page = await browser.newPage();
  try {
    const webUrl = new URL(env.WEB_ORIGIN);
    await page.setCookie({
      name: COOKIE_ACCESS,
      value: accessToken,
      domain: webUrl.hostname,
      path: "/",
    });

    const destino = new URL("/imprimir/reportes", env.WEB_ORIGIN);
    destino.searchParams.set("fecha", fecha);
    destino.searchParams.set("tipoCorte", tipoCorte);

    await page.goto(destino.toString(), { waitUntil: "networkidle0" });
    // La página marca `data-pdf-listo` recién cuando las dos consultas del
    // reporte resolvieron (ver `imprimir/reportes/page.tsx`): imprimir antes
    // dejaría el PDF con gráficas a medio cargar.
    await page.waitForSelector('[data-pdf-listo="true"]', { timeout: 15_000 });

    return Buffer.from(
      await page.pdf({
        format: "a4",
        printBackground: true,
        margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
      }),
    );
  } finally {
    await page.close();
  }
}
