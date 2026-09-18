"use client";

import { useState } from "react";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { GraficaBarras } from "@/components/graficas";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  DEPARTAMENTO_MANTENIMIENTO,
  formatearHh,
  formatearPorcentaje,
  MESES,
  useDepartamentoId,
  useParticipacion,
  usePlanVsReal,
} from "@/lib/actividades";

/**
 * Los dos reportes del módulo.
 *
 * **El cumplimiento es nuevo de SICOG**: el workbook no lo calcula en ninguna
 * parte —no hay una sola división en sus hojas de plan— y se agregó a pedido
 * del owner porque el plan anual existe justamente para compararse. Cuando no
 * hay meta con qué comparar, la pantalla dice "sin meta" en vez de inventar un
 * 100% o un infinito.
 *
 * La participación, en cambio, **sí existe** en el Excel, pero ahí está
 * tecleada a mano en una hoja que no está enlazada: acá se calcula.
 */
export default function ReportesActividadesPage() {
  const departamentoId = useDepartamentoId(DEPARTAMENTO_MANTENIMIENTO) ?? undefined;
  const [anio, setAnio] = useState(() => new Date().getFullYear());
  const [mes, setMes] = useState(() => new Date().getMonth() + 1);

  const plan = usePlanVsReal(anio, departamentoId);
  const participacion = useParticipacion(anio, mes, departamentoId);

  const error = plan.error ?? participacion.error;
  const cargando = plan.isPending || participacion.isPending;

  // Sólo las filas con plan o con movimiento: los 24 productos completos, la
  // mayoría en cero, serían ruido sobre el puñado que el mes realmente tuvo.
  const filas = (plan.data?.filas ?? []).filter(
    (f) => f.cantidadMetaAnual > 0 || f.cantidadRealAnual > 0,
  );

  return (
    <main>
      <EncabezadoVista titulo="Reportes">
        Plan contra real por producto y mes, y cuánto pesó cada actividad sobre el
        total del mes.
      </EncabezadoVista>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="anio">Año</Label>
          <Input
            id="anio"
            type="number"
            min={2000}
            max={2100}
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mes">Mes de la participación</Label>
          <Select id="mes" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : cargando ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Cargando los reportes…
        </p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-sm font-medium">Plan contra real — {anio}</h2>
            {filas.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Todavía no hay plan cargado ni actividades registradas en {anio}.
              </p>
            ) : (
              <TablaDesplazable anchoMinimo="min-w-[72rem]">
                <thead>
                  <tr className="bg-card text-left text-xs text-muted-foreground">
                    <th scope="col" className={TH}>Actividad</th>
                    {MESES.map((m) => (
                      <th key={m} scope="col" className={`${TH} text-right`}>
                        {m}
                      </th>
                    ))}
                    <th scope="col" className={`${TH} text-right`}>Año</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.productoServicio.id} className="border-b border-border last:border-0">
                      <th scope="row" className="px-3 py-1.5 text-left font-normal">
                        <span className="block max-w-[22rem] truncate" title={f.productoServicio.nombre}>
                          {f.productoServicio.nombre}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {f.productoServicio.insumo.nombre}
                        </span>
                      </th>
                      {f.meses.map((m) => (
                        <td key={m.mes} className="px-3 py-1.5 text-right">
                          <span className="block font-mono text-xs tabular-nums">
                            {m.cantidadReal}
                            <span className="text-muted-foreground">
                              /{m.cantidadMeta ?? "—"}
                            </span>
                          </span>
                          {/* "sin meta" y no un porcentaje inventado: el
                              workbook no ofrece respuesta para una meta en
                              cero porque esa división no existe. */}
                          <span
                            className={`block text-[0.75rem] ${
                              m.cumplimientoCantidad === null
                                ? "text-muted-foreground"
                                : m.cumplimientoCantidad >= 100
                                  ? "text-ok"
                                  : "text-warn"
                            }`}
                          >
                            {m.cantidadMeta === null && m.cantidadReal === 0
                              ? ""
                              : formatearPorcentaje(m.cumplimientoCantidad)}
                          </span>
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-right font-mono text-xs font-medium tabular-nums">
                        {f.cantidadRealAnual}
                        <span className="text-muted-foreground">/{f.cantidadMetaAnual}</span>
                        <span className="mt-0.5 block font-sans font-normal text-muted-foreground">
                          {formatearHh(f.hhRealAnual)} HH
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TablaDesplazable>
            )}
          </section>

          {participacion.data && participacion.data.filas.length > 0 ? (
            <section className="mt-4 rounded-lg border border-border bg-card p-4">
              <GraficaBarras
                titulo={`Participación de ${MESES[mes - 1]} — horas-hombre`}
                datos={participacion.data.filas
                  .map((f) => ({
                    etiqueta: f.productoServicio.nombre,
                    valor: f.hh,
                    detalle: f.productoServicio.insumo.nombre,
                  }))
                  .sort((a, b) => b.valor - a.valor)}
                total={participacion.data.totalHh}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                {participacion.data.totalCantidad} actividades y{" "}
                {formatearHh(participacion.data.totalHh)} horas-hombre en el mes. Las
                tareas asignadas y sin empezar no cuentan.
              </p>
            </section>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Sin actividades ejecutadas en {MESES[mes - 1]} de {anio}.
            </p>
          )}
        </>
      )}
    </main>
  );
}
