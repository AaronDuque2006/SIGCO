"use client";

import type { FilaBalanceDiarioDto, TipoCorte } from "@sicog/shared-types";
import { useEffect, useState } from "react";
import { formatearVolumen, useGuardarLectura } from "@/lib/despacho";

/**
 * La celda editable de la grilla. Guarda al salir del campo o con Enter, no con
 * un botón por fila: digitar el día son cien clientes seguidos y un botón por
 * fila obligaría a sacar la mano del teclado cien veces.
 */
export function CeldaVolumen({
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
  const valorGuardado = fila.lectura?.volumenMmpced ?? null;
  const [texto, setTexto] = useState(valorGuardado === null ? "" : String(valorGuardado));

  // Si la grilla se recarga —otro día, otro corte, o el refresco tras guardar—
  // la celda tiene que volver a reflejar lo que hay en la base.
  useEffect(() => {
    setTexto(valorGuardado === null ? "" : String(valorGuardado));
  }, [valorGuardado]);

  // `CIERRE_PROMEDIO` sólo lo escribe el job de cierre (decisión #42): se puede
  // corregir una fila existente, nunca crear una.
  const editable =
    puedeEditar && (tipoCorte === "PUNTUAL" || fila.lectura !== null);

  if (!editable) {
    return (
      <span className="font-mono tabular-nums">
        {valorGuardado === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          formatearVolumen(valorGuardado)
        )}
      </span>
    );
  }

  const confirmar = () => {
    const limpio = texto.trim().replace(",", ".");
    if (limpio === "") return;
    const numero = Number(limpio);
    if (!Number.isFinite(numero) || numero < 0) return;
    if (numero === valorGuardado) return;
    guardar.mutate({
      clienteId: fila.cliente.id,
      lecturaId: fila.lectura?.id ?? null,
      volumenMmpced: numero,
    });
  };

  return (
    <span className="inline-flex items-center justify-end gap-2">
      {guardar.error ? (
        <span className="text-xs text-destructive" role="alert">
          {guardar.error.message}
        </span>
      ) : null}
      <input
        inputMode="decimal"
        aria-label={`Volumen de ${fila.cliente.nombre} en MMPCED`}
        aria-invalid={guardar.error !== null}
        value={texto}
        disabled={guardar.isPending}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setTexto(valorGuardado === null ? "" : String(valorGuardado));
            e.currentTarget.blur();
          }
        }}
        className="w-28 rounded-md border border-input bg-transparent px-2 py-0.5 text-right font-mono text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-[invalid=true]:border-destructive"
      />
    </span>
  );
}
