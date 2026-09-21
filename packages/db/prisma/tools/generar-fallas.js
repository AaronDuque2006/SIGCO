// Regenera fallas.seed.ts desde el reporte semanal real. Requiere `xlsx` y
// archivos-fuente/ (gitignored).
//   node packages/db/prisma/tools/generar-fallas.js
//
// Fuente: "DISPON_SISUGAS_Semana_35.xls", hoja "OBSERVACION", que trae un
// bloque por región con las columnas Desde | Nodo | Estación | Causa | Obs.
// Son las 201 estaciones en falla que la hoja "DATOS Y GRAFICAS" publica como
// indicador de la semana 35.

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const RUTA = path.join(__dirname, "../../../../archivos-fuente/DISPON_SISUGAS_Semana_35.xls");
const SALIDA = path.join(__dirname, "../fallas.seed.ts");

// Los 5 valores reales de la columna, con el nombre que tienen en el catálogo.
const CAUSAS = {
  "AFECTACION POR HURTO": "Afectación por hurto",
  "SUMINISTRO ELECTRICO": "Suministro eléctrico",
  "ENLACE DE COMUNICACIÓN": "Enlace de comunicación",
  "SISTEMA DE CONTROL LOCAL": "Sistema de control local",
  "ESPERANDO REPORTE": "Esperando reporte",
};

const limpiar = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

/** Las fechas vienen como M/D/AA de Excel en texto. El año de dos dígitos es
 *  siempre 20xx: la falla más vieja del archivo arranca en 2011. */
function aFecha(texto) {
  const m = limpiar(texto).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const [, mes, dia, anioCrudo] = m;
  const anio = anioCrudo.length === 4 ? Number(anioCrudo) : 2000 + Number(anioCrudo);
  if (anio < 2000 || anio > 2100) return null;
  const f = new Date(Date.UTC(anio, Number(mes) - 1, Number(dia)));
  if (f.getUTCMonth() !== Number(mes) - 1 || f.getUTCDate() !== Number(dia)) return null;
  return f.toISOString().slice(0, 10);
}

const wb = XLSX.readFile(RUTA);
const filas = XLSX.utils.sheet_to_json(wb.Sheets["OBSERVACION"], { header: 1, raw: false, defval: "" });

const fallas = [];
const descartes = [];
let dentro = false;

for (const r of filas) {
  const c1 = limpiar(r[1]);
  if (c1 === "Desde") { dentro = true; continue; }
  if (c1 === "Accion") { dentro = false; continue; }
  if (!dentro) continue;

  const nodo = limpiar(r[2]).toUpperCase();
  const causaCruda = limpiar(r[4]).toUpperCase();
  // La hoja intercala su tabla de "Causas de Fallas / Cantidad" entre los
  // bloques; esas filas no tienen causa reconocible y se descartan.
  if (!nodo || !CAUSAS[causaCruda]) {
    if (nodo) descartes.push({ nodo, causa: causaCruda });
    continue;
  }

  fallas.push({
    nodo,
    estacion: limpiar(r[3]),
    causa: CAUSAS[causaCruda],
    desde: aFecha(r[1]),
    observacion: limpiar(r[5]) || null,
  });
}

// El archivo tiene una fila sin fecha de inicio. Sin `desde` no hay falla que
// ubicar en el tiempo, así que se le pone la fecha del reporte y se avisa.
const FECHA_REPORTE = "2026-08-28";
let sinFecha = 0;
for (const f of fallas) {
  if (!f.desde) { f.desde = FECHA_REPORTE; sinFecha += 1; }
}

const porCausa = fallas.reduce((a, f) => ((a[f.causa] = (a[f.causa] || 0) + 1), a), {});

const ts = `// GENERADO por tools/generar-fallas.js desde "DISPON_SISUGAS_Semana_35.xls"
// (hoja OBSERVACION). No editar a mano: editar el generador y volver a correrlo.
//
// Las ${fallas.length} estaciones en falla de la semana 35, que es el número que la hoja
// "DATOS Y GRAFICAS" publica como indicador. Todas van SIN resolver: son el
// estado con el que cierra el reporte.
//
// Reparto por causa: ${Object.entries(porCausa).map(([c, n]) => `${c} ${n}`).join(", ")}.
// ${sinFecha} fila(s) del archivo no traen fecha de inicio; se les puso la del reporte.

export interface FallaSeed {
  nodo: string;
  estacion: string;
  causa: string;
  desde: string;
  observacion: string | null;
}

export const FALLAS_SEED: FallaSeed[] = ${JSON.stringify(fallas, null, 2)};
`;

fs.writeFileSync(SALIDA, ts);

console.log(`fallas: ${fallas.length}  sin fecha: ${sinFecha}  descartadas: ${descartes.length}`);
console.log("por causa:", JSON.stringify(porCausa));
console.log(`nodos repetidos: ${fallas.length - new Set(fallas.map((f) => f.nodo)).size}`);
console.log(`escrito: ${SALIDA}`);
