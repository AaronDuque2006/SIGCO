import { ReportesActividades } from "@/components/actividades/reportes";

/** Actividades de Mantenimiento. El módulo es transversal (decisión #9): la
 *  pantalla es la misma para los cuatro departamentos, y lo único que cambia
 *  es cuál. */
export default function Pagina() {
  return <ReportesActividades departamento="Mantenimiento" base="/mantenimiento" />;
}
