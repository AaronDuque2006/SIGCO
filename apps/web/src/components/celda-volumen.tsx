"use client";

import { useEffect, useState } from "react";
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
export const comoTexto = (v: number | null): string => (v === null ? "" : String(v));

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

export function evaluarCelda(
  texto: string,
  valor: number | null,
  permiteNegativo = false,
  maxDecimales = 4,
): ResultadoCelda {
  // Se acepta la coma decimal: es lo que teclea la gente acá.
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "") return { tipo: "reponer" };

  const numero = Number(limpio);
  if (!Number.isFinite(numero)) return { tipo: "rechazar", mensaje: "No es un número" };

  // Lo rechaza también el schema del backend: un volumen entregado no puede
  // ser negativo, y "Desvío" se modela como una FUENTE aparte (decisión #5).
  // Avisar acá ahorra el viaje y el 422.
  //
  // La excepción es un punto de transferencia bidireccional, donde el signo
  // **es** el dato: codifica en qué sentido fue el gas (decisión #79).
  if (numero < 0 && !permiteNegativo) {
    return { tipo: "rechazar", mensaje: "No puede ser negativo" };
  }

  // Los volúmenes son `Decimal(14,4)` y las horas-hombre `Decimal(10,2)`: más
  // posiciones las redondea Postgres sin avisar, que es la misma sorpresa
  // silenciosa que todo esto evita.
  if ((limpio.split(".")[1] ?? "").length > maxDecimales) {
    return { tipo: "rechazar", mensaje: `Máximo ${maxDecimales} decimales` };
  }

  return numero === valor ? { tipo: "nada" } : { tipo: "guardar", numero };
}

/**
 * La celda de volumen siguiente (o anterior) de la misma grilla, en el orden en
 * que se ve.
 *
 * Se resuelve contra el DOM y no con una lista de refs porque el orden que
 * importa es el que la persona tiene delante: la grilla se filtra en el
 * navegador (decisión #60), así que el orden visible cambia con el filtro y el
 * documento ya lo refleja. Cada grilla es su propia `<table>`, de modo que el
 * recorrido no salta de los clientes a las transferencias.
 */
const celdaVecina = (desde: HTMLInputElement, paso: 1 | -1): HTMLInputElement | null => {
  const grilla = desde.closest("table");
  if (!grilla) return null;
  const celdas = [...grilla.querySelectorAll<HTMLInputElement>("input[data-celda-volumen]")];
  const i = celdas.indexOf(desde);
  return i === -1 ? null : (celdas[i + paso] ?? null);
};

/** Cuánto dura el acuse de guardado. */
const ACUSE_MS = 700;

/**
 * Celda editable de volumen, común a las grillas de clientes y de fuentes.
 *
 * Guarda al salir del campo o con Enter, no con un botón por fila: digitar el
 * día son cien filas seguidas y un botón por fila obligaría a sacar la mano del
 * teclado cien veces. `Escape` descarta.
 *
 * **Enter baja a la celda siguiente** y Shift+Enter sube. Sin eso el guardado al
 * salir del campo cumplía su promesa a medias: el foco caía al `body` y había
 * que buscar la fila siguiente con Tab —pasando por el botón de historial— o con
 * el mouse, ciento once veces. Mover el foco es además lo que dispara el
 * guardado, así que no hay dos caminos que mantener.
 *
 * **Mientras guarda el campo no se deshabilita.** Deshabilitarlo le quitaba el
 * foco a quien digita por teclado justo en el campo que acababa de dejar, así
 * que se perdía el foco dos veces por celda. El estado viaja en `aria-busy`.
 */
export function CeldaVolumen({
  valor,
  etiqueta,
  editable,
  permiteNegativo = false,
  maxDecimales = 4,
  guardando,
  error,
  onGuardar,
}: {
  valor: number | null;
  /** Para el lector de pantalla: de qué fila es esta celda. */
  etiqueta: string;
  editable: boolean;
  /** Cuando es `true` se admite el signo: el valor codifica una dirección. */
  permiteNegativo?: boolean;
  /** Los que admite la columna de la base. */
  maxDecimales?: number;
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

  // Acuse de guardado. El sistema ya decía **por qué** rechazaba lo tecleado y
  // no decía nada al aceptarlo: desde el teclado, una celda que guardó y una
  // cuyo POST falló en silencio se veían igual una vez que el spinner se iba.
  // Es la simétrica de esa regla, y en un dato que alimenta el informe de
  // cierre es la diferencia entre confiar y barrer la columna al final del
  // turno.
  //
  // La transición se detecta durante el render, como el valor de arriba, para
  // no gastar un render extra por celda y por refresco.
  const [acuse, setAcuse] = useState(false);
  const [guardandoAnterior, setGuardandoAnterior] = useState(guardando);
  if (guardando !== guardandoAnterior) {
    setGuardandoAnterior(guardando);
    if (!guardando && error === null) setAcuse(true);
  }

  useEffect(() => {
    if (!acuse) return;
    const t = setTimeout(() => setAcuse(false), ACUSE_MS);
    return () => clearTimeout(t);
  }, [acuse]);

  if (!editable) {
    return (
      <span className="font-mono tabular-nums">
        {valor === null ? <span className="text-muted-foreground">—</span> : formatearVolumen(valor)}
      </span>
    );
  }

  const confirmar = () => {
    const resultado = evaluarCelda(texto, valor, permiteNegativo, maxDecimales);
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
        data-celda-volumen=""
        aria-label={etiqueta}
        aria-invalid={mensaje !== null}
        aria-busy={guardando}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          // El aviso desaparece apenas se empieza a corregir: dejarlo puesto
          // mientras se teclea la enmienda es regañar por algo ya atendido.
          setErrorLocal(null);
        }}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // Se evalúa antes de moverse: si lo tecleado no sirve, el foco se
            // queda donde está. Irse dejando el aviso atrás sería descartar en
            // silencio con un cartel que nadie va a mirar.
            const resultado = evaluarCelda(texto, valor, permiteNegativo, maxDecimales);
            if (resultado.tipo === "rechazar") {
              setErrorLocal(resultado.mensaje);
              return;
            }
            // Mover el foco dispara el `onBlur`, que es el que guarda: así el
            // guardado tiene un solo camino y no dos que mantener sincronizados.
            const vecina = celdaVecina(e.currentTarget, e.shiftKey ? -1 : 1);
            if (vecina) vecina.focus();
            else e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setTexto(comoTexto(valor));
            setErrorLocal(null);
            e.currentTarget.blur();
          }
        }}
        className={`w-28 rounded-md border border-input bg-transparent px-2 py-0.5 text-right font-mono text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-[invalid=true]:border-destructive aria-[busy=true]:text-muted-foreground ${
          acuse ? "acuse-guardado" : ""
        }`}
      />
    </span>
  );
}

