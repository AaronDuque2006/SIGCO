"use client";

import type { ActividadRegistroDto } from "@sicog/shared-types";
import { useMemo, useState } from "react";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { SubNavActividades } from "@/components/actividades/sub-nav";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
    formatearHh,
  puedeCrearRegistros,
  puedeEditarDepartamento,
  useDepartamentoId,
  useGerencias,
  useInsumos,
  useProductosServicio,
  useRegistros,
  useResponsables,
  type FiltrosRegistros,
} from "@/lib/actividades";
import { useSesion } from "@/lib/sesion";
import { FormularioRegistro } from "@/components/actividades/formulario-registro";
import { EstadoActividad } from "@/components/actividades/estado-actividad";

/**
 * La bitácora de actividades y horas-hombre.
 *
 * Es el equivalente de Balance Diario en este dominio: la pantalla donde se
 * pasa el tiempo. A diferencia de aquélla **va paginada** — una bitácora crece
 * sin techo, no se digita de corrido— siguiendo el mismo criterio que
 * Novedades (decisión #72).
 */
export function Bitacora({ departamento, base }: { departamento: string; base: string }) {
  const { sesion } = useSesion();
  const departamentoId = useDepartamentoId(departamento) ?? undefined;

  const [page, setPage] = useState(1);
  const [insumoId, setInsumoId] = useState("");
  const [gerenciaRequirienteId, setGerencia] = useState("");
  const [estatus, setEstatus] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [q, setQ] = useState("");
  const [alta, setAlta] = useState(false);
  // "" = todos; "mios" = los propios; un id = esa persona. El equipo se pide
  // aparte porque es la decisión #25 —un superior ve **toda** la cadena hacia
  // abajo—, no un filtro por una persona más.
  const [responsable, setResponsable] = useState("");

  const filtrar = (cambiar: () => void) => {
    cambiar();
    setPage(1);
  };

  const filtros = useMemo<FiltrosRegistros>(
    () => ({
      page,
      departamentoId,
      usuarioId:
        responsable === ""
          ? undefined
          : responsable === "equipo" || responsable === "mios"
            ? sesion?.id
            : Number(responsable),
      cadena: responsable === "equipo",
      insumoId: insumoId === "" ? undefined : Number(insumoId),
      gerenciaRequirienteId:
        gerenciaRequirienteId === "" ? undefined : Number(gerenciaRequirienteId),
      estatus: estatus === "" ? undefined : estatus,
      desde: desde === "" ? undefined : desde,
      hasta: hasta === "" ? undefined : hasta,
      q: q.trim() === "" ? undefined : q.trim(),
    }),
    [page, departamentoId, responsable, sesion?.id, insumoId, gerenciaRequirienteId, estatus, desde, hasta, q],
  );

  const lista = useRegistros(filtros);
  const responsables = useResponsables(departamentoId);
  const insumos = useInsumos(departamentoId);
  const gerencias = useGerencias(departamentoId);
  const productos = useProductosServicio(departamentoId);

  const puedeEditar = puedeEditarDepartamento(sesion, departamento);
  const puedeCrear = puedeEditar && puedeCrearRegistros(sesion);
  const paginacion = lista.data?.pagination;

  return (
    <main>
      <SubNavActividades base={base} />
      <EncabezadoVista
        titulo="Actividades"
        meta={
          paginacion ? (
            <>
              <span className="font-mono text-foreground tabular-nums">
                {paginacion.totalItems}
              </span>{" "}
              registros
            </>
          ) : undefined
        }
      >
        Bitácora de actividades y horas-hombre. Las horas de una tarea asignada
        aparecen en blanco hasta que alguien la empieza.
      </EncabezadoVista>

      <AvisoSoloConsulta sesion={sesion} departamento={departamento} />

      {/* Quien no puede crear igual ve la pantalla completa: lo que cambia es
          que no se le ofrece el alta. Decirlo es mejor que esconder el botón
          sin explicación — un Analista no está impedido, está esperando que le
          asignen (decisión #83). */}
      {puedeEditar && !puedeCrear ? (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Su supervisor le asigna las tareas. Cuando tenga una, puede moverle el
          estado y cargarle las horas desde la propia fila.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <div className="space-y-1.5">
          <Label htmlFor="responsable-filtro">Responsable</Label>
          <Select
            id="responsable-filtro"
            value={responsable}
            onChange={(e) => filtrar(() => setResponsable(e.target.value))}
          >
            <option value="">Todos</option>
            <option value="mios">Sólo los míos</option>
            {/* La cadena completa hacia abajo, no un nivel (decisión #25). A un
                Analista no se le ofrece: no tiene gente debajo. */}
            {puedeCrear ? <option value="equipo">Mi equipo</option> : null}
            {(responsables.data ?? [])
              .filter((r) => r.id !== sesion?.id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.puesto}
                </option>
              ))}
          </Select>
        </div>
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
          <Label htmlFor="insumo">Insumo</Label>
          <Select
            id="insumo"
            value={insumoId}
            onChange={(e) => filtrar(() => setInsumoId(e.target.value))}
          >
            <option value="">Todos</option>
            {(insumos.data ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gerencia">Gerencia</Label>
          <Select
            id="gerencia"
            value={gerenciaRequirienteId}
            onChange={(e) => filtrar(() => setGerencia(e.target.value))}
          >
            <option value="">Todas</option>
            {(gerencias.data ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estatus">Estado</Label>
          <Select
            id="estatus"
            value={estatus}
            onChange={(e) => filtrar(() => setEstatus(e.target.value))}
          >
            <option value="">Todos</option>
            <option value="RECIBIDO">Recibido</option>
            <option value="EN PROCESO">En proceso</option>
            <option value="FINALIZADO">Finalizado</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="q">Detalle</Label>
          <Input
            id="q"
            placeholder="Buscar en el detalle"
            value={q}
            onChange={(e) => filtrar(() => setQ(e.target.value))}
          />
        </div>
      </div>

      {puedeCrear ? (
        <div className="mt-4">
          {alta ? (
            <FormularioRegistro
              departamentoId={departamentoId}
              productos={productos.data ?? []}
              gerencias={gerencias.data ?? []}
              onCerrar={() => setAlta(false)}
            />
          ) : (
            <Button onClick={() => setAlta(true)}>Registrar actividad</Button>
          )}
        </div>
      ) : null}

      {lista.error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{lista.error.message}</span>
            <Button variant="outline" size="sm" onClick={() => void lista.refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : lista.isPending ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Cargando…
        </p>
      ) : lista.data.data.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {q || insumoId || gerenciaRequirienteId || estatus || desde || hasta
            ? "Ningún registro coincide con el filtro."
            : "Todavía no hay actividades registradas."}
        </p>
      ) : (
        <Tabla
          registros={lista.data.data}
          sesionId={sesion?.id ?? 0}
          puedeEditar={puedeEditar}
          esAnalista={sesion?.puesto === "Analista"}
        />
      )}

      {paginacion && paginacion.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {paginacion.page} de {paginacion.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={paginacion.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={paginacion.page >= paginacion.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Tabla({
  registros,
  sesionId,
  puedeEditar,
  esAnalista,
}: {
  registros: ActividadRegistroDto[];
  sesionId: number;
  puedeEditar: boolean;
  /** Un Analista sólo completa **lo suyo**; cualquier otro puesto corrige lo
   *  de su departamento (decisión #83). El backend lo hace cumplir igual. */
  esAnalista: boolean;
}) {
  return (
    <TablaDesplazable anchoMinimo="min-w-[64rem]">
      <thead>
        <tr className="bg-card text-left text-xs text-muted-foreground">
          <th scope="col" className={TH}>Actividad</th>
          <th scope="col" className={TH}>Responsable</th>
          <th scope="col" className={TH}>Gerencia</th>
          <th scope="col" className={TH}>Alcance</th>
          <th scope="col" className={TH}>Período</th>
          <th scope="col" className={`${TH} text-right`}>Cant.</th>
          <th scope="col" className={`${TH} text-right`}>HH</th>
          <th scope="col" className={TH}>Estado</th>
        </tr>
      </thead>
      <tbody>
        {registros.map((r) => (
          <tr key={r.id} className="border-b border-border last:border-0">
            <th scope="row" className="px-3 py-1.5 text-left font-normal">
              <span className="block">{r.productoServicio.nombre}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {r.productoServicio.insumo.nombre}
              </span>
            </th>
            <td className="px-3 py-1.5 text-muted-foreground">
              {r.usuario.nombre}
              {r.usuario.id === sesionId ? (
                <span className="ml-1.5 text-xs">(usted)</span>
              ) : null}
            </td>
            <td className="px-3 py-1.5 text-muted-foreground">{r.gerenciaRequiriente.nombre}</td>
            {/* Nulo es alcance nacional, no un dato faltante (decisión #19). */}
            <td className="px-3 py-1.5 text-muted-foreground">
              {r.region?.nombre ?? "Nacional"}
            </td>
            <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground tabular-nums">
              {r.fechaDesde === r.fechaHasta ? (
                r.fechaDesde
              ) : (
                <>
                  {r.fechaDesde} → {r.fechaHasta}
                </>
              )}
            </td>
            <td className="px-3 py-1.5 text-right font-mono tabular-nums">{r.cantidad}</td>
            <td className="px-3 py-1.5 text-right font-mono tabular-nums">
              {formatearHh(r.hh)}
            </td>
            <td className="px-3 py-1.5">
              <EstadoActividad
                registro={r}
                editable={puedeEditar && (!esAnalista || r.usuario.id === sesionId)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </TablaDesplazable>
  );
}
