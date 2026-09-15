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
 * Qué hacer con lo que hay tecleado en la celda.
 *
 * Es una función pura y aparte del componente para poder ejercitarla sin
 * navegador: es la regla que decide si un día se digita o se pierde.
 *
 * - `guardar`: es un número válido y distinto del que hay.
 * - `reponer`: la celda quedó vacía. No se borra nada —la API no tiene DELETE
 *   de lecturas, el dato es auditable—, se repone lo guardado para que la
 *   celda no quede en blanco mintiendo.
 * - `rechazar`: hay algo escrito que no sirve, y se dice por qué.
 * - `nada`: el valor no cambió.
 */
export type ResultadoCelda =
  | { tipo: "guardar"; numero: number }
  | { tipo: "reponer" }
  | { tipo: "rechazar"; mensaje: string }
  | { tipo: "nada" };

export function evaluarCelda(texto: string, valor: number | null): ResultadoCelda {
  // Se acepta la coma decimal: es lo que teclea la gente acá.
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "") return { tipo: "reponer" };

  const numero = Number(limpio);
  if (!Number.isFinite(numero)) return { tipo: "rechazar", mensaje: "No es un número" };

  // Lo rechaza también el schema del backend: un volumen entregado no puede
  // ser negativo, y "Desvío" se modela como una FUENTE aparte (decisión #5).
  // Avisar acá ahorra el viaje y el 422.
  if (numero < 0) return { tipo: "rechazar", mensaje: "No puede ser negativo" };

  // La columna es Decimal(14,4): más posiciones las redondea Postgres sin
  // avisar, que es la misma sorpresa silenciosa que todo esto evita.
  if ((limpio.split(".")[1] ?? "").length > 4) {
    return { tipo: "rechazar", mensaje: "Máximo 4 decimales" };
  }

  return numero === valor ? { tipo: "nada" } : { tipo: "guardar", numero };
}

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

  // Error de la propia celda, distinto del que devuelve el servidor: este se
  // resuelve sin salir a la red. Se muestra el local primero porque es la
  // consecuencia de lo último que hizo la persona.
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const mensaje = errorLocal ?? error;

  if (!editable) {
    return (
      <span className="font-mono tabular-nums">
        {valor === null ? <span className="text-muted-foreground">—</span> : formatearVolumen(valor)}
      </span>
    );
  }

  const confirmar = () => {
    const resultado = evaluarCelda(texto, valor);
    if (resultado.tipo === "rechazar") {
      setErrorLocal(resultado.mensaje);
      return;
    }
    setErrorLocal(null);
    if (resultado.tipo === "reponer") setTexto(comoTexto(valor));
    if (resultado.tipo === "guardar") onGuardar(resultado.numero);
  };

  return (
    <span className="inline-flex items-center justify-end gap-2">
      {mensaje ? (
        <span className="text-xs text-destructive" role="alert">
          {mensaje}
        </span>
      ) : null}
      <input
        inputMode="decimal"
        aria-label={etiqueta}
        aria-invalid={mensaje !== null}
        value={texto}
        disabled={guardando}
        onChange={(e) => {
          setTexto(e.target.value);
          // El aviso desaparece apenas se empieza a corregir: dejarlo puesto
          // mientras se teclea la enmienda es regañar por algo ya atendido.
          setErrorLocal(null);
        }}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setTexto(comoTexto(valor));
            setErrorLocal(null);
            e.currentTarget.blur();
          }
        }}
        className="w-28 rounded-md border border-input bg-transparent px-2 py-0.5 text-right font-mono text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-[invalid=true]:border-destructive"
      />
    </span>
  );
}
