"use client";

import type { ActividadRegistroDto, EstatusActividad } from "@sicog/shared-types";
import { Select } from "@/components/ui/select";
import { useActualizarRegistro } from "@/lib/actividades";

const ETIQUETA: Record<EstatusActividad, string> = {
  RECIBIDO: "Recibido",
  "EN PROCESO": "En proceso",
  FINALIZADO: "Finalizado",
};

/**
 * Los tres colores son de **estado**, que es para lo único que el sistema los
 * reserva: `RECIBIDO` es una tarea que todavía no arrancó —y la única que no
 * cuenta en el REAL (decisión #83)—, `EN PROCESO` está en curso, `FINALIZADO`
 * terminó. No es un semáforo de bueno y malo: es dónde va la tarea.
 */
const TONO: Record<EstatusActividad, string> = {
  RECIBIDO: "bg-warn-soft text-warn",
  "EN PROCESO": "bg-accent-soft text-primary",
  FINALIZADO: "bg-ok-soft text-ok",
};

/**
 * El estado de una actividad: etiqueta cuando no se puede tocar, desplegable
 * cuando sí.
 *
 * Se cambia desde la propia fila y no abriendo un formulario porque es el
 * gesto más frecuente del módulo — quien ejecuta una tarea la mueve de estado
 * y le carga las horas, y nada más (decisión #83).
 */
export function EstadoActividad({
  registro,
  editable,
}: {
  registro: ActividadRegistroDto;
  editable: boolean;
}) {
  const actualizar = useActualizarRegistro();

  if (!editable) {
    return (
      <span
        className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${TONO[registro.estatus]}`}
      >
        {ETIQUETA[registro.estatus]}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Select
        aria-label={`Estado de ${registro.productoServicio.nombre}`}
        value={registro.estatus}
        disabled={actualizar.isPending}
        onChange={(e) =>
          actualizar.mutate({
            id: registro.id,
            datos: { estatus: e.target.value as EstatusActividad },
          })
        }
        className="w-[9.5rem]"
      >
        {(Object.keys(ETIQUETA) as EstatusActividad[]).map((v) => (
          <option key={v} value={v}>
            {ETIQUETA[v]}
          </option>
        ))}
      </Select>
      {/* Ningún rechazo silencioso: si el cambio no entró, se dice en la fila
          donde se intentó y no en un aviso global que nadie asocia. */}
      {actualizar.error ? (
        <span className="text-xs text-destructive" role="alert">
          {actualizar.error.message}
        </span>
      ) : null}
    </span>
  );
}
