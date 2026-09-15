"use client";

import { useState } from "react";
import { formatearVolumen } from "@/lib/despacho";

/**
 * Lo que se edita es el número crudo, no el formateado.
 *
 * `formatearVolumen` muestra dos decimales (decisión #60), pero la columna es
 * `Decimal(14,4)` y las filas de `CIERRE_PROMEDIO` —que también se corrigen—
 * traen las cuatro que calculó el job. Si el input arrancara con el valor
 * redondeado, pasar por la celda y salir guardaría `497,42` sobre un
 * `497,4167`: una pérdida de precisión silenciosa, sin que nadie tecleara
 * nada. Al corregir un promedio se ve el número real.
 */
const comoTexto = (v: number | null): string => (v === null ? "" : String(v));

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
  const [texto, setTexto] = useState(() => comoTexto(valor));

  // Si la grilla se recarga —otro día, otro corte, o el refresco tras
  // guardar— la celda tiene que volver a reflejar lo que hay en la base.
  //
  // Se ajusta durante el render comparando contra el valor anterior, y no
  // desde un `useEffect`: el efecto pintaba primero el valor viejo y recién
  // en un segundo render el nuevo, un render de más por cada celda y cada
  // refresco (regla `react-hooks/set-state-in-effect`).
  const [valorAnterior, setValorAnterior] = useState(valor);
  if (valor !== valorAnterior) {
    setValorAnterior(valor);
    setTexto(comoTexto(valor));
  }

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
            setTexto(comoTexto(valor));
            e.currentTarget.blur();
          }
        }}
        className="w-28 rounded-md border border-input bg-transparent px-2 py-0.5 text-right font-mono text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-[invalid=true]:border-destructive"
      />
    </span>
  );
}
