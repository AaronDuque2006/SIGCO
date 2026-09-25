"use client";

import { useState } from "react";
import type { EstacionDetalleDto, EstacionDto } from "@sicog/shared-types";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import {
  formatearFecha,
  areasDeRegion,
  regionesDeAreas,
  DEPARTAMENTO_MANTENIMIENTO,
  formatearDiasCaida,
  useActualizarEstacion,
  useAreas,
  useCausasFalla,
  useCrearEstacion,
  useEstacion,
  useEstaciones,
  useReemplazarInstrumentos,
  useTiposInstrumento,
  type FiltrosEstaciones,
  type Instrumentos,
} from "@/lib/mantenimiento";
import { useSesion } from "@/lib/sesion";
import { SubNavTelemetria } from "./sub-nav";
import { hoy } from "@/lib/fechas";

/** Catálogo cerrado real (§15.1): el ERD lo declara `string`, no enum, pero la
 *  lista de valores es fija — mismo criterio que `packages/shared-validators`. */
const TIPOS_ENLACE = ["IP PDVSA", "SATELITAL", "SERIAL PDVSA"] as const;

/**
 * El inventario: las estaciones T&D con su nodo, su enlace y su estado.
 *
 * El estado no es una columna del inventario sino el resultado de la bitácora,
 * así que la fila dice también desde cuándo está caída y por qué. En el archivo
 * real esas tres cosas viven en tres hojas distintas.
 */
export function Estaciones() {
  const { sesion } = useSesion();
  // Mismo criterio que la bitácora de fallas: es la puerta del departamento,
  // no la de Supervisor+ que exige el backend para escribir en el inventario
  // (§15.2) — esa la resuelve el 403, la UI sólo evita ofrecer un control que
  // sabe que va a rebotar para casi todo el mundo del departamento.
  const puedeEditar = sesion?.departamentosQueEdita.includes(DEPARTAMENTO_MANTENIMIENTO) === true;

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

      <AvisoSoloConsulta sesion={sesion} departamento={DEPARTAMENTO_MANTENIMIENTO} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
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

        {/* Mismo par que en la bitácora de fallas: la región acota las áreas,
            y al cambiarla se suelta el área elegida si no es suya. */}
        <div className="space-y-1.5">
          <Label htmlFor="region">Región</Label>
          <Select
            id="region"
            value={filtros.regionId ?? ""}
            onChange={(e) => {
              const regionId = e.target.value ? Number(e.target.value) : undefined;
              const areaSigue = areasDeRegion(areas.data ?? [], regionId).some((a) => a.id === filtros.areaId);
              cambiar({ regionId, areaId: areaSigue ? filtros.areaId : undefined });
            }}
          >
            <option value="">Todas</option>
            {regionesDeAreas(areas.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="area">Área</Label>
          <Select
            id="area"
            value={filtros.areaId ?? ""}
            onChange={(e) => cambiar({ areaId: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Todas</option>
            {areasDeRegion(areas.data ?? [], filtros.regionId).map((a) => (
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

      {puedeEditar ? <FormularioNuevaEstacion /> : null}

      {detalle !== null ? (
        <PanelDetalle id={detalle} puedeEditar={puedeEditar} onCerrar={() => setDetalle(null)} />
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

function PanelDetalle({
  id,
  puedeEditar,
  onCerrar,
}: {
  id: number;
  puedeEditar: boolean;
  onCerrar: () => void;
}) {
  const { data, isPending } = useEstacion(id);
  const [editando, setEditando] = useState(false);

  return (
    <section
      aria-label="Detalle de la estación"
      className="mt-4 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-medium">
          {isPending ? "Cargando…" : `${data?.nodo} · ${data?.nombre}`}
        </h2>
        <div className="flex gap-2">
          {/* El nodo no se edita acá: es la clave con la que el área nombra la
              estación en sus reportes (mismo criterio del schema), y el
              formulario de edición no lo ofrece. */}
          {puedeEditar && data && !editando ? (
            <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
              Editar
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      </div>

      {data && editando ? (
        <FormularioEditarEstacion
          estacion={data}
          onListo={() => setEditando(false)}
          onCancelar={() => setEditando(false)}
        />
      ) : data ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.area.nombre} · {data.region.nombre} · {data.tipoEnlaceCom} ·{" "}
            {data.totalInstrumentos} instrumentos
          </p>
          {data.fallaAbierta ? (
            <p className="mt-2 text-sm text-warn">
              En falla desde {formatearFecha(data.fallaAbierta.desde)} —{" "}
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

/** Nombre, área, enlace y red — los cuatro campos de `updateEstacionSchema` —
 *  más el inventario de instrumentos. Manda sólo lo que cambió, mismo criterio
 *  que la edición de usuarios. */
function FormularioEditarEstacion({
  estacion,
  onListo,
  onCancelar,
}: {
  estacion: EstacionDetalleDto;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(estacion.nombre);
  const [areaId, setAreaId] = useState(String(estacion.area.id));
  const [tipoEnlaceCom, setTipoEnlaceCom] = useState(estacion.tipoEnlaceCom);
  const [tipoRed, setTipoRed] = useState<"" | "TRANSPORTE" | "DISTRIBUCION">(
    estacion.tipoRed ?? "",
  );

  const inicial = desdeInstrumentos(estacion.instrumentos);
  const [cantidades, setCantidades] = useState<Cantidades>(inicial);

  const areas = useAreas();
  const actualizar = useActualizarEstacion(estacion.id);
  const reemplazar = useReemplazarInstrumentos(estacion.id);
  const guardando = actualizar.isPending || reemplazar.isPending;
  const error = actualizar.error ?? reemplazar.error;

  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const cambios: Parameters<typeof actualizar.mutate>[0] = {};
        if (nombre.trim() !== estacion.nombre) cambios.nombre = nombre.trim();
        if (Number(areaId) !== estacion.area.id) cambios.areaId = Number(areaId);
        if (tipoEnlaceCom !== estacion.tipoEnlaceCom) cambios.tipoEnlaceCom = tipoEnlaceCom;
        const redElegida = tipoRed === "" ? null : tipoRed;
        if (redElegida !== estacion.tipoRed) cambios.tipoRed = redElegida;
        const instrumentos = aInstrumentos(cantidades);
        const cambiaronInstrumentos =
          JSON.stringify(instrumentos) !== JSON.stringify(aInstrumentos(inicial));
        // Son dos rutas (PATCH de la estación y PUT del inventario, §15.3):
        // se manda sólo la que cambió, y el inventario después, para que un
        // error en él no deje a medias el cambio de datos ya confirmado.
        void (async () => {
          try {
            if (Object.keys(cambios).length > 0) await actualizar.mutateAsync(cambios);
            if (cambiaronInstrumentos) await reemplazar.mutateAsync(instrumentos);
            onListo();
          } catch {
            // El error ya lo muestra el formulario.
          }
        })();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="editar-nombre">Nombre</Label>
          <Input id="editar-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editar-area">Área</Label>
          <Select id="editar-area" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            {(areas.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} — {a.region.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editar-enlace">Tipo de enlace</Label>
          <Select
            id="editar-enlace"
            value={tipoEnlaceCom}
            onChange={(e) => setTipoEnlaceCom(e.target.value as typeof tipoEnlaceCom)}
          >
            {TIPOS_ENLACE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="editar-red">Tipo de red</Label>
          <Select
            id="editar-red"
            value={tipoRed}
            onChange={(e) => setTipoRed(e.target.value as typeof tipoRed)}
          >
            <option value="">Sin clasificar</option>
            <option value="TRANSPORTE">Transporte</option>
            <option value="DISTRIBUCION">Distribución</option>
          </Select>
        </div>
      </div>

      <CamposInstrumentos prefijo="editar" cantidades={cantidades} onCambiar={setCantidades} />

      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error instanceof ApiError ? error.message : "No se pudo guardar el cambio."}
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <Button
          type="submit"
          disabled={nombre.trim() === "" || !cantidadesValidas(cantidades) || guardando}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/**
 * Alta de una estación nueva. Mismo patrón que `FormularioAbrir` en
 * `fallas.tsx`: un botón que se convierte en un formulario, y se repliega al
 * cancelar o al guardar con éxito.
 */
function FormularioNuevaEstacion() {
  const [abierto, setAbierto] = useState(false);
  const [nodo, setNodo] = useState("");
  const [nombre, setNombre] = useState("");
  const [areaId, setAreaId] = useState("");
  const [tipoEnlaceCom, setTipoEnlaceCom] = useState<(typeof TIPOS_ENLACE)[number]>(
    TIPOS_ENLACE[0],
  );
  const [tipoRed, setTipoRed] = useState<"" | "TRANSPORTE" | "DISTRIBUCION">("");
  const [cantidades, setCantidades] = useState<Cantidades>({});

  const areas = useAreas();
  const crear = useCrearEstacion();

  const limpiar = () => {
    setNodo("");
    setNombre("");
    setAreaId("");
    setTipoEnlaceCom(TIPOS_ENLACE[0]);
    setTipoRed("");
    setCantidades({});
  };

  if (!abierto) {
    return (
      <div className="mt-4">
        <Button onClick={() => setAbierto(true)}>Nueva estación</Button>
      </div>
    );
  }

  return (
    <form
      className="mt-4 rounded-lg border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (areaId === "") return;
        crear.mutate(
          {
            nodo: nodo.trim(),
            nombre: nombre.trim(),
            areaId: Number(areaId),
            tipoEnlaceCom,
            tipoRed: tipoRed === "" ? null : tipoRed,
            instrumentos: aInstrumentos(cantidades),
          },
          {
            onSuccess: () => {
              limpiar();
              setAbierto(false);
            },
          },
        );
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-medium">Nueva estación</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            limpiar();
            setAbierto(false);
          }}
        >
          Cancelar
        </Button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="nueva-nodo">Nodo</Label>
          <Input
            id="nueva-nodo"
            placeholder="Ej. CRR"
            maxLength={20}
            value={nodo}
            onChange={(e) => setNodo(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nueva-nombre">Nombre</Label>
          <Input id="nueva-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nueva-area">Área</Label>
          <Select id="nueva-area" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="" disabled>
              {areas.isPending ? "Cargando…" : "Elegir"}
            </option>
            {(areas.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} — {a.region.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nueva-enlace">Tipo de enlace</Label>
          <Select
            id="nueva-enlace"
            value={tipoEnlaceCom}
            onChange={(e) => setTipoEnlaceCom(e.target.value as typeof tipoEnlaceCom)}
          >
            {TIPOS_ENLACE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nueva-red">Tipo de red</Label>
          <Select
            id="nueva-red"
            value={tipoRed}
            onChange={(e) => setTipoRed(e.target.value as typeof tipoRed)}
          >
            <option value="">Sin clasificar</option>
            <option value="TRANSPORTE">Transporte</option>
            <option value="DISTRIBUCION">Distribución</option>
          </Select>
        </div>
      </div>

      <CamposInstrumentos prefijo="nueva" cantidades={cantidades} onCambiar={setCantidades} />

      {crear.error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {crear.error instanceof ApiError ? crear.error.message : "No se pudo crear la estación."}
        </p>
      ) : null}

      <Button
        type="submit"
        className="mt-3"
        disabled={
          nodo.trim() === "" ||
          nombre.trim() === "" ||
          areaId === "" ||
          !cantidadesValidas(cantidades) ||
          crear.isPending
        }
      >
        {crear.isPending ? "Creando…" : "Crear"}
      </Button>
    </form>
  );
}

// ── Inventario de instrumentos ──────────────────────────────────────────────

/** Lo tecleado por tipo de instrumento, como texto: un campo vacío es 0. */
type Cantidades = Record<number, string>;

const MAX_CANTIDAD = 999;

const cantidadValida = (v: string): boolean =>
  v.trim() === "" || (/^\d+$/.test(v.trim()) && Number(v) <= MAX_CANTIDAD);

const cantidadesValidas = (c: Cantidades): boolean => Object.values(c).every(cantidadValida);

/** Sólo los tipos con cantidad: el inventario real no guarda ceros. */
const aInstrumentos = (c: Cantidades): Instrumentos =>
  Object.entries(c)
    .map(([id, v]) => ({ tipoInstrumentoId: Number(id), cantidad: Number(v.trim() || 0) }))
    .filter((i) => i.cantidad > 0)
    .sort((a, b) => a.tipoInstrumentoId - b.tipoInstrumentoId);

const desdeInstrumentos = (
  lista: { tipoInstrumento: { id: number }; cantidad: number }[],
): Cantidades => Object.fromEntries(lista.map((i) => [i.tipoInstrumento.id, String(i.cantidad)]));

/**
 * Una cantidad por cada uno de los 16 tipos, en el orden de las columnas del
 * `INVENTARIO ESTACIONES.xls` — que es como el área tiene la fila en la cabeza
 * cuando la carga. Los vacíos cuentan como cero.
 */
function CamposInstrumentos({
  prefijo,
  cantidades,
  onCambiar,
}: {
  prefijo: string;
  cantidades: Cantidades;
  onCambiar: (c: Cantidades) => void;
}) {
  const tipos = useTiposInstrumento();
  const total = aInstrumentos(cantidades).reduce((a, i) => a + i.cantidad, 0);

  return (
    <fieldset className="mt-4">
      {/* El `legend` tiene que ser hijo directo del `fieldset` para nombrar
          el grupo; el total va a la derecha dentro de él. */}
      <legend className="flex w-full flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Inventario de instrumentos</span>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{total}</span> en total
        </span>
      </legend>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Cantidad por tipo, como en el inventario. Los que no tenga, déjelos en blanco.
      </p>
      {tipos.isError ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          No se pudieron cargar los tipos de instrumento.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(tipos.data ?? []).map((t) => {
            const valor = cantidades[t.id] ?? "";
            const id = `${prefijo}-instrumento-${t.id}`;
            return (
              <div key={t.id} className="space-y-1.5">
                <Label htmlFor={id}>{t.nombre}</Label>
                <Input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_CANTIDAD}
                  step={1}
                  placeholder="0"
                  className="font-mono tabular-nums"
                  aria-invalid={!cantidadValida(valor)}
                  value={valor}
                  onChange={(e) => onCambiar({ ...cantidades, [t.id]: e.target.value })}
                />
              </div>
            );
          })}
        </div>
      )}
      {!cantidadesValidas(cantidades) ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          Las cantidades van en números enteros, de 0 a {MAX_CANTIDAD}.
        </p>
      ) : null}
    </fieldset>
  );
}
