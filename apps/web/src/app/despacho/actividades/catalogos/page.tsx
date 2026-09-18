import { CatalogosActividades } from "@/components/actividades/catalogos";

/** Actividades de Despacho. Su catálogo arranca vacío —no existe planilla de
 *  origen como la de Mantenimiento (§9.2)— y lo carga el Supervisor desde el
 *  ABM de la propia sección. */
export default function Pagina() {
  return <CatalogosActividades departamento="Despacho" base="/despacho/actividades" />;
}
