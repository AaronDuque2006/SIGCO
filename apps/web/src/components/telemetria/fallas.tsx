"use client";

import { useMemo, useState } from "react";
import type { EstacionDto, FallaEstacionDto } from "@sicog/shared-types";
import { ApiError } from "@/lib/api";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useSesion } from "@/lib/sesion";
import { fechaHora } from "@/lib/despacho";
import { BotonCorrecciones, useDesplegable } from "@/components/historial-correcciones";
import {
  DEPARTAMENTO_MANTENIMIENTO,
  formatearDiasCaida,
  formatearFecha,
  useAbrirFalla,
  useAreas,
  useCausasFalla,
  useEstacionesOperativas,
  useFallas,
  useHistorialFalla,
  useResolverFalla,
  todasLasFallas,
  areasDeRegion,
  regionesDeAreas,
  type FiltrosFallas,
} from "@/lib/mantenimiento";
import { exportarFallasPorRegion } from "./exportar-fallas";
import { SubNavTelemetria } from "./sub-nav";
import { IconFileTypeXls } from "@tabler/icons-react";
import { hoy } from "@/lib/fechas";

/** Lo que se teclea y lo que el `<datalist>` ofrece tienen que ser el mismo
 *  texto: es la única forma de volver del valor escrito a la estación. */
const etiquetaEstacion = (e: EstacionDto): string => `${e.nodo} — ${e.nombre}`;

/**
 * La bitácora: una fila por interrupción, con la fecha en que empezó.
 *
 * Es el registro que gobierna todo lo demás — el estado de cada estación y el
 * indicador de disponibilidad salen de acá. Por eso no hay borrado: una falla
 * que no va se corrige, y una que terminó se resuelve, que es lo que la
 * devuelve al conteo de disponibles.
 */
export function Fallas() {
  const { sesion } = useSesion();
  const puedeEditar = sesion?.departamentosQueEdita.includes(DEPARTAMENTO_MANTENIMIENTO) === true;

  const [filtros, setFiltros] = useState<FiltrosFallas>({ page: 1, soloAbiertas: true });
  const { data, isPending, isError } = useFallas(filtros);
  const causas = useCausasFalla();
  const areas = useAreas();

  const cambiar = (parcial: Partial<FiltrosFallas>) =>
    setFiltros((f) => ({ ...f, ...parcial, page: 1 }));

  const total = data?.pagination.totalItems ?? 0;

  const regiones = regionesDeAreas(areas.data ?? []);
  const areasDe = (regionId?: number) => areasDeRegion(areas.data ?? [], regionId);

  // Se piden todas las páginas del filtro al tocar el botón, no antes: la
  // grilla sólo trae 50 y la bitácora real pasa de 200.
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState(false);
  const exportar = async () => {
    setExportando(true);
    setErrorExportar(false);
    try {
      exportarFallasPorRegion({
        fallas: await todasLasFallas(filtros),
        areas: areas.data ?? [],
        filtroDescrito: describirFiltro(filtros, areas.data ?? [], causas.data ?? []),
        fecha: hoy(),
      });
    } catch {
      setErrorExportar(true);
    } finally {
      setExportando(false);
    }
  };

  return (
    <main>
      <SubNavTelemetria />
      <EncabezadoVista titulo="Bitácora de fallas" meta={data ? `${total} registradas` : undefined}>
        Una fila por interrupción, con la fecha en que empezó. Una estación tiene a lo sumo
        una falla abierta: hay que resolverla antes de anotar otra.
      </EncabezadoVista>

      <AvisoSoloConsulta sesion={sesion} departamento={DEPARTAMENTO_MANTENIMIENTO} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <div className="space-y-1.5">
          <Label htmlFor="buscar-falla">Estación</Label>
          <Input
            id="buscar-falla"
            type="search"
            placeholder="Nodo o nombre"
            value={filtros.q ?? ""}
            onChange={(e) => cambiar({ q: e.target.value || undefined })}
          />
        </div>

        {/* La región acota las áreas que ofrece el filtro de al lado: un área
            de otra región daría una bitácora vacía sin que se entienda por
            qué. Por eso al cambiarla se suelta el área elegida si no es suya. */}
        <div className="space-y-1.5">
          <Label htmlFor="region-falla">Región</Label>
          <Select
            id="region-falla"
            value={filtros.regionId ?? ""}
            onChange={(e) => {
              const regionId = e.target.value ? Number(e.target.value) : undefined;
              const areaSigue = areasDe(regionId).some((a) => a.id === filtros.areaId);
              cambiar({ regionId, areaId: areaSigue ? filtros.areaId : undefined });
            }}
          >
            <option value="">Todas</option>
            {regiones.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="area-falla">Área</Label>
          <Select
            id="area-falla"
            value={filtros.areaId ?? ""}
            onChange={(e) => cambiar({ areaId: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Todas</option>
            {areasDe(filtros.regionId).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} — {a.region.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="causa-filtro">Causa</Label>
          <Select
            id="causa-filtro"
            value={filtros.causaFallaId ?? ""}
            onChange={(e) =>
              cambiar({ causaFallaId: e.target.value ? Number(e.target.value) : undefined })
            }
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
          <Label htmlFor="red-falla">Tipo de red</Label>
          <Select
            id="red-falla"
            value={filtros.tipoRed ?? ""}
            onChange={(e) =>
              cambiar({ tipoRed: (e.target.value || undefined) as FiltrosFallas["tipoRed"] })
            }
          >
            <option value="">Todos</option>
            <option value="TRANSPORTE">Transporte</option>
            <option value="DISTRIBUCION">Distribución</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desde-falla">Desde</Label>
          <Input
            id="desde-falla"
            type="date"
            max={filtros.hasta ?? hoy()}
            value={filtros.desde ?? ""}
            onChange={(e) => cambiar({ desde: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hasta-falla">Hasta</Label>
          <Input
            id="hasta-falla"
            type="date"
            min={filtros.desde}
            max={hoy()}
            value={filtros.hasta ?? ""}
            onChange={(e) => cambiar({ hasta: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex h-8 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filtros.soloAbiertas ?? false}
            onChange={(e) => cambiar({ soloAbiertas: e.target.checked || undefined })}
            className="size-4 accent-primary"
          />
          Sólo las abiertas
        </label>
        {/* El rango toma las que se solapan con él, no sólo las que empezaron
            adentro: una falla de 2018 que sigue abierta es parte de lo que pasa
            hoy, y esconderla daría un conteo que no es el del área. */}
        {filtros.desde || filtros.hasta ? (
          <p className="text-xs text-muted-foreground">
            Incluye las fallas que siguen abiertas desde antes del rango.{" "}
            <button
              type="button"
              onClick={() => cambiar({ desde: undefined, hasta: undefined })}
              className="underline underline-offset-2 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Quitar el rango
            </button>
          </p>
        ) : null}
      </div>

      {/* Mismo botón y lugar que los exports de Despacho. Sale una hoja por
          región más un resumen (decisión #115); espera al catálogo de áreas
          porque de ahí salen las regiones. */}
      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          disabled={exportando || total === 0 || !areas.data}
          onClick={() => void exportar()}
        >
          <IconFileTypeXls size={16} stroke={1.75} aria-hidden />
          {exportando ? "Exportando…" : "Exportar Excel"}
        </Button>
      </div>

      {errorExportar ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>No se pudo exportar la bitácora. Intente de nuevo.</AlertDescription>
        </Alert>
      ) : null}

      {puedeEditar ? <FormularioAbrir /> : null}

      {isError ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>No se pudo cargar la bitácora.</AlertDescription>
        </Alert>
      ) : null}

      <TablaDesplazable anchoMinimo="min-w-[56rem]">
        <thead>
          <tr className="bg-card text-left text-xs text-muted-foreground">
            <th scope="col" className={TH}>Estación</th>
            <th scope="col" className={TH}>Causa</th>
            <th scope="col" className={TH}>Desde</th>
            <th scope="col" className={TH}>Tiempo</th>
            <th scope="col" className={TH}>Observación</th>
            <th scope="col" className={TH}>Historial</th>
            {puedeEditar ? <th scope="col" className={TH}>Acción</th> : null}
          </tr>
        </thead>
        <tbody>
          {data?.data.map((f) => (
            <FilaFalla key={f.id} falla={f} puedeEditar={puedeEditar} causas={causas.data ?? []} />
          ))}
          {isPending ? (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                Cargando…
              </td>
            </tr>
          ) : null}
          {data && data.data.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                No hay fallas que coincidan con el filtro.
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

/** El filtro de la pantalla en palabras, para el encabezado del Excel. */
function describirFiltro(
  f: FiltrosFallas,
  areas: { id: number; nombre: string; region: { id: number; nombre: string } }[],
  causas: { id: number; nombre: string }[],
): string {
  const partes = [
    f.soloAbiertas ? "sólo abiertas" : "abiertas y resueltas",
    f.q ? `estación "${f.q}"` : null,
    f.regionId
      ? `región ${areas.find((a) => a.region.id === f.regionId)?.region.nombre ?? f.regionId}`
      : null,
    f.areaId ? `área ${areas.find((a) => a.id === f.areaId)?.nombre ?? f.areaId}` : null,
    f.causaFallaId ? `causa ${causas.find((c) => c.id === f.causaFallaId)?.nombre ?? f.causaFallaId}` : null,
    f.tipoRed ? `red de ${f.tipoRed === "TRANSPORTE" ? "transporte" : "distribución"}` : null,
    f.desde || f.hasta
      ? `período ${f.desde ? formatearFecha(f.desde) : "…"} a ${f.hasta ? formatearFecha(f.hasta) : "hoy"}`
      : null,
  ];
  return partes.filter(Boolean).join(" · ");
}

function FilaFalla({
  falla,
  puedeEditar,
  causas,
}: {
  falla: FallaEstacionDto;
  puedeEditar: boolean;
  causas: { id: number; nombre: string }[];
}) {
  const resolver = useResolverFalla();
  const abierta = falla.resueltaEn === null;
  const desplegable = useDesplegable();
  const idPanel = `historial-falla-${falla.id}`;
  const columnas = puedeEditar ? 7 : 6;

  return (
    <>
      <tr className="border-t border-border align-top hover:bg-card">
        <td className="px-3 py-1.5">
          <span className="font-mono text-sm">{falla.estacion.nodo}</span>
          <span className="block text-xs text-muted-foreground">
            {falla.estacion.nombre} · {falla.estacion.area.nombre}
          </span>
        </td>
        <td className="px-3 py-1.5">{falla.causaFalla.nombre}</td>
        <td className="px-3 py-1.5 font-mono text-sm tabular-nums">{formatearFecha(falla.desde)}</td>
        <td className={`px-3 py-1.5 ${abierta ? "text-warn" : "text-muted-foreground"}`}>
          {formatearDiasCaida(falla.diasCaida)}
          {abierta ? null : (
            <span className="block text-xs">
              resuelta {formatearFecha(falla.resueltaEn!)}
              {falla.resueltaPor ? ` por ${falla.resueltaPor.nombre}` : ""}
            </span>
          )}
        </td>
        <td className="max-w-xs px-3 py-1.5 text-xs text-muted-foreground">
          {falla.observacion ?? "—"}
        </td>
        <td className="px-3 py-1.5">
          <BotonCorrecciones
            correcciones={falla.correcciones}
            abierto={desplegable.abierta === falla.id}
            onClick={() => desplegable.alternar(falla.id)}
            etiqueta={`la falla de ${falla.estacion.nodo}`}
            idPanel={idPanel}
          />
        </td>
        {puedeEditar ? (
          <td className="px-3 py-1.5">
            {abierta ? (
              <Button
                variant="outline"
                size="xs"
                disabled={resolver.isPending}
                onClick={() => resolver.mutate({ id: falla.id, resueltaEn: hoy() })}
              >
                {resolver.isPending ? "Resolviendo…" : "Resolver hoy"}
              </Button>
            ) : (
              <span className="text-xs text-ok">Resuelta</span>
            )}
          </td>
        ) : null}
      </tr>
      {desplegable.abierta === falla.id ? (
        <FilaHistorialFalla fallaId={falla.id} idPanel={idPanel} columnas={columnas} causas={causas} />
      ) : null}
    </>
  );
}

/** El recorrido de `causaFalla`/`desde`/`observacion` antes de cada corrección
 *  (§15.5). Mismo patrón visual que `FilaHistorial` de Despacho, adaptado a
 *  tres campos en vez de uno. */
function FilaHistorialFalla({
  fallaId,
  idPanel,
  columnas,
  causas,
}: {
  fallaId: string;
  idPanel: string;
  columnas: number;
  causas: { id: number; nombre: string }[];
}) {
  const historial = useHistorialFalla(fallaId, true);
  const nombreCausa = (id: number) => causas.find((c) => c.id === id)?.nombre ?? `#${id}`;

  return (
    <tr className="border-b border-border bg-muted/40">
      <td colSpan={columnas} className="px-3 py-2" id={idPanel}>
        {historial.isPending ? (
          <p className="text-xs text-muted-foreground" role="status">
            Cargando el historial…
          </p>
        ) : historial.error ? (
          <p className="text-xs text-destructive" role="alert">
            No se pudo cargar el historial.
          </p>
        ) : (
          <ol className="space-y-1 text-xs">
            {historial.data?.data.map((h) => (
              <li key={h.id} className="flex flex-wrap items-baseline gap-x-3 text-muted-foreground">
                <span className="text-foreground">
                  {nombreCausa(h.causaFallaIdAnt)} · desde {formatearFecha(h.desdeAnt)}
                </span>
                {h.observacionAnt ? <span>&ldquo;{h.observacionAnt}&rdquo;</span> : null}
                <span>
                  reemplazado por <span className="text-foreground">{h.usuarioNombre}</span>
                </span>
                <span>{fechaHora(h.modificadoEn)}</span>
              </li>
            ))}
          </ol>
        )}
      </td>
    </tr>
  );
}

/**
 * Abrir una falla: qué estación, por qué y desde cuándo.
 *
 * **Un solo desplegable para elegir la estación, no una búsqueda más un
 * desplegable.** Eran dos controles para una sola decisión, y cuando lo tecleado
 * no coincidía con nada la lista quedaba vacía sin decir por qué: escribir `CCR`
 * en vez de `CRR` daba una pantalla que parecía rota. El `<select>` nativo ya
 * busca escribiendo —es la razón por la que `select.tsx` es nativo a propósito—
 * y además muestra siempre cuántas opciones hay.
 */
function FormularioAbrir() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [causaFallaId, setCausaFallaId] = useState<number | null>(null);
  const [desde, setDesde] = useState(hoy());
  const [observacion, setObservacion] = useState("");

  const causas = useCausasFalla();
  const abrir = useAbrirFalla();
  // Sólo las operativas: una estación en falla ya tiene la suya, y el backend
  // rechaza la segunda con un 409.
  const candidatas = useEstacionesOperativas();
  const cuantas = candidatas.data?.length ?? 0;

  // Se acepta la etiqueta completa, el nodo suelto o el nombre suelto: quien
  // conoce el nodo lo teclea, quien conoce la estación escribe su nombre.
  const elegida = useMemo(() => {
    const t = texto.trim().toUpperCase();
    if (!t) return null;
    const lista = candidatas.data ?? [];
    return (
      lista.find((e) => etiquetaEstacion(e).toUpperCase() === t) ??
      lista.find((e) => e.nodo.toUpperCase() === t) ??
      lista.find((e) => e.nombre.toUpperCase() === t) ??
      null
    );
  }, [texto, candidatas.data]);

  const limpiar = () => {
    setTexto("");
    setCausaFallaId(null);
    setObservacion("");
    setDesde(hoy());
  };

  if (!abierto) {
    return (
      <div className="mt-4">
        <Button onClick={() => setAbierto(true)}>Anotar una falla</Button>
      </div>
    );
  }

  return (
    <form
      className="mt-4 rounded-lg border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (elegida === null || causaFallaId === null) return;
        abrir.mutate(
          { estacionId: elegida.id, causaFallaId, desde, observacion: observacion.trim() || null },
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
        <h2 className="text-sm font-medium">Anotar una falla</h2>
        <Button
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
          <Label htmlFor="estacion-alta">Estación</Label>
          <Input
            id="estacion-alta"
            list="estaciones-operativas"
            autoComplete="off"
            placeholder={
              candidatas.isPending ? "Cargando…" : `Nodo o nombre — ${cuantas} operativas`
            }
            disabled={candidatas.isPending || cuantas === 0}
            aria-invalid={texto.trim() !== "" && elegida === null}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          {/* El `<datalist>` filtra por subcadena, así que encuentra igual
              tecleando el nodo o el nombre. Un `<select>` no servía: su búsqueda
              por teclado sólo mira el principio del texto, y ahí va el nodo. */}
          <datalist id="estaciones-operativas">
            {(candidatas.data ?? []).map((e) => (
              <option key={e.id} value={etiquetaEstacion(e)}>
                {e.area.nombre} · {e.region.nombre}
              </option>
            ))}
          </datalist>
          {texto.trim() !== "" && elegida === null ? (
            <p className="text-xs text-destructive">
              Ninguna estación operativa coincide. Sólo se listan las que están
              operativas: una caída ya tiene su falla.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {elegida
                ? `${elegida.area.nombre} · ${elegida.region.nombre}`
                : "Sólo las que están operativas: una estación caída ya tiene su falla."}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="causa-alta">Causa</Label>
          <Select
            id="causa-alta"
            value={causaFallaId ?? ""}
            onChange={(e) => setCausaFallaId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Elegir…</option>
            {(causas.data ?? [])
              .filter((c) => c.activo)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desde-alta">Desde</Label>
          <Input
            id="desde-alta"
            type="date"
            max={hoy()}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="observacion-alta">Observación</Label>
          <Input
            id="observacion-alta"
            placeholder="Opcional"
            maxLength={1000}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />
        </div>
      </div>

      {abrir.isError ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>
            {abrir.error instanceof ApiError ? abrir.error.message : "No se pudo anotar la falla."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        className="mt-3"
        disabled={elegida === null || causaFallaId === null || abrir.isPending}
      >
        {abrir.isPending ? "Anotando…" : "Anotar"}
      </Button>
    </form>
  );
}
