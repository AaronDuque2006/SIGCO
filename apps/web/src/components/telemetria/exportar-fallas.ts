import type { AreaMttoDto, FallaEstacionDto } from "@sicog/shared-types";
import { exportarLibroExcel, type HojaExcel } from "@/lib/exportar-excel";
import { formatearFecha } from "@/lib/mantenimiento";

/**
 * La bitácora de fallas a Excel, **una hoja por región** y un resumen al
 * principio (pedido del owner el 2026-09-25, decisión #115). Entra lo que
 * deja el filtro de la pantalla, todas las páginas y no sólo la visible.
 *
 * Van **las seis regiones siempre**, aunque alguna no tenga fallas con ese
 * filtro: una región sin hoja se leería como "no la exportaron", y una hoja
 * vacía dice lo que de verdad pasó.
 *
 * Los días de caída van como número y no con `formatearDiasCaida`: en Excel
 * la gente los suma, los ordena y los filtra, y "3 años" no se deja.
 */

const COLUMNAS = [
  { encabezado: "Nodo", ancho: 12 },
  { encabezado: "Estación", ancho: 32 },
  { encabezado: "Área", ancho: 20 },
  { encabezado: "Red", ancho: 13 },
  { encabezado: "Causa", ancho: 26 },
  { encabezado: "Desde", ancho: 12 },
  { encabezado: "Resuelta el", ancho: 12 },
  { encabezado: "Días de caída", ancho: 13 },
  { encabezado: "Estado", ancho: 10 },
  { encabezado: "Registrada por", ancho: 20 },
  { encabezado: "Observación", ancho: 48 },
];

const RED = { TRANSPORTE: "Transporte", DISTRIBUCION: "Distribución" } as const;

const filaDeFalla = (f: FallaEstacionDto) => [
  f.estacion.nodo,
  f.estacion.nombre,
  f.estacion.area.nombre,
  f.estacion.tipoRed ? RED[f.estacion.tipoRed] : null,
  f.causaFalla.nombre,
  formatearFecha(f.desde),
  f.resueltaEn ? formatearFecha(f.resueltaEn) : null,
  f.diasCaida,
  f.resueltaEn ? "Resuelta" : "Abierta",
  f.registradaPor.nombre,
  f.observacion,
];

/** Promedio con un decimal; vacío cuando no hay de qué promediar. */
const promedio = (valores: number[]): number | null =>
  valores.length ? Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10 : null;

export function exportarFallasPorRegion({
  fallas,
  areas,
  filtroDescrito,
  fecha,
}: {
  fallas: FallaEstacionDto[];
  /** Las regiones salen del catálogo de áreas, que ya trae la de cada una. */
  areas: AreaMttoDto[];
  /** El filtro de la pantalla en palabras, para que el archivo diga qué es. */
  filtroDescrito: string;
  fecha: string;
}): void {
  const regiones = [...new Map(areas.map((a) => [a.region.id, a.region])).values()].sort(
    (a, b) => a.id - b.id,
  );

  // Dentro de cada región, primero las abiertas y las que más tiempo llevan:
  // es el orden en que el área las atiende.
  const orden = (a: FallaEstacionDto, b: FallaEstacionDto) =>
    Number(a.resueltaEn !== null) - Number(b.resueltaEn !== null) || b.diasCaida - a.diasCaida;

  const porRegion = regiones.map((r) => ({
    region: r,
    fallas: fallas.filter((f) => f.estacion.region.id === r.id).sort(orden),
  }));

  const filaResumen = (nombre: string, lista: FallaEstacionDto[]) => {
    const abiertas = lista.filter((f) => f.resueltaEn === null);
    return [
      nombre,
      abiertas.length,
      lista.length - abiertas.length,
      lista.length,
      promedio(abiertas.map((f) => f.diasCaida)),
    ];
  };

  const preambulo = [
    `Bitácora de fallas — SICOG · generado el ${formatearFecha(fecha)}`,
    `Filtro: ${filtroDescrito}`,
  ];

  const resumen: HojaExcel = {
    nombre: "Resumen",
    preambulo,
    columnas: [
      { encabezado: "Región", ancho: 22 },
      { encabezado: "Abiertas", ancho: 10 },
      { encabezado: "Resueltas", ancho: 10 },
      { encabezado: "Total", ancho: 10 },
      { encabezado: "Días promedio caída (abiertas)", ancho: 28 },
    ],
    filas: [
      ...porRegion.map(({ region, fallas: lista }) => filaResumen(region.nombre, lista)),
      filaResumen("Total nacional", fallas),
    ],
  };

  exportarLibroExcel(`fallas-por-region-${fecha}.xlsx`, [
    resumen,
    ...porRegion.map(({ region, fallas: lista }) => ({
      nombre: region.nombre,
      preambulo: [`${region.nombre} — ${lista.length} falla${lista.length === 1 ? "" : "s"}`, `Filtro: ${filtroDescrito}`],
      columnas: COLUMNAS,
      filas: lista.map(filaDeFalla),
    })),
  ]);
}
