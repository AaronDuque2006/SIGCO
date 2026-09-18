"use client";

import type { CeldaMetaInput } from "@sicog/shared-validators";
import { useState } from "react";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { SubNavActividades } from "@/components/actividades/sub-nav";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    MESES,
  esSupervisorOSuperior,
  puedeEditarDepartamento,
  useDepartamentoId,
  useMatrizMetas,
  useReemplazarMetas,
} from "@/lib/actividades";
import { useSesion } from "@/lib/sesion";

/**
 * El plan anual de horas-hombre (decisión #30: lo carga el Supervisor de cada
 * departamento, una vez al año).
 *
 * **Se edita entero y se guarda de una**, y no celda por celda como Balance
 * Diario. El motivo no es comodidad: el backend reemplaza el año en una
 * transacción porque un plan a medias dejaría al reporte de cumplimiento
 * comparando contra algo que nadie terminó de escribir. Guardar por celda haría
 * exactamente eso.
 *
 * Una celda vacía **no es cero**: es un mes sin plan, y el reporte los
 * distingue para no inventar un incumplimiento donde nunca hubo meta.
 */
export function PlanAnual({ departamento, base }: { departamento: string; base: string }) {
  const { sesion } = useSesion();
  const departamentoId = useDepartamentoId(departamento) ?? undefined;
  const [anio, setAnio] = useState(() => new Date().getFullYear());

  const matriz = useMatrizMetas(anio, departamentoId);
  const guardar = useReemplazarMetas(anio);
  // **Supervisor o superior**, no "cualquiera menos el Analista" (decisión
  // #30: el plan lo carga el Supervisor de cada departamento, una vez al año).
  // La diferencia no es cosmética: un Ingeniero habría llenado los doce meses
  // y recién al guardar se habría comido el 403 del backend.
  const puedeEditar =
    puedeEditarDepartamento(sesion, departamento) && esSupervisorOSuperior(sesion);

  // Borrador local: la matriz se edita entera antes de enviarla.
  const [borrador, setBorrador] = useState<Record<string, string>>({});
  const [anioBorrador, setAnioBorrador] = useState(anio);
  if (anio !== anioBorrador) {
    setAnioBorrador(anio);
    setBorrador({});
  }

  const clave = (productoId: number, mes: number) => `${productoId}|${mes}`;

  const valor = (productoId: number, mes: number): string => {
    const local = borrador[clave(productoId, mes)];
    if (local !== undefined) return local;
    const fila = matriz.data?.filas.find((f) => f.productoServicio.id === productoId);
    const celda = fila?.meses.find((m) => m.mes === mes);
    return celda === undefined ? "" : String(celda.cantidadMeta);
  };

  const hayCambios = Object.keys(borrador).length > 0;

  const enviar = () => {
    if (departamentoId === undefined || !matriz.data) return;
    const celdas: CeldaMetaInput[] = [];
    for (const fila of matriz.data.filas) {
      for (let mes = 1; mes <= 12; mes++) {
        const texto = valor(fila.productoServicio.id, mes).trim();
        if (texto === "") continue;
        const cantidad = Number(texto.replace(",", "."));
        if (!Number.isFinite(cantidad) || cantidad < 0) continue;
        const previa = fila.meses.find((m) => m.mes === mes);
        celdas.push({
          productoServicioId: fila.productoServicio.id,
          mes,
          cantidadMeta: Math.round(cantidad),
          hhMeta: previa?.hhMeta ?? 0,
        });
      }
    }
    if (celdas.length === 0) return;
    guardar.mutate({ departamentoId, celdas }, { onSuccess: () => setBorrador({}) });
  };

  return (
    <main>
      <SubNavActividades base={base} />
      <EncabezadoVista titulo="Plan anual">
        Metas por producto y mes. Una celda vacía es un mes <strong>sin plan</strong>,
        que no es lo mismo que una meta en cero.
      </EncabezadoVista>

      <AvisoSoloConsulta sesion={sesion} departamento={departamento} />

      {/* Cien celdas apagadas sin explicación son indistinguibles de una
          pantalla rota: fue exactamente lo que pasó con la grilla de Despacho
          y por eso existe `AvisoSoloConsulta`. Acá el motivo es otro —el
          departamento es el suyo, lo que falta es el rango— así que se dice
          aparte. */}
      {puedeEditarDepartamento(sesion, departamento) && !puedeEditar ? (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          El plan anual lo carga el Supervisor del departamento hacia arriba. Puede
          consultarlo, pero no modificarlo.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="anio-plan">Año</Label>
          <Input
            id="anio-plan"
            type="number"
            min={2000}
            max={2100}
            className="w-32"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          />
        </div>
        {puedeEditar ? (
          <>
            <Button onClick={enviar} disabled={!hayCambios || guardar.isPending}>
              {guardar.isPending ? "Guardando…" : "Guardar el año"}
            </Button>
            {hayCambios ? (
              <Button variant="outline" onClick={() => setBorrador({})}>
                Descartar
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {puedeEditar && hayCambios ? (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Al guardar se reemplaza <strong>el año entero</strong>: lo que quede vacío
          deja de tener plan. Es a propósito — un plan a medias haría que el reporte
          de cumplimiento comparara contra algo sin terminar.
        </p>
      ) : null}

      {guardar.error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{guardar.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {matriz.error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{matriz.error.message}</AlertDescription>
        </Alert>
      ) : matriz.isPending ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Cargando el plan…
        </p>
      ) : (
        <TablaDesplazable anchoMinimo="min-w-[68rem]">
          <thead>
            <tr className="bg-card text-left text-xs text-muted-foreground">
              <th scope="col" className={TH}>Actividad</th>
              {MESES.map((m) => (
                <th key={m} scope="col" className={`${TH} text-right`}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matriz.data.filas.map((fila) => (
              <tr key={fila.productoServicio.id} className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-1.5 text-left font-normal">
                  <span
                    className="block max-w-[24rem] truncate"
                    title={fila.productoServicio.nombre}
                  >
                    {fila.productoServicio.nombre}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {fila.productoServicio.insumo.nombre}
                  </span>
                </th>
                {MESES.map((_, i) => {
                  const mes = i + 1;
                  const v = valor(fila.productoServicio.id, mes);
                  return (
                    <td key={mes} className="px-1 py-1 text-right">
                      {puedeEditar ? (
                        <input
                          inputMode="numeric"
                          aria-label={`Meta de ${fila.productoServicio.nombre} en ${MESES[i]}`}
                          value={v}
                          onChange={(e) =>
                            setBorrador((b) => ({
                              ...b,
                              [clave(fila.productoServicio.id, mes)]: e.target.value,
                            }))
                          }
                          className="w-14 rounded-md border border-input bg-transparent px-1.5 py-0.5 text-right font-mono text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      ) : (
                        <span className="font-mono text-sm tabular-nums">
                          {v === "" ? <span className="text-muted-foreground">—</span> : v}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </TablaDesplazable>
      )}
    </main>
  );
}
