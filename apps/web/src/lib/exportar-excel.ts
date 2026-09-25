import * as XLSX from "xlsx";

/**
 * Exporta una grilla a `.xlsx`, tal cual se ve en pantalla — mismas columnas,
 * mismo filtro aplicado. Se eligió Excel y no CSV a pedido del owner: casi
 * todos los nombres reales llevan tilde o ñ ("San Joaquín", "Cardón IV"), y
 * un CSV sin BOM se rompe con esos caracteres al abrirlo en Excel — el mismo
 * tipo de problema silencioso que el resto del sistema viene evitando.
 *
 * Se arma en el navegador con lo que la pantalla ya tiene cargado: no hace
 * falta un viaje al servidor, a diferencia del PDF de Reportes (ese sí
 * necesita repetir el layout visual de las gráficas, esto es sólo filas y
 * columnas).
 */
export function exportarExcel(
  nombreArchivo: string,
  nombreHoja: string,
  columnas: Columna[],
  filas: Celda[][],
): void {
  exportarLibroExcel(nombreArchivo, [{ nombre: nombreHoja, columnas, filas }]);
}

type Celda = string | number | null;

interface Columna {
  encabezado: string;
  ancho?: number;
}

export interface HojaExcel {
  nombre: string;
  /** Filas sueltas antes de la tabla (título, filtro aplicado…), con una en
   *  blanco de separación. */
  preambulo?: string[];
  columnas: Columna[];
  filas: Celda[][];
}

/** Un libro de varias hojas; `exportarExcel` es el caso de una sola. */
export function exportarLibroExcel(nombreArchivo: string, hojas: HojaExcel[]): void {
  const libro = XLSX.utils.book_new();
  const usados = new Set<string>();
  for (const h of hojas) {
    const preambulo = h.preambulo?.length ? [...h.preambulo.map((l) => [l]), []] : [];
    const hoja = XLSX.utils.aoa_to_sheet([...preambulo, h.columnas.map((c) => c.encabezado), ...h.filas]);
    hoja["!cols"] = h.columnas.map((c) => ({ wch: c.ancho ?? 16 }));
    XLSX.utils.book_append_sheet(libro, hoja, nombreHojaValido(h.nombre, usados));
  }
  XLSX.writeFile(libro, nombreArchivo);
}

/**
 * Excel topa el nombre de hoja en 31 caracteres, no admite `[]:*?/\` y no
 * acepta dos iguales; se corrige acá para no delegarle el error al navegador.
 */
function nombreHojaValido(nombre: string, usados: Set<string>): string {
  const base = nombre.replace(/[[\]:*?/\\]/g, "-").slice(0, 31) || "Hoja";
  let candidato = base;
  for (let i = 2; usados.has(candidato.toLowerCase()); i++) {
    candidato = `${base.slice(0, 31 - String(i).length - 1)} ${i}`;
  }
  usados.add(candidato.toLowerCase());
  return candidato;
}
