"use client";

import type { TipoCorte } from "@sicog/shared-types";
import { useState } from "react";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { CeldaVolumen } from "@/components/celda-volumen";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEPARTAMENTO_DESPACHO,
  fechaHora,
  formatearVolumen,
  hoy,
  puedeEditarDespacho,
  useGuardarQuema,
  useHistorialQuema,
  useQuemaDelDia,
} from "@/lib/despacho";
import { useSesion } from "@/lib/sesion";
import { EncabezadoVista } from "@/components/encabezado-vista";

/**
 * La quema nacional es **una sola cifra por día y por corte**, no una grilla.
 *
 * Por eso esta pantalla no tiene tabla ni filtros de sistema: lo único que se
 * elige es el día y el corte. El historial de correcciones sí se muestra —en
 * las grillas queda escondido porque serían cien historiales, acá cabe al lado
 * de la cifra y es justamente lo que se quiere ver cuando el número cambió
 * tres veces en la mañana.
 */
export default function QuemaNacionalPage() {
  const { sesion } = useSesion();
  const [fecha, setFecha] = useState(hoy);
  const [tipoCorte, setTipoCorte] = useState<TipoCorte>("PUNTUAL");

  const dia = useQuemaDelDia(fecha, tipoCorte);
  const guardar = useGuardarQuema(fecha, tipoCorte);
  const quema = dia.data?.quema ?? null;
  const historial = useHistorialQuema(quema?.id ?? null);

  const puedeEditar = puedeEditarDespacho(sesion);
  // Igual que en Balance Diario: el `CIERRE_PROMEDIO` lo escribe únicamente el
  // job de medianoche (decisión #42), así que una fila que no existe no se
  // puede crear desde acá; una que ya existe sí se corrige.
  const editable = puedeEditar && (tipoCorte === "PUNTUAL" || quema !== null);

  return (
    <main>
      <EncabezadoVista titulo="Quema nacional">
        El total quemado en el día. No entra ni en el recibido ni en el transportado
        del Balance Nación: se informa aparte.
      </EncabezadoVista>

      <AvisoSoloConsulta sesion={sesion} departamento={DEPARTAMENTO_DESPACHO} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="corte">Corte</Label>
          <select
            id="corte"
            value={tipoCorte}
            onChange={(e) => setTipoCorte(e.target.value as TipoCorte)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="PUNTUAL">Puntual</option>
            <option value="CIERRE_PROMEDIO">Cierre promedio</option>
          </select>
        </div>
      </div>

      {tipoCorte === "CIERRE_PROMEDIO" ? (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          El cierre promedio lo calcula el job de medianoche con todos los valores que
          tuvo el puntual ese día. Acá no se puede crear; si ya existe, sí se corrige.
        </p>
      ) : null}

      {dia.isPending ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Cargando…
        </p>
      ) : dia.error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{dia.error.message}</AlertDescription>
        </Alert>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-xs font-medium text-muted-foreground">MMPCED quemados</h2>
            <div className="mt-2 flex items-baseline gap-2">
              {editable ? (
                <CeldaVolumen
                  valor={quema?.mmpced ?? null}
                  etiqueta={`Quema nacional del ${fecha} en MMPCED`}
                  editable
                  guardando={guardar.isPending}
                  error={guardar.error?.message ?? null}
                  onGuardar={(mmpced) => guardar.mutate({ quemaId: quema?.id ?? null, mmpced })}
                />
              ) : (
                <span className="font-mono text-2xl tabular-nums">
                  {quema === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    formatearVolumen(quema.mmpced)
                  )}
                </span>
              )}
            </div>
            {quema === null && tipoCorte === "CIERRE_PROMEDIO" ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Todavía no se cerró este día.
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-xs font-medium text-muted-foreground">
              Correcciones del día
            </h2>
            {quema === null ? (
              <p className="mt-2 text-sm text-muted-foreground">Sin valor cargado.</p>
            ) : historial.data && historial.data.data.length > 0 ? (
              <ol className="mt-2 space-y-1 text-sm">
                {historial.data.data.map((h) => (
                  <li key={h.id} className="flex items-baseline justify-between gap-3">
                    <span className="font-mono tabular-nums">
                      {formatearVolumen(h.valorAnterior)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fechaHora(h.modificadoEn)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                El valor no se corrigió desde que se cargó.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
