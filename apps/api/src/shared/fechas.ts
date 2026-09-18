/**
 * Conversión entre el `YYYY-MM-DD` del cable y las columnas `@db.Date`.
 *
 * Todo se ancla a UTC para que `"2026-09-10"` vuelva como `"2026-09-10"` sin
 * corrimiento por la zona horaria del servidor. Es la representación decidida
 * una sola vez para toda la API (§11.1): el día operativo no tiene hora ni
 * zona, así que dejar que el servidor le ponga la suya lo movería de día.
 *
 * Vive en `shared/` y no dentro de Despacho porque es infraestructura del
 * formato de cable, no regla de negocio, y Actividades la necesita igual: que
 * un módulo la importara del otro sería mezclarlos.
 */
export const fechaToDate = (fecha: string): Date => new Date(`${fecha}T00:00:00.000Z`);
export const dateToFecha = (fecha: Date): string => fecha.toISOString().slice(0, 10);
