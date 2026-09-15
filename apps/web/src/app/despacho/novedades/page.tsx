"use client";

import type { NovedadOperativaDto } from "@sicog/shared-types";
import { useState } from "react";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { FormularioNovedad } from "@/components/formulario-novedad";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEPARTAMENTO_DESPACHO,
  formatearVolumen,
  puedeEditarDespacho,
  useNovedades,
  useTodasLasFuentes,
  useTodosLosClientes,
  type FiltrosNovedades,
} from "@/lib/despacho";
import { useSesion } from "@/lib/sesion";

const CAMPO =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const fechaHora = (iso: string): string =>
  new Date(iso).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Novedades operativas: la primera pantalla con lista paginada y formulario.
 *
 * Las grillas diarias traen el día entero a propósito porque se digitan de
 * corrido (decisión #60); las novedades crecen sin techo y se consultan, así
 * que van paginadas de a 20 y con filtro de fechas.
 *
 * No hay borrado: el modelo no tiene `activo` y el dominio es auditable
 * (§11.5). Una novedad mal cargada se corrige.
 */
export default function NovedadesPage() {
  const { sesion } = useSesion();
  const puedeEditar = puedeEditarDespacho(sesion);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [origen, setOrigen] = useState("");
  const [page, setPage] = useState(1);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const clientes = useTodosLosClientes();
  const fuentes = useTodasLasFuentes();

  const [clase, id] = origen === "" ? ["", ""] : origen.split(":");
  const filtros: FiltrosNovedades = {
    desde,
    hasta,
    clienteId: clase === "c" ? Number(id) : null,
    fuenteId: clase === "f" ? Number(id) : null,
    page,
  };
  const lista = useNovedades(filtros);
  const paginacion = lista.data?.pagination;

  // Cambiar un filtro vuelve a la primera página: quedarse en la 3 de un
  // filtro nuevo que tiene una sola página muestra vacío sin explicar por qué.
  const filtrar = (aplicar: () => void) => {
    aplicar();
    setPage(1);
  };

  return (
    <main>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Novedades operativas</h1>
        {paginacion ? (
          <p className="text-sm text-muted-foreground">
            {paginacion.totalItems}{" "}
            {paginacion.totalItems === 1 ? "novedad" : "novedades"}
          </p>
        ) : null}
      </div>

      <AvisoSoloConsulta sesion={sesion} departamento={DEPARTAMENTO_DESPACHO} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input
            id="desde"
            type="date"
            value={desde}
            onChange={(e) => filtrar(() => setDesde(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input
            id="hasta"
            type="date"
            value={hasta}
            onChange={(e) => filtrar(() => setHasta(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="origen">Origen</Label>
          {/* Un solo desplegable y no dos: filtrar por cliente *y* fuente a la
              vez no devolvería nada nunca, porque exactamente uno está lleno. */}
          <select
            id="origen"
            value={origen}
            onChange={(e) => filtrar(() => setOrigen(e.target.value))}
            className={CAMPO}
          >
            <option value="">Todos</option>
            <optgroup label="Clientes">
              {(clientes.data ?? []).map((c) => (
                <option key={`c${c.id}`} value={`c:${c.id}`}>
                  {c.nombre}
                </option>
              ))}
            </optgroup>
            <optgroup label="Fuentes">
              {(fuentes.data ?? []).map((f) => (
                <option key={`f${f.id}`} value={`f:${f.id}`}>
                  {f.nombre}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {puedeEditar && !creando ? (
        <div className="mt-4">
          <Button
            onClick={() => {
              setCreando(true);
              setEditando(null);
            }}
          >
            Nueva novedad
          </Button>
        </div>
      ) : null}

      {creando ? (
        <div className="mt-4">
          <FormularioNovedad
            onListo={() => setCreando(false)}
            onCancelar={() => setCreando(false)}
          />
        </div>
      ) : null}

      {lista.isPending ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Cargando…
        </p>
      ) : lista.error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{lista.error.message}</AlertDescription>
        </Alert>
      ) : lista.data.data.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Ninguna novedad con esos filtros.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {lista.data.data.map((n) =>
            editando === n.id ? (
              <li key={n.id}>
                <FormularioNovedad
                  novedad={n}
                  onListo={() => setEditando(null)}
                  onCancelar={() => setEditando(null)}
                />
              </li>
            ) : (
              <li key={n.id}>
                <Tarjeta
                  novedad={n}
                  puedeEditar={puedeEditar}
                  onEditar={() => {
                    setEditando(n.id);
                    setCreando(false);
                  }}
                />
              </li>
            ),
          )}
        </ul>
      )}

      {paginacion && paginacion.totalPages > 1 ? (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginación">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {paginacion.page} de {paginacion.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= paginacion.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </nav>
      ) : null}
    </main>
  );
}

function Tarjeta({
  novedad: n,
  puedeEditar,
  onEditar,
}: {
  novedad: NovedadOperativaDto;
  puedeEditar: boolean;
  onEditar: () => void;
}) {
  const origen = n.cliente?.nombre ?? n.fuente?.nombre ?? "—";
  const clase = n.cliente ? "Cliente" : "Fuente";

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">{n.tipo}</h2>
        <span className="font-mono text-sm tabular-nums">
          {formatearVolumen(n.mmpcedAfectados)} MMPCED
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {clase}: <span className="text-foreground">{origen}</span> · {fechaHora(n.inicio)}{" "}
        {n.fin ? `→ ${fechaHora(n.fin)}` : "→ en curso"}
      </p>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 text-muted-foreground">Causa:</dt>
          <dd>{n.causa}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-muted-foreground">Impacto:</dt>
          <dd>{n.impacto}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Registrada por {n.usuarioNombre}</p>
        {puedeEditar ? (
          <Button variant="outline" onClick={onEditar}>
            Editar
          </Button>
        ) : null}
      </div>
    </article>
  );
}
