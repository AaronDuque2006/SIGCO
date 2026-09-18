/**
 * Los cuatro dominios del sistema son exactamente los cuatro departamentos del
 * catálogo `DEPARTAMENTO` (decisión #23), y por eso `nombre` tiene que coincidir
 * carácter por carácter con lo sembrado: es la clave contra la que se compara
 * `UsuarioSesionDto.departamentosQueEdita` para saber si la persona entra a
 * cargar datos o sólo a mirarlos (decisión #22).
 *
 * Va como constante y no como consulta porque todavía no existe el endpoint de
 * catálogos del §11. Cuando exista, esto sale de ahí.
 */
export interface Dominio {
  nombre: string;
  descripcion: string;
  /** `null` mientras el dominio no tenga backend ni pantallas. */
  ruta: string | null;
}

export const DOMINIOS: Dominio[] = [
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
