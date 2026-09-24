import { unzipSync } from "fflate";
import { ValidationError } from "../../../shared/errors.js";

/**
 * Lo que devuelve todo parser, sea cual sea el formato (§16.7 paso 3): una
 * lista de chunks candidatos, todavía sin embedding.
 */
export interface ChunkCandidato {
  tipo: "TEXTO" | "TABLA" | "IMAGEN";
  /** Slide, página u hoja. Null cuando el formato no tiene paginación (docx). */
  origenDesde: number | null;
  origenHasta: number | null;
  /** Para citar: "SISTEMA ANACO PUERTO ORDAZ — Data Técnica". */
  seccion: string | null;
  contenido: string;
}

// ── Zip ──────────────────────────────────────────────────────────────────────
// pptx, docx y xlsx son zips que el sistema no controla (§16.8). Sólo se
// extraen las entradas que el parser pide, y se corta antes de descomprimir si
// el tamaño declarado ya es desproporcionado: un zip bomb declara poco
// comprimido y muchísimo descomprimido.
const MAX_ENTRADAS = 5000;
const MAX_DESCOMPRIMIDO_BYTES = 200 * 1024 * 1024;
const MAX_RATIO = 200;

export function abrirZip(datos: Uint8Array, quiero: (nombre: string) => boolean): Record<string, string> {
  let entradas = 0;
  let total = 0;
  let archivos: Record<string, Uint8Array>;
  try {
    archivos = unzipSync(datos, {
      filter: (f) => {
        entradas++;
        if (entradas > MAX_ENTRADAS) throw new ValidationError("El archivo tiene demasiadas entradas");
        if (!quiero(f.name)) return false;
        total += f.originalSize;
        if (total > MAX_DESCOMPRIMIDO_BYTES || f.originalSize > Math.max(f.size, 1024) * MAX_RATIO) {
          throw new ValidationError("El archivo descomprimido es desproporcionado para su tamaño");
        }
        return true;
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError("El archivo no es un documento de Office válido");
  }
  const decoder = new TextDecoder();
  return Object.fromEntries(Object.entries(archivos).map(([n, b]) => [n, decoder.decode(b)]));
}

// ── XML ──────────────────────────────────────────────────────────────────────
// Los formatos de Office son XML con una estructura fija y conocida; alcanza
// con expresiones regulares acotadas, sin un parser XML completo.
const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export const decodificar = (s: string): string =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return ENTIDADES[e] ?? m;
  });

export const todos = (xml: string, re: RegExp): string[] => xml.match(re) ?? [];

// ── Tablas ───────────────────────────────────────────────────────────────────
// Cada fila se escribe "Encabezado: valor; …" para que el chunk tenga sentido
// suelto (§16.4). Las tablas del Manual DAO traen encabezados de hasta tres
// filas combinadas y agrupan filas dejando vacía la primera celda.
const TIENE_DIGITO = /\d/;
const esFilaTitulo = (fila: string[]): boolean => fila.filter(Boolean).length <= 1;

export interface TablaSerializada {
  titulos: string[];
  filas: string[];
}

export function serializarTabla(tabla: string[][]): TablaSerializada {
  const ncol = Math.max(0, ...tabla.map((f) => f.length));
  const filasCompletas = tabla.map((f) => [...f, ...Array<string>(ncol - f.length).fill("")]);

  let i = 0;
  const titulos: string[] = [];
  while (i < filasCompletas.length && esFilaTitulo(filasCompletas[i]!)) {
    const t = filasCompletas[i]!.find(Boolean);
    if (t) titulos.push(t);
    i++;
  }

  // Encabezado: la primera fila después de los títulos, más las siguientes sin
  // números (máximo tres). Las filas de datos casi siempre traen cifras.
  const encabezado: string[][] = [];
  if (i < filasCompletas.length) encabezado.push(filasCompletas[i++]!);
  while (
    i < filasCompletas.length &&
    encabezado.length < 3 &&
    !filasCompletas[i]!.some((c) => TIENE_DIGITO.test(c))
  ) {
    encabezado.push(filasCompletas[i++]!);
  }

  // Celdas combinadas: en las filas de encabezado superiores, una celda vacía
  // hereda la de su izquierda ("DIMENSIONES" cubre Longitud, Diámetro…). La
  // última fila no hereda: ahí un vacío es de verdad un vacío.
  const columnas = Array<string>(ncol).fill("");
  encabezado.forEach((fila, k) => {
    let previa = "";
    for (let j = 0; j < ncol; j++) {
      let v = fila[j]!;
      if (!v && k < encabezado.length - 1 && j > 0) v = previa;
      if (fila[j]) previa = fila[j]!;
      if (v && !columnas[j]!.includes(v)) columnas[j] = `${columnas[j]} ${v}`.trim();
    }
  });

  const filas: string[] = [];
  let grupo = "";
  for (const fila of filasCompletas.slice(i)) {
    if (!fila.some(Boolean)) continue;
    // La primera celda vacía es "igual que arriba".
    if (fila[0]) grupo = fila[0];
    const completa = fila[0] ? fila : [grupo, ...fila.slice(1)];
    filas.push(
      completa
        .map((v, j) => (v ? `${columnas[j] || `Columna ${j + 1}`}: ${v}` : ""))
        .filter(Boolean)
        .join("; "),
    );
  }
  return { titulos, filas };
}

/**
 * Los chunks de una tabla, de a FILAS_POR_CHUNK filas, cada una como
 * "Encabezado: valor; …". Es largo a propósito: se probó pasarle al modelo la
 * tabla compacta (encabezado una sola vez) y en las tablas anchas perdía la
 * alineación — a "¿cuánto mandó Cardón en 2021?" contestó el valor de 2020.
 * Con "2021: 476" no hay columna que contar.
 */
export function chunksDeTabla(tabla: TablaSerializada, cabecera: string): string[] {
  const salida: string[] = [];
  for (let i = 0; i < tabla.filas.length; i += FILAS_POR_CHUNK) {
    salida.push(`${cabecera}\n${tabla.filas.slice(i, i + FILAS_POR_CHUNK).join("\n")}`);
  }
  return salida;
}

// Dos filas: una fila de datos técnicos del Manual DAO son ~600 caracteres,
// y el modelo en CPU lee ~26 tokens/s. Con seis, un solo chunk se comía el
// presupuesto de contexto de la consulta (§16.5).
export const FILAS_POR_CHUNK = 2;
export const CARACTERES_POR_CHUNK_TEXTO = 1500;

/** Parte texto corrido por párrafos, sin cortar ninguno a la mitad. */
export function partirTexto(parrafos: string[], limite = CARACTERES_POR_CHUNK_TEXTO): string[] {
  const partes: string[] = [];
  let actual = "";
  for (const p of parrafos) {
    if (actual && actual.length + p.length > limite) {
      partes.push(actual.trim());
      actual = "";
    }
    actual += `${p}\n`;
  }
  if (actual.trim()) partes.push(actual.trim());
  return partes;
}
