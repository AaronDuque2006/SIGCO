"use client";

import type { FilaFuenteDiariaDto } from "@sicog/shared-types";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CeldaVolumen } from "@/components/celda-volumen";
import { Encabezado } from "@/components/encabezado";
import { GuardiaSesion } from "@/components/guardia-sesion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatearVolumen, hoy, useGrillaFuentes, useGuardarLecturaFuente } from "@/lib/despacho";
import { useSesion } from "@/lib/sesion";

export default function LecturasFuentePage() {
  return (
    <GuardiaSesion>
      <LecturasFuente />
    </GuardiaSesion>
  );
}

function LecturasFuente() {
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
  const puedeEditar = sesion?.departamentosQueEdita.includes("Despacho") === true;

  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-5xl p-4">
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Lecturas de fuentes</h1>
            <Link href="/despacho" className="text-sm text-primary hover:underline">
              Ir a balance diario
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            {cargadas} de {visibles.length} fuentes con lectura · total{" "}
            <span className="font-mono text-foreground">{formatearVolumen(total)}</span> MMPCED
          </p>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Esto es el <strong>recibido</strong> del balance: el gas que entra al sistema.
        </p>

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
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-medium">Fuente</th>
                  <th scope="col" className="px-3 py-2 font-medium">Sistema</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">MMPCED</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((fila) => (
                  <tr key={fila.fuente.id} className="border-b border-border last:border-0">
                    <th scope="row" className="px-3 py-1.5 text-left font-normal">
                      {fila.fuente.nombre}
                    </th>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {fila.fuente.sistema.nombre}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <CeldaFuente fila={fila} fecha={fecha} puedeEditar={puedeEditar} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
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
