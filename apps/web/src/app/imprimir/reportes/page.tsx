"use client";

import type { TipoCorte } from "@sicog/shared-types";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ContenidoReportes } from "@/components/contenido-reportes";
import { useBalanceNacion, useConsumoPorSectores } from "@/lib/despacho";

/**
 * Vista de impresión del reporte de Despacho — no la ve nadie a través del
 * menú, sólo Puppeteer al armar el PDF (`GET /despacho/reportes/pdf`).
 *
 * Vive fuera de `/despacho` a propósito: ese segmento tiene su propio layout
 * con el menú lateral y `GuardiaSesion` (que redirige a `/login` si tarda en
 * hidratar la sesión), ninguno de los dos tiene sentido en una página que
 * sólo un navegador headless visita una vez, ya autenticado por la cookie que
 * le puso el propio backend.
 *
 * Fuerza el tema claro sin mirar `localStorage` —decisión #81: "los PDF de
 * gráficas y datos se leen mejor en blanco"— y expone `data-pdf-listo` para
 * que el backend sepa cuándo las dos consultas ya resolvieron y recién ahí
 * imprimir; imprimir a mitad de carga dejaría el PDF con huecos.
 */
export default function ImprimirReportesPage() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  );
}

function Contenido() {
  const params = useSearchParams();
  const fecha = params.get("fecha") ?? "";
  const tipoCorte = (params.get("tipoCorte") as TipoCorte | null) ?? "PUNTUAL";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const balance = useBalanceNacion(fecha, tipoCorte);
  const consumo = useConsumoPorSectores(fecha, tipoCorte);

  const error = balance.error ?? consumo.error;
  const listo = balance.data !== undefined && consumo.data !== undefined;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="flex items-baseline justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-lg font-semibold">Reporte de Despacho</h1>
          <p className="text-sm text-muted-foreground">
            {fecha} · {tipoCorte === "PUNTUAL" ? "Puntual" : "Cierre promedio"}
          </p>
        </div>
        {/* El fondo con membrete de PDVSA va acá cuando el owner lo pase
            (pendiente, sesión 2026-09-22): esta cabecera es el marcador de
            posición hasta entonces. */}
      </header>

      {error ? (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : !listo ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Cargando…
        </p>
      ) : (
        <div data-pdf-listo="true">
          <ContenidoReportes balance={balance.data!} consumo={consumo.data!} tipoCorte={tipoCorte} />
        </div>
      )}

      <footer className="mt-8 border-t border-border pt-3 text-xs text-muted-foreground">
        Generado con SICOG — Sistema de Información para la Gerencia de Control Operacional de Gas, PDVSA Gas.
      </footer>
    </main>
  );
}
