"use client";

import { useState } from "react";
import {
  fechaHora,
  formatearVolumen,
  useHistorialLectura,
  type RecursoLectura,
} from "@/lib/despacho";
import { IconHistory } from "@tabler/icons-react";

/**
 * El historial de correcciones de una lectura, desplegable desde su fila.
 *
 * La decisión #3 hace obligatorio el historial justamente porque cualquier
 * analista puede corregir cualquier registro: hasta acá se guardaba quién
 * cambió qué y no había forma de mirarlo.
 *
 * Se despliega por fila y no en una pantalla de auditoría aparte porque
 * contesta la pregunta en el momento en que aparece — estás viendo un número
 * que no cuadra y querés saber quién lo tocó. Una vista del día completo
 * necesitaría un endpoint que hoy no existe, y todavía no está confirmado
 * quién la usaría.
 */
export function useDesplegable() {
  const [abierta, setAbierta] = useState<string | null>(null);
  return {
    abierta,
    alternar: (id: string) => setAbierta((actual) => (actual === id ? null : id)),
  };
}

/**
 * El indicador aparece **sólo** si hubo correcciones: un botón en las 111
 * filas sería ruido, y el conteo ya viaja con la grilla (`correcciones`), así
 * que no cuesta una petición averiguarlo.
 */
export function BotonCorrecciones({
  correcciones,
  abierto,
  onClick,
  etiqueta,
  idPanel,
}: {
  correcciones: number;
  abierto: boolean;
  onClick: () => void;
  /** Para el lector de pantalla: de qué fila es este historial. */
  etiqueta: string;
  idPanel: string;
}) {
  if (correcciones === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={abierto}
      aria-controls={idPanel}
      aria-label={`${correcciones === 1 ? "1 corrección" : `${correcciones} correcciones`} de ${etiqueta}`}
      title="Ver las correcciones"
      className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 font-mono text-xs leading-none text-muted-foreground tabular-nums hover:border-ring hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {/* El reloj de historial y no un lápiz: el botón no edita, abre lo que ya
          se editó. `aria-hidden` porque el `aria-label` del botón ya lo dice. */}
      <IconHistory size={12} stroke={2} aria-hidden />
      {correcciones}
    </button>
  );
}

/** La fila que se despliega debajo, con el recorrido del valor. */
export function FilaHistorial({
  recurso,
  lecturaId,
  columnas,
  idPanel,
  valorActual,
}: {
  recurso: RecursoLectura;
  lecturaId: string;
  /** Cuántas columnas tiene la tabla, para el `colSpan`. */
  columnas: number;
  idPanel: string;
  valorActual: number;
}) {
  const historial = useHistorialLectura(recurso, lecturaId, true);

  return (
    <tr className="border-b border-border bg-muted/40">
      <td colSpan={columnas} className="px-3 py-2" id={idPanel}>
        {historial.isPending ? (
          <p className="text-xs text-muted-foreground" role="status">
            Cargando el historial…
          </p>
        ) : historial.error ? (
          <p className="text-xs text-destructive" role="alert">
            {historial.error.message}
          </p>
        ) : (
          <ol className="space-y-1 text-xs">
            {/* El valor vigente va primero y sin fecha: el historial guarda los
                valores *anteriores*, no el actual. */}
            <li className="flex flex-wrap items-baseline gap-x-3 text-foreground">
              <span className="font-mono tabular-nums">{formatearVolumen(valorActual)}</span>
              <span className="text-muted-foreground">valor vigente</span>
            </li>
            {historial.data?.data.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-baseline gap-x-3 text-muted-foreground"
              >
                <span className="font-mono tabular-nums">
                  {formatearVolumen(h.valorAnterior)}
                </span>
                <span>
                  reemplazado por <span className="text-foreground">{h.usuarioNombre}</span>
                </span>
                <span>{fechaHora(h.modificadoEn)}</span>
              </li>
            ))}
          </ol>
        )}
      </td>
    </tr>
  );
}
