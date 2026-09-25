/** Fecha de hoy en la zona de quien usa el sistema, no en UTC: el operador
 *  quiere "hoy acá", y la API trabaja con `YYYY-MM-DD` sin zona horaria.
 *  Un `toISOString()` daría la de UTC, que en Venezuela ya es mañana desde las
 *  20:00. Es de todos los dominios, por eso no vive en ninguno. */
export function hoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
