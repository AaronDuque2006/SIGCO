"use client";

import type { HistorialEntryDto } from "@sicog/shared-types";
import { useState } from "react";
import {
  fechaHora,
  formatearVolumen,
  useHistorialLectura,
  useEditarHistorial,
  type RecursoLectura,
} from "@/lib/despacho";
import { IconHistory, IconPencil } from "@tabler/icons-react";
import { comoTexto, evaluarCelda } from "@/components/celda-volumen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  fecha,
  columnas,
  idPanel,
  valorActual,
  horaActual,
  usuarioActual,
  editadoPorActual,
  editadoEnActual,
  puedeEditar,
}: {
  recurso: RecursoLectura;
  lecturaId: string;
  /**
   * Necesaria sólo para invalidar la grilla cuando se edita un valor del
   * historial (el cierre del día se recalcula). En `lecturas-fuente` y
   * `transferencias` no se usa, así que queda opcional.
   */
  fecha?: string;
  /** Cuántas columnas tiene la tabla, para el `colSpan`. */
  columnas: number;
  idPanel: string;
  valorActual: number;
  /** `undefined` en los recursos que no tienen hora de lectura (transferencias). */
  horaActual?: string | null;
  /** Quién fijó el valor vigente. `undefined` en transferencias, que todavía
   *  no traen el nombre en su DTO. */
  usuarioActual?: string;
  /** Quién corrigió el valor vigente en el lugar, y cuándo. */
  editadoPorActual?: string | null;
  editadoEnActual?: string | null;
  /** Si esta persona edita Despacho (decisión #22). Sólo decide qué se ve:
   *  la ruta responde 403 igual si no le corresponde. */
  puedeEditar?: boolean;
}) {
  const historial = useHistorialLectura(recurso, lecturaId, true);
  // Dos condiciones juntas: sólo Balance tiene CIERRE_PROMEDIO calculado por
  // esta grilla (decisión #34) —en Fuentes y Transferencias editar un valor
  // viejo no cambiaría ningún cálculo—, y sólo quien edita Despacho puede
  // tocarlo (decisión #22).
  const editable = recurso === "lecturas-balance" && puedeEditar === true;
  const editar = useEditarHistorial("lecturas-balance", lecturaId, fecha ?? "");

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
          <>
            <TablaHistorial
              valorActual={valorActual}
              horaActual={horaActual}
              usuarioActual={usuarioActual}
              editadoPorActual={editadoPorActual}
              editadoEnActual={editadoEnActual}
              entradas={historial.data?.data ?? []}
              editar={
                editable
                  ? {
                      guardar: (historialId, valor) => editar.mutate({ historialId, valor }),
                      enCurso: editar.isPending,
                    }
                  : undefined
              }
            />
            {editable && editar.error ? (
              <p className="mt-1 text-xs text-destructive" role="alert">
                {editar.error.message}
              </p>
            ) : null}
          </>
        )}
      </td>
    </tr>
  );
}

/**
 * El recorrido del valor como cuadrícula: una fila por valor, de lo más nuevo
 * a lo más viejo, con quién lo puso, a qué hora se midió y cuándo se digitó.
 *
 * Está separada de `FilaHistorial` —que la envuelve en la fila desplegable de
 * las grillas— porque Quema Nacional no es una grilla: es una sola cifra con
 * su historial al lado. Las dos pantallas muestran lo mismo, así que muestran
 * lo mismo desde el mismo componente.
 */
export function TablaHistorial({
  valorActual,
  horaActual,
  usuarioActual,
  editadoPorActual,
  editadoEnActual,
  entradas,
  editar,
}: {
  valorActual: number;
  horaActual?: string | null;
  usuarioActual?: string | null;
  entradas: HistorialEntryDto[];
  /** Quién corrigió el valor vigente en el lugar, y cuándo. */
  editadoPorActual?: string | null;
  editadoEnActual?: string | null;
  /** Cuando viene, los valores se pueden corregir — el vigente incluido, con
   *  `historialId: null`. Sólo lo pasan Balance y Quema, los dos con
   *  `CIERRE_PROMEDIO` (decisión #34). */
  editar?: { guardar: (historialId: string | null, valor: number) => void; enCurso: boolean };
}) {
  const filas = comoFilas(
    valorActual,
    horaActual ?? null,
    usuarioActual ?? null,
    editadoPorActual ?? null,
    editadoEnActual ?? null,
    entradas,
  );
  const [editando, setEditando] = useState<string | null>(null);

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th scope="col" className="px-2 py-1 font-medium">MMPCED</th>
          <th scope="col" className="px-2 py-1 font-medium">Hora de lectura</th>
          <th scope="col" className="px-2 py-1 font-medium">Modificado por</th>
          <th scope="col" className="px-2 py-1 font-medium">Fecha de modificación</th>
          <th scope="col" className="px-2 py-1 font-medium">Editado</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f) => (
          <tr key={f.clave} className="border-t border-border/60 text-muted-foreground">
            <td className="px-2 py-1">
              {editar && editando === f.clave ? (
                <CeldaEditable
                  valor={f.valor}
                  enCurso={editar.enCurso}
                  onGuardar={(valor) => {
                    editar.guardar(f.historialId ?? null, valor);
                    setEditando(null);
                  }}
                  onCancelar={() => setEditando(null)}
                />
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`font-mono tabular-nums ${f.vigente ? "font-medium text-primary" : ""}`}
                  >
                    {formatearVolumen(f.valor)}
                  </span>
                  {f.vigente ? (
                    <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] text-primary">
                      vigente
                    </span>
                  ) : null}
                  {/* El vigente también se edita acá, y pisando el número
                      igual que las demás filas: corregirlo por el formulario
                      de la grilla mandaría el valor viejo al historial, donde
                      seguiría contando en la media (decisión #34). */}
                  {editar ? (
                    <button
                      type="button"
                      onClick={() => setEditando(f.clave)}
                      aria-label={`Editar el valor ${formatearVolumen(f.valor)}`}
                      title="Corregir este valor"
                      className="rounded-md p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <IconPencil size={12} stroke={1.75} aria-hidden />
                    </button>
                  ) : null}
                </span>
              )}
            </td>
            <td className="px-2 py-1 font-mono tabular-nums">{f.hora ?? "—"}</td>
            <td className="px-2 py-1 text-foreground">{f.usuario ?? "—"}</td>
            <td className="px-2 py-1">{f.cuando ? fechaHora(f.cuando) : "—"}</td>
            {/* El rastro de la edición: el número viejo se pierde al pisarlo,
                así que queda al menos quién lo retocó y cuándo. */}
            <td className="px-2 py-1">
              {f.editadoPor && f.editadoEn ? (
                <span className="text-foreground">
                  {f.editadoPor}{" "}
                  <span className="text-muted-foreground">· {fechaHora(f.editadoEn)}</span>
                </span>
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * El valor en modo edición: el mismo par de entrada y botones que usan los
 * formularios por fila de las grillas, en chico.
 */
function CeldaEditable({
  valor,
  enCurso,
  onGuardar,
  onCancelar,
}: {
  valor: number;
  enCurso: boolean;
  onGuardar: (valor: number) => void;
  onCancelar: () => void;
}) {
  const [texto, setTexto] = useState(comoTexto(valor));
  const [error, setError] = useState<string | null>(null);

  const confirmar = () => {
    const resultado = evaluarCelda(texto, valor);
    if (resultado.tipo === "rechazar") {
      setError(resultado.mensaje);
      return;
    }
    if (resultado.tipo === "guardar") onGuardar(resultado.numero);
    else onCancelar();
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <Input
        autoFocus
        inputMode="decimal"
        aria-label="Valor corregido en MMPCED"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmar();
          if (e.key === "Escape") onCancelar();
        }}
        className="h-7 w-24 text-right font-mono text-xs tabular-nums"
      />
      <Button size="xs" disabled={enCurso} onClick={confirmar}>
        Guardar
      </Button>
      <Button size="xs" variant="outline" disabled={enCurso} onClick={onCancelar}>
        Cancelar
      </Button>
      {error ? (
        <span className="text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}

interface FilaVista {
  clave: string;
  valor: number;
  hora: string | null;
  /** Quién fijó ese valor. */
  usuario: string | null;
  /** Cuándo se fijó, en ISO. */
  cuando: string | null;
  /** Quién corrigió después este valor del historial, y cuándo. */
  editadoPor: string | null;
  editadoEn: string | null;
  vigente: boolean;
  /** Sólo en las filas del historial: el vigente no se puede marcar. */
  historialId?: string;
}

/**
 * El recorrido completo del valor, del más nuevo al más viejo: primero el
 * vigente y después cada valor que fue reemplazado.
 *
 * El vigente no tiene fila de historial propia —el historial guarda los
 * valores *anteriores*— así que sus dos columnas de "cuándo" y "quién" se
 * arman aparte: **quién** sale de la lectura vigente, y **cuándo** del
 * `modificadoEn` de la corrección más reciente, que es exactamente el momento
 * en que el valor actual entró a regir. Una lectura que nunca se corrigió no
 * tiene de dónde sacar esa fecha (la tabla no guarda cuándo se creó la fila),
 * y ahí la columna queda en "—".
 */
function comoFilas(
  valorActual: number,
  horaActual: string | null,
  usuarioActual: string | null,
  editadoPorActual: string | null,
  editadoEnActual: string | null,
  entradas: HistorialEntryDto[],
): FilaVista[] {
  return [
    {
      clave: "vigente",
      valor: valorActual,
      hora: horaActual,
      usuario: usuarioActual,
      cuando: entradas[0]?.modificadoEn ?? null,
      editadoPor: editadoPorActual,
      editadoEn: editadoEnActual,
      vigente: true,
    },
    ...entradas.map((h) => ({
      clave: h.id,
      valor: h.valorAnterior,
      hora: h.horaAnterior,
      usuario: h.usuarioNombre,
      cuando: h.modificadoEn,
      editadoPor: h.editadoPor,
      editadoEn: h.editadoEn,
      vigente: false,
      historialId: h.id,
    })),
  ];
}
