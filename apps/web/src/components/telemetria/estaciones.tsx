"use client";

import { useState } from "react";
import type { EstacionDto } from "@sicog/shared-types";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  formatearDiasCaida,
  useAreas,
  useCausasFalla,
  useEstacion,
  useEstaciones,
  type FiltrosEstaciones,
} from "@/lib/mantenimiento";
import { SubNavTelemetria } from "./sub-nav";

const hoy = (): string => new Date().toISOString().slice(0, 10);

/**
 * El inventario: las estaciones T&D con su nodo, su enlace y su estado.
 *
 * El estado no es una columna del inventario sino el resultado de la bitácora,
 * así que la fila dice también desde cuándo está caída y por qué. En el archivo
 * real esas tres cosas viven en tres hojas distintas.
 */
export function Estaciones() {
  const [filtros, setFiltros] = useState<FiltrosEstaciones>({ page: 1 });
  const [detalle, setDetalle] = useState<number | null>(null);

  const { data, isPending, isError } = useEstaciones(filtros);
  const areas = useAreas();
  const causas = useCausasFalla();

  const cambiar = (parcial: Partial<FiltrosEstaciones>) =>
    setFiltros((f) => ({ ...f, ...parcial, page: 1 }));

  const total = data?.pagination.totalItems ?? 0;
  const rangoActivo = Boolean(filtros.desde || filtros.hasta);

  return (
    <main>
      <SubNavTelemetria />
      <EncabezadoVista
        titulo="Estaciones"
        meta={data ? `${total} ${total === 1 ? "estación" : "estaciones"}` : undefined}
      >
        El inventario de estaciones de transporte y distribución, con el estado que
        resulta de la bitácora de fallas.
      </EncabezadoVista>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <div className="space-y-1.5">
          <Label htmlFor="buscar">Buscar</Label>
          <Input
            id="buscar"
            type="search"
            placeholder="Nodo o nombre"
            value={filtros.q ?? ""}
            onChange={(e) => cambiar({ q: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="area">Área</Label>
          <Select
            id="area"
            value={filtros.areaId ?? ""}
            onChange={(e) => cambiar({ areaId: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Todas</option>
            {(areas.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} — {a.region.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estado">Estado</Label>
          <Select
            id="estado"
            value={filtros.estado ?? ""}
            onChange={(e) =>
              cambiar({
                estado: (e.target.value || undefined) as FiltrosEstaciones["estado"],
                causaFallaId: undefined,
              })
            }
          >
            <option value="">Todos</option>
            <option value="OPERATIVA">Operativas</option>
            <option value="EN_FALLA">En falla</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tipo-red">Tipo de red</Label>
          <Select
            id="tipo-red"
            value={filtros.tipoRed ?? ""}
            onChange={(e) =>
              cambiar({ tipoRed: (e.target.value || undefined) as FiltrosEstaciones["tipoRed"] })
            }
          >
            <option value="">Todos</option>
            <option value="TRANSPORTE">Transporte</option>
            <option value="DISTRIBUCION">Distribución</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="causa">Causa</Label>
          <Select
            id="causa"
            value={filtros.causaFallaId ?? ""}
            onChange={(e) => {
              const causaFallaId = e.target.value ? Number(e.target.value) : undefined;
              // Filtrar por causa sin estar en falla no devuelve nada: elegir
              // una causa implica el estado.
              cambiar({ causaFallaId, estado: causaFallaId ? "EN_FALLA" : filtros.estado });
            }}
          >
            <option value="">Todas</option>
            {(causas.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desde">En falla desde</Label>
          <Input
            id="desde"
            type="date"
            max={filtros.hasta ?? hoy()}
            value={filtros.desde ?? ""}
            onChange={(e) => cambiar({ desde: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input
            id="hasta"
            type="date"
            min={filtros.desde}
            max={hoy()}
            value={filtros.hasta ?? ""}
            onChange={(e) => cambiar({ hasta: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* El rango filtra por solapamiento, no por cuándo empezó la falla: una
          estación caída desde hace meses o años y que sigue (o siguió) así
          durante el período pedido entra, igual que en la bitácora. Una
          estación operativa no tiene fecha que comparar, así que usar el rango
          deja fuera a las que están bien: conviene decirlo antes de que el
          conteo sorprenda. */}
      {rangoActivo ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Mostrando sólo estaciones <strong className="font-medium">en falla</strong> en algún
          momento de ese período, aunque hayan caído antes o ya se hayan resuelto.{" "}
          <button
            type="button"
            onClick={() => cambiar({ desde: undefined, hasta: undefined })}
            className="underline underline-offset-2 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Quitar el rango
          </button>
        </p>
      ) : null}

      {isError ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>No se pudo cargar el inventario.</AlertDescription>
        </Alert>
      ) : null}

      <TablaDesplazable anchoMinimo="min-w-[52rem]">
        <thead>
          <tr className="bg-card text-left text-xs text-muted-foreground">
            <th scope="col" className={TH}>Nodo</th>
            <th scope="col" className={TH}>Estación</th>
            <th scope="col" className={TH}>Área</th>
            <th scope="col" className={TH}>Red</th>
            <th scope="col" className={TH}>Enlace</th>
            <th scope="col" className={TH}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((e) => (
            <Fila key={e.id} estacion={e} onAbrir={() => setDetalle(e.id)} />
          ))}
          {isPending ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                Cargando…
              </td>
            </tr>
          ) : null}
          {data && data.data.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                Ninguna estación coincide con el filtro.
              </td>
            </tr>
          ) : null}
        </tbody>
      </TablaDesplazable>

      {data && data.pagination.totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {data.pagination.page} de {data.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={data.pagination.page <= 1}
              onClick={() => setFiltros((f) => ({ ...f, page: f.page - 1 }))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => setFiltros((f) => ({ ...f, page: f.page + 1 }))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}

      {detalle !== null ? <PanelDetalle id={detalle} onCerrar={() => setDetalle(null)} /> : null}
    </main>
  );
}

function Fila({ estacion, onAbrir }: { estacion: EstacionDto; onAbrir: () => void }) {
  return (
    <tr className="border-t border-border hover:bg-card">
      <td className="px-3 py-1.5">
        {/* Misma receta que el botón de historial de Despacho, que es el
            control diminuto embebido en una fila que nombra DESIGN.md. */}
        <button
          type="button"
          onClick={onAbrir}
          aria-label={`Ver el detalle de ${estacion.nombre}`}
          className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 font-mono text-xs leading-none text-muted-foreground tabular-nums hover:border-ring hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {estacion.nodo}
        </button>
      </td>
      <td className="px-3 py-1.5">{estacion.nombre}</td>
      <td className="px-3 py-1.5 text-muted-foreground">
        {estacion.area.nombre}
        <span className="text-xs"> · {estacion.region.nombre}</span>
      </td>
      <td className="px-3 py-1.5 text-muted-foreground">
        {estacion.tipoRed === "TRANSPORTE"
          ? "Transporte"
          : estacion.tipoRed === "DISTRIBUCION"
            ? "Distribución"
            : "—"}
      </td>
      <td className="px-3 py-1.5 text-muted-foreground">{estacion.tipoEnlaceCom}</td>
      <td className="px-3 py-1.5">
        {estacion.fallaAbierta ? (
          <span className="text-warn">
            {estacion.fallaAbierta.causaFalla.nombre}
            <span className="block text-xs text-muted-foreground">
              hace {formatearDiasCaida(estacion.fallaAbierta.diasCaida)}
            </span>
          </span>
        ) : (
          <span className="text-ok">Operativa</span>
        )}
      </td>
    </tr>
  );
}

function PanelDetalle({ id, onCerrar }: { id: number; onCerrar: () => void }) {
  const { data, isPending } = useEstacion(id);

  return (
    <section
      aria-label="Detalle de la estación"
      className="mt-4 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-medium">
          {isPending ? "Cargando…" : `${data?.nodo} · ${data?.nombre}`}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>

      {data ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.area.nombre} · {data.region.nombre} · {data.tipoEnlaceCom} ·{" "}
            {data.totalInstrumentos} instrumentos
          </p>
          {data.fallaAbierta ? (
            <p className="mt-2 text-sm text-warn">
              En falla desde {data.fallaAbierta.desde.split("-").reverse().join("/")} —{" "}
              {data.fallaAbierta.causaFalla.nombre}.
              {data.fallaAbierta.observacion ? ` ${data.fallaAbierta.observacion}` : ""}
            </p>
          ) : null}

          {data.instrumentos.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.instrumentos.map((i) => (
                <li
                  key={i.tipoInstrumento.id}
                  className="rounded-lg border border-border px-2 py-1 text-xs"
                >
                  {i.tipoInstrumento.nombre}
                  <span className="ml-1.5 font-mono tabular-nums text-muted-foreground">
                    {i.cantidad}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Esta estación no tiene instrumentos cargados.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
