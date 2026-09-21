"use client";

import type { DisponibilidadFilaDto } from "@sicog/shared-types";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { GraficaBarras } from "@/components/graficas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatearPorcentaje,
  useDisponibilidad,
  useSerieDisponibilidad,
} from "@/lib/mantenimiento";
import { SubNavTelemetria } from "./sub-nav";

/**
 * El tablero de disponibilidad: cuántas estaciones están comunicando hoy, de
 * cuántas, y por qué están caídas las demás.
 *
 * Reproduce las tres salidas del reporte semanal real —el corte por región, el
 * histograma de causas y la serie contra la meta— pero **calculadas** desde la
 * bitácora, no tecleadas. En el archivo original las tres viven en hojas
 * distintas que nadie enlaza, así que pueden discrepar entre sí sin que nadie
 * se entere.
 */
export function Disponibilidad() {
  const anio = new Date().getUTCFullYear();
  const { data, isPending, isError } = useDisponibilidad();
  const serie = useSerieDisponibilidad(anio);

  return (
    <main>
      <SubNavTelemetria />
      <EncabezadoVista
        titulo="Disponibilidad de estaciones"
        meta={data ? `al ${data.fecha.split("-").reverse().join("/")}` : undefined}
      >
        Una estación está disponible si no tiene ninguna falla abierta. El estado sale de
        la bitácora, así que cambia solo cuando alguien abre o resuelve una falla.
      </EncabezadoVista>

      {isPending ? <Cargando /> : null}
      {isError ? <Error /> : null}

      {data ? (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Cifra
              titulo="Disponibles"
              valor={data.disponibles}
              pie={`de ${data.total} estaciones`}
              tono={
                data.porcentajeDisponible !== null && serie.data
                  ? data.porcentajeDisponible >= serie.data.metaPorcentaje
                    ? "ok"
                    : "warn"
                  : undefined
              }
            />
            <Cifra
              titulo="Disponibilidad"
              valor={data.porcentajeDisponible}
              sufijo="%"
              pie={serie.data ? `meta ${serie.data.metaPorcentaje}%` : "sobre el total"}
              tono={
                data.porcentajeDisponible !== null && serie.data
                  ? data.porcentajeDisponible >= serie.data.metaPorcentaje
                    ? "ok"
                    : "warn"
                  : undefined
              }
            />
            <Cifra titulo="Transporte" valor={data.porTipoRed.transporte} pie="disponibles" />
            <Cifra titulo="Distribución" valor={data.porTipoRed.distribucion} pie="disponibles" />
          </dl>

          {data.porTipoRed.sinClasificar > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {data.porTipoRed.sinClasificar} estación
              {data.porTipoRed.sinClasificar === 1 ? "" : "es"} disponible
              {data.porTipoRed.sinClasificar === 1 ? "" : "s"} no están clasificadas como
              transporte ni distribución, así que cuentan en el total pero no en el corte.
            </p>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <CuadroPorGrupo titulo="Por región" filas={data.porRegion} />
            <GraficaBarras
              titulo="Por qué están caídas"
              datos={data.porCausa.map((c) => ({
                etiqueta: c.causaFalla.nombre,
                valor: c.cantidad,
              }))}
              total={data.enFalla}
              formatear={(v) => String(v)}
              vacio="No hay ninguna estación en falla."
            />
          </div>

          <div className="mt-6">
            <CuadroPorGrupo titulo="Por área operacional" filas={data.porArea} />
          </div>
        </>
      ) : null}
    </main>
  );
}

function Cifra({
  titulo,
  valor,
  pie,
  sufijo,
  tono,
}: {
  titulo: string;
  valor: number | null;
  pie: string;
  sufijo?: string;
  tono?: "ok" | "warn";
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <dt className="text-xs font-medium text-muted-foreground">{titulo}</dt>
      <dd
        className={`mt-0.5 font-mono text-xl tabular-nums ${
          tono === "ok" ? "text-ok" : tono === "warn" ? "text-warn" : ""
        }`}
      >
        {valor === null ? "—" : sufijo === "%" ? valor.toFixed(1) : valor}
        {sufijo ? <span className="font-sans text-xs text-muted-foreground">{sufijo}</span> : null}
      </dd>
      <p className="mt-1 text-xs text-muted-foreground">{pie}</p>
    </div>
  );
}

function CuadroPorGrupo({ titulo, filas }: { titulo: string; filas: DisponibilidadFilaDto[] }) {
  return (
    <section>
      <h2 className="text-sm font-medium">{titulo}</h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-card text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 text-right font-medium">Disponibles</th>
              <th className="px-3 py-2 text-right font-medium">En falla</th>
              <th className="px-3 py-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-t border-border">
                <td className="px-3 py-1.5">{f.nombre}</td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">{f.total}</td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">{f.disponibles}</td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">{f.enFalla}</td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                  {formatearPorcentaje(f.porcentajeDisponible)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const Cargando = () => (
  <p className="mt-6 text-sm text-muted-foreground">Calculando la disponibilidad…</p>
);

const Error = () => (
  <Alert variant="destructive" className="mt-6">
    <AlertDescription>No se pudo calcular la disponibilidad.</AlertDescription>
  </Alert>
);
