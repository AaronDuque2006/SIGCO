"use client";

import type { TipoCorte } from "@sicog/shared-types";
import { formatearVolumen, useBalanceNacion } from "@/lib/despacho";

/**
 * El "Balance Nación" del §11, que es query-calculado y no una tabla
 * (decisión #15).
 *
 * `recibido` sale de las lecturas de FUENTES y `entregado` de las de CLIENTES;
 * la quema nacional no entra en ninguno de los dos (confirmado con el owner).
 * La condición replica la fórmula del workbook real: corte estricto en cero,
 * sin umbral, así que una variación de exactamente 0 es DESEMPAQUE.
 */
export function TarjetasBalance({
  fecha,
  tipoCorte,
}: {
  fecha: string;
  tipoCorte: TipoCorte;
}) {
  const balance = useBalanceNacion(fecha, tipoCorte);

  if (balance.error) {
    return (
      <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive" role="alert">
        No se pudo calcular el balance: {balance.error.message}
      </p>
    );
  }

  const d = balance.data;
  const empaque = d?.condicion === "EMPAQUE";

  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tarjeta titulo="Recibido" valor={d?.recibidoMmpced} pie="Lecturas de fuentes" />
      <Tarjeta titulo="Entregado" valor={d?.transportadoMmpced} pie="Lecturas de clientes" />
      <Tarjeta
        titulo="Variación"
        valor={d?.variacionMmpced}
        pie="Recibido menos entregado"
        tono={d === undefined ? undefined : empaque ? "ok" : "warn"}
      />
      <div className="rounded-lg border border-border bg-card p-3">
        <dt className="text-xs text-muted-foreground">Condición del sistema</dt>
        <dd className="mt-1">
          {d === undefined ? (
            <span className="text-muted-foreground">…</span>
          ) : (
            <span
              className={`rounded-md px-2 py-0.5 text-sm font-medium ${
                empaque ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
              }`}
            >
              {empaque ? "Empacado" : "Desempacado"}
            </span>
          )}
        </dd>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {empaque ? "Entró más gas del que salió" : "Salió más gas del que entró"}
        </p>
      </div>
    </dl>
  );
}

function Tarjeta({
  titulo,
  valor,
  pie,
  tono,
}: {
  titulo: string;
  valor: number | undefined;
  pie: string;
  tono?: "ok" | "warn";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd
        className={`mt-1 font-mono text-xl tabular-nums ${
          tono === "ok" ? "text-ok" : tono === "warn" ? "text-warn" : ""
        }`}
      >
        {valor === undefined ? (
          <span className="text-base text-muted-foreground">…</span>
        ) : (
          <>
            {formatearVolumen(valor)}{" "}
            <span className="font-sans text-xs text-muted-foreground">MMPCED</span>
          </>
        )}
      </dd>
      <p className="mt-1.5 text-xs text-muted-foreground">{pie}</p>
    </div>
  );
}
