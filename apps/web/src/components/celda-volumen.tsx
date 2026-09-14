"use client";

import { useEffect, useState } from "react";
import { formatearVolumen } from "@/lib/despacho";

/**
 * Celda editable de volumen, común a las grillas de clientes y de fuentes.
 *
 * Guarda al salir del campo o con Enter, no con un botón por fila: digitar el
 * día son cien filas seguidas y un botón por fila obligaría a sacar la mano del
 * teclado cien veces. `Escape` descarta.
 */
export function CeldaVolumen({
  valor,
  etiqueta,
  editable,
  guardando,
  error,
  onGuardar,
}: {
  valor: number | null;
  /** Para el lector de pantalla: de qué fila es esta celda. */
  etiqueta: string;
  editable: boolean;
  guardando: boolean;
  error: string | null;
  onGuardar: (volumen: number) => void;
}) {
  const [texto, setTexto] = useState(valor === null ? "" : String(valor));

  // Si la grilla se recarga —otro día, otro corte, o el refresco tras
  // guardar— la celda tiene que volver a reflejar lo que hay en la base.
  useEffect(() => {
    setTexto(valor === null ? "" : String(valor));
  }, [valor]);

  if (!editable) {
    return (
      <span className="font-mono tabular-nums">
        {valor === null ? <span className="text-muted-foreground">—</span> : formatearVolumen(valor)}
      </span>
    );
  }

  const confirmar = () => {
    // Se acepta la coma decimal: es lo que teclea la gente acá.
    const limpio = texto.trim().replace(",", ".");
    if (limpio === "") return;
    const numero = Number(limpio);
    if (!Number.isFinite(numero) || numero < 0) return;
    if (numero === valor) return;
    onGuardar(numero);
  };

  return (
    <span className="inline-flex items-center justify-end gap-2">
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
      <input
        inputMode="decimal"
        aria-label={etiqueta}
        aria-invalid={error !== null}
        value={texto}
        disabled={guardando}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setTexto(valor === null ? "" : String(valor));
            e.currentTarget.blur();
          }
        }}
        className="w-28 rounded-md border border-input bg-transparent px-2 py-0.5 text-right font-mono text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-[invalid=true]:border-destructive"
      />
    </span>
  );
}
