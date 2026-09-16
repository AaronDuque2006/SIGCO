"use client";

import type { FilaFuenteDiariaDto } from "@sicog/shared-types";
import { Fragment, useMemo, useState } from "react";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { CeldaVolumen } from "@/components/celda-volumen";
import {
  BotonCorrecciones,
  FilaHistorial,
  useDesplegable,
} from "@/components/historial-correcciones";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEPARTAMENTO_DESPACHO,
  formatearVolumen,
  hoy,
  puedeEditarDespacho,
  useGrillaFuentes,
  useGuardarLecturaFuente,
} from "@/lib/despacho";
import { useSesion } from "@/lib/sesion";
import { EncabezadoVista } from "@/components/encabezado-vista";

export default function LecturasFuentePage() {
  const { sesion } = useSesion();
  const [fecha, setFecha] = useState(hoy);
  const [sistema, setSistema] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Sin selector de corte: el modelo guarda una lectura por fuente y por día
  // (@@unique(fuenteId, fecha)); la mecánica puntual/cierre de la decisión #34
  // aplica a clientes y a la quema, no a las fuentes.
  const grilla = useGrillaFuentes(fecha);
  const filas = useMemo(() => grilla.data?.data ?? [], [grilla.data]);

  const sistemas = useMemo(
    () =>
      [...new Set(filas.map((f) => f.fuente.sistema.nombre))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [filas],
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter(
      (f) =>
        (sistema === "" || f.fuente.sistema.nombre === sistema) &&
        (q === "" || f.fuente.nombre.toLowerCase().includes(q)),
    );
  }, [filas, sistema, busqueda]);

  const total = visibles.reduce((s, f) => s + (f.lectura?.volumenMmpced ?? 0), 0);
  const cargadas = visibles.filter((f) => f.lectura !== null).length;
  const puedeEditar = puedeEditarDespacho(sesion);

  return (
    <>
      <main>
        <EncabezadoVista
          titulo="Lecturas de fuentes"
          meta={
            <>
              {cargadas} de {visibles.length} fuentes con lectura · total{" "}
              <span className="font-mono text-foreground">{formatearVolumen(total)}</span> MMPCED
            </>
          }
        >
          Esto es el <strong>recibido</strong> del balance: el gas que entra al sistema.
        </EncabezadoVista>

        <AvisoSoloConsulta sesion={sesion} departamento={DEPARTAMENTO_DESPACHO} />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
            <Label htmlFor="sistema">Sistema</Label>
            <select
              id="sistema"
              value={sistema}
              onChange={(e) => setSistema(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Todos</option>
              {sistemas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="busqueda">Fuente</Label>
            <Input
              id="busqueda"
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {grilla.isPending ? (
          <p className="mt-6 text-sm text-muted-foreground" role="status">
            Cargando la grilla…
          </p>
        ) : grilla.error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{grilla.error.message}</AlertDescription>
          </Alert>
        ) : visibles.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Ninguna fuente coincide con el filtro.
          </p>
        ) : (
          <Tabla filas={visibles} fecha={fecha} puedeEditar={puedeEditar} />
        )}
      </main>
    </>
  );
}

function Tabla({
  filas,
  fecha,
  puedeEditar,
}: {
  filas: FilaFuenteDiariaDto[];
  fecha: string;
  puedeEditar: boolean;
}) {
  const { abierta, alternar } = useDesplegable();

  return (
    <TablaDesplazable anchoMinimo="min-w-[34rem]">
      <thead>
        <tr className="bg-card text-left text-xs text-muted-foreground">
          <th scope="col" className={TH}>Fuente</th>
          <th scope="col" className={TH}>Sistema</th>
          <th scope="col" className={`${TH} text-right`}>MMPCED</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => {
          const clave = String(fila.fuente.id);
          const idPanel = `historial-fuente-${clave}`;
          const abierto = abierta === clave;
          return (
            <Fragment key={fila.fuente.id}>
              <tr className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-1.5 text-left font-normal">
                  {fila.fuente.nombre}
                </th>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {fila.fuente.sistema.nombre}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="inline-flex items-center justify-end gap-2">
                    <BotonCorrecciones
                      correcciones={fila.correcciones}
                      abierto={abierto}
                      onClick={() => alternar(clave)}
                      etiqueta={fila.fuente.nombre}
                      idPanel={idPanel}
                    />
                    <CeldaFuente fila={fila} fecha={fecha} puedeEditar={puedeEditar} />
                  </span>
                </td>
              </tr>
              {abierto && fila.lectura ? (
                <FilaHistorial
                  recurso="lecturas-fuente"
                  lecturaId={fila.lectura.id}
                  columnas={3}
                  idPanel={idPanel}
                  valorActual={fila.lectura.volumenMmpced}
                />
              ) : null}
            </Fragment>
          );
        })}
      </tbody>
    </TablaDesplazable>
  );
}

function CeldaFuente({
  fila,
  fecha,
  puedeEditar,
}: {
  fila: FilaFuenteDiariaDto;
  fecha: string;
  puedeEditar: boolean;
}) {
  const guardar = useGuardarLecturaFuente(fecha);
  return (
    <CeldaVolumen
      valor={fila.lectura?.volumenMmpced ?? null}
      etiqueta={`Volumen de ${fila.fuente.nombre} en MMPCED`}
      editable={puedeEditar}
      guardando={guardar.isPending}
      error={guardar.error?.message ?? null}
      onGuardar={(volumenMmpced) =>
        guardar.mutate({
          fuenteId: fila.fuente.id,
          lecturaId: fila.lectura?.id ?? null,
          volumenMmpced,
        })
      }
    />
  );
}
