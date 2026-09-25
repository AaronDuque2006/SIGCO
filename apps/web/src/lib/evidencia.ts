import type { FuenteRagDto } from "@sicog/shared-types";

/**
 * Dónde está, dentro de cada fuente citada, la cifra que dio la respuesta.
 *
 * El asistente acierta cerca del 75% (CONTEXTO_PROYECTO.md §16.9): cuando se
 * equivoca, casi siempre es porque leyó el valor de la fila o la columna de
 * al lado. Mostrar el par "encabezado: valor" exacto de donde sale la cifra
 * deja ver ese error de un vistazo, sin abrir la fuente.
 *
 * Se trabaja por oración: una cifra se busca sólo en las fuentes que cita esa
 * misma oración, no en todas.
 */
export interface Evidencia {
  /** El primer par de la fila, que la identifica ("AÑO: Cardón"). */
  fila: string;
  /** Los pares cuyo valor coincide con una cifra de la respuesta ("2021: 476"). */
  pares: string[];
}

// Una cifra: "476", "0,46", "1168.1", "1.035.508". Los años también cuentan:
// "entró en servicio en 1970" se verifica igual que cualquier otro valor.
const CIFRA = /\d+(?:[.,]\d+)*/g;

/** "1.035.508" → 1035508; "0,46" → 0.46; "1168.1" → 1168.1. */
export function aNumero(texto: string): number | null {
  const t = texto.trim();
  let limpio: string;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) limpio = t.replace(/\./g, "").replace(",", ".");
  else limpio = t.replace(",", ".");
  const n = Number.parseFloat(limpio);
  return Number.isFinite(n) ? n : null;
}

/** El número con que empieza un valor de tabla: "6.66 MMPCED" → 6.66; "1100-1200" → null. */
function valorNumerico(valor: string): number | null {
  const m = /^\s*(\d+(?:[.,]\d+)*)(?:\s|$|%)/.exec(valor);
  return m ? aNumero(m[1]!) : null;
}

export function evidencias(respuesta: string, fuentes: FuenteRagDto[]): Map<number, Evidencia[]> {
  const porFuente = new Map<number, Evidencia[]>();
  const fuentePorN = new Map(fuentes.map((f) => [f.n, f]));

  for (const oracion of respuesta.split(/(?<=[.!?])\s+|\n+/)) {
    const citas = [...oracion.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    if (!citas.length) continue;
    const cifras = (oracion.replace(/\[\d+\]/g, "").match(CIFRA) ?? [])
      .map(aNumero)
      .filter((n): n is number => n !== null);
    if (!cifras.length) continue;

    for (const n of new Set(citas)) {
      const fuente = fuentePorN.get(n);
      if (!fuente) continue;
      // La primera línea es la cabecera del chunk (documento — sección).
      for (const linea of fuente.contenido.split("\n").slice(1)) {
        const pares = linea.split("; ");
        const coinciden = pares.filter((par) => {
          const i = par.indexOf(": ");
          if (i < 0) return false;
          const v = valorNumerico(par.slice(i + 2));
          return v !== null && cifras.includes(v);
        });
        if (!coinciden.length) continue;
        const lista = porFuente.get(n) ?? [];
        if (!lista.some((e) => e.fila === pares[0] && e.pares.join() === coinciden.join())) {
          lista.push({ fila: pares[0]!, pares: coinciden });
        }
        porFuente.set(n, lista);
      }
    }
  }
  return porFuente;
}
