"use client";

import type { FilaBalanceDiarioDto, TipoCorte } from "@sicog/shared-types";
import { useMemo, useState } from "react";
import { CeldaVolumen } from "@/components/celda-volumen";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatearVolumen, hoy, useGrillaBalance, useGuardarLectura } from "@/lib/despacho";
import { useSesion } from "@/lib/sesion";
import { TarjetasBalance } from "./tarjetas-balance";

export default function BalanceDiarioPage() {
  const { sesion } = useSesion();
  const [fecha, setFecha] = useState(hoy);
  const [tipoCorte, setTipoCorte] = useState<TipoCorte>("PUNTUAL");
  const [sistema, setSistema] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const grilla = useGrillaBalance(fecha, tipoCorte);
  const filas = useMemo(() => grilla.data?.data ?? [], [grilla.data]);

  // Los sistemas salen de las filas ya cargadas y no de un catálogo aparte: la
  // grilla trae el sistema de cada cliente y todavía no existe el endpoint de
  // catálogos del §11. De paso, sólo se listan los que tienen clientes.
  const sistemas = useMemo(
    () => [...new Set(filas.map((f) => f.cliente.sistema.nombre))].sort((a, b) => a.localeCompare(b, "es")),
    [filas],
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter(
      (f) =>
        (sistema === "" || f.cliente.sistema.nombre === sistema) &&
        (q === "" || f.cliente.nombre.toLowerCase().includes(q)),
    );
  }, [filas, sistema, busqueda]);

  const total = visibles.reduce((suma, f) => suma + (f.lectura?.volumenMmpced ?? 0), 0);
  const cargadas = visibles.filter((f) => f.lectura !== null).length;

  // Decisión #22: se puede consultar cualquier departamento, editar sólo el
  // propio. Quien no edita Despacho ve la grilla completa, en modo lectura.
  const puedeEditar = sesion?.departamentosQueEdita.includes("Despacho") === true;

  return (
    <>
      <main>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight">Balance diario</h1>
          <p className="text-sm text-muted-foreground">
            {cargadas} de {visibles.length} clientes con lectura · total{" "}
            <span className="font-mono text-foreground">{formatearVolumen(total)}</span> MMPCED
          </p>
        </div>

        <TarjetasBalance fecha={fecha} tipoCorte={tipoCorte} />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <Label htmlFor="busqueda">Cliente</Label>
            <Input
              id="busqueda"
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {tipoCorte === "CIERRE_PROMEDIO" ? (
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            El cierre promedio lo calcula el job de medianoche a partir de todos los
            valores que tuvo el puntual ese día. Acá no se pueden crear filas nuevas;
            las que ya existen sí se pueden corregir.
          </p>
        ) : null}

        {grilla.isPending ? (
          <p className="mt-6 text-sm text-muted-foreground" role="status">
            Cargando la grilla…
          </p>
        ) : grilla.error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{grilla.error.message}</AlertDescription>
          </Alert>
        ) : (
          <Tabla
            filas={visibles}
            fecha={fecha}
            tipoCorte={tipoCorte}
            puedeEditar={puedeEditar}
          />
        )}
      </main>
    </>
  );
}

function Tabla({
  filas,
  fecha,
  tipoCorte,
  puedeEditar,
}: {
  filas: FilaBalanceDiarioDto[];
  fecha: string;
  tipoCorte: TipoCorte;
  puedeEditar: boolean;
}) {
  if (filas.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        Ningún cliente coincide con el filtro.
      </p>
    );
  }

  return (
    <TablaDesplazable anchoMinimo="min-w-[48rem]">
      <thead>
        <tr className="bg-card text-left text-xs text-muted-foreground">
          <th scope="col" className={TH}>Cliente</th>
          <th scope="col" className={TH}>Sistema</th>
          <th scope="col" className={TH}>Región</th>
          <th scope="col" className={TH}>Sector</th>
          <th scope="col" className={`${TH} text-right`}>MMPCED</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => (
          <tr key={fila.cliente.id} className="border-b border-border last:border-0">
            <th scope="row" className="px-3 py-1.5 text-left font-normal">
              {fila.cliente.nombre}
            </th>
            <td className="px-3 py-1.5 text-muted-foreground">
              {fila.cliente.sistema.nombre}
            </td>
            <td className="px-3 py-1.5 text-muted-foreground">
              {fila.cliente.region.nombre}
            </td>
            <td className="px-3 py-1.5 text-muted-foreground">
              {fila.cliente.sector.nombre}
            </td>
            <td className="px-3 py-1.5 text-right">
              <CeldaCliente
                fila={fila}
                fecha={fecha}
                tipoCorte={tipoCorte}
                puedeEditar={puedeEditar}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </TablaDesplazable>
  );
}

function CeldaCliente({
  fila,
  fecha,
  tipoCorte,
  puedeEditar,
}: {
  fila: FilaBalanceDiarioDto;
  fecha: string;
  tipoCorte: TipoCorte;
  puedeEditar: boolean;
}) {
  const guardar = useGuardarLectura(fecha, tipoCorte);

  // `CIERRE_PROMEDIO` sólo lo escribe el job de cierre (decisión #42): se puede
  // corregir una fila existente, nunca crear una.
  const editable = puedeEditar && (tipoCorte === "PUNTUAL" || fila.lectura !== null);

  return (
    <CeldaVolumen
      valor={fila.lectura?.volumenMmpced ?? null}
      etiqueta={`Volumen de ${fila.cliente.nombre} en MMPCED`}
      editable={editable}
      guardando={guardar.isPending}
      error={guardar.error?.message ?? null}
      onGuardar={(volumenMmpced) =>
        guardar.mutate({
          clienteId: fila.cliente.id,
          lecturaId: fila.lectura?.id ?? null,
          volumenMmpced,
        })
      }
    />
  );
}
