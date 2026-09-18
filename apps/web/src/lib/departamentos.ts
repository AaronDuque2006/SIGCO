/**
 * Los cuatro departamentos del catálogo `DEPARTAMENTO` (decisión #23).
 *
 * En la arquitectura del proyecto se los llama **dominios** —Dominio A
 * Despacho, Dominio B Mantenimiento…— porque son particiones que no comparten
 * datos operativos. En la interfaz se los llama **departamentos**, que es como
 * los nombra el área: `PRODUCT.md` fija que la pantalla usa el vocabulario del
 * área sin traducir. Son la misma cosa con dos nombres, y el de afuera manda.
 *
 * `nombre` tiene que coincidir
 * carácter por carácter con lo sembrado: es la clave contra la que se compara
 * `UsuarioSesionDto.departamentosQueEdita` para saber si la persona entra a
 * cargar datos o sólo a mirarlos (decisión #22).
 *
 * Va como constante y no como consulta porque todavía no existe el endpoint de
 * catálogos del §11. Cuando exista, esto sale de ahí.
 */
export interface Departamento {
  nombre: string;
  descripcion: string;
  /** `null` mientras el departamento no tenga backend ni pantallas. */
  ruta: string | null;
}

export const DEPARTAMENTOS: Departamento[] = [
  {
    nombre: "Despacho",
    descripcion: "Balance diario, lecturas de fuentes, quema nacional y novedades operativas.",
    ruta: "/despacho",
  },
  {
    nombre: "Mantenimiento",
    descripcion: "Actividades y horas-hombre. Estaciones y telemetría, en desarrollo.",
    ruta: "/mantenimiento",
  },
  {
    nombre: "Análisis Operacional",
    descripcion: "Análisis y seguimiento del comportamiento operativo.",
    ruta: null,
  },
  {
    nombre: "Calidad de Gas",
    descripcion: "Control de las variables de calidad del gas entregado.",
    ruta: null,
  },
];
