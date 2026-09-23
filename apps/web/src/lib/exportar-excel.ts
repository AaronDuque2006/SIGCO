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
  columnas: { encabezado: string; ancho?: number }[],
  filas: (string | number | null)[][],
): void {
  const hoja = XLSX.utils.aoa_to_sheet([columnas.map((c) => c.encabezado), ...filas]);
  hoja["!cols"] = columnas.map((c) => ({ wch: c.ancho ?? 16 }));

  const libro = XLSX.utils.book_new();
  // El nombre de hoja de Excel tiene un tope de 31 caracteres y no admite
  // algunos símbolos; se recorta acá para no delegarle el error al navegador.
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja.slice(0, 31));
  XLSX.writeFile(libro, nombreArchivo);
}
