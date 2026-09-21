// Regenera estaciones.seed.ts desde el inventario real. Requiere el paquete
// `xlsx` y archivos-fuente/ (gitignored).
//   node packages/db/prisma/tools/generar-estaciones.js
//
// Fuente: "INVENTARIO ESTACIONES.xls", hoja "Hoja1" (251 filas, 24 columnas).
// Produce el catálogo de áreas operacionales, los 16 tipos de instrumento ISA,
// las 247 estaciones y sus cantidades de instrumentos.

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const RUTA = path.join(__dirname, "../../../../archivos-fuente/INVENTARIO ESTACIONES.xls");
const SALIDA = path.join(__dirname, "../estaciones.seed.ts");

// Las 6 regiones del inventario escritas como las siembra seed.ts.
const REGIONES = {
  "NOR ORIENTE": "Nor-Oriente",
  "ESTE ORIENTE": "Este-Oriente",
  "SUR ORIENTE": "Sur-Oriente",
  CENTRO: "Centro",
  "CENTRO OCCIDENTE": "Centro-Occidente",
  OCCIDENTE: "Occidente",
};

// Nombres de área tal como los escribe la hoja "OBSERVACION" del reporte
// semanal, que es donde se publican. El inventario los abrevia.
const AREAS = {
  ANACO: "Anaco",
  "PUERTO ORDAZ": "Puerto Ordaz",
  MATURIN: "Maturín",
  CARUPANO: "Carúpano",
  CUMANA: "Cumaná",
  "GÜIRIA": "Güiria",
  MARGARITA: "Margarita",
  "PUERTO CRUZ": "Puerto La Cruz",
  ALTAGRACIA: "Altagracia",
  METROPOLITANA: "Dist. Metropolitana",
  "EL CUJI": "El Cují",
  CHARALLAVE: "Charallave",
  CORO: "Coro",
  "COSTA ESTE": "Costa Este",
  "COSTA OESTE": "Costa Oeste",
  "TRANSCARIBEÑO": "Transcaribeño",
  CCO: "Costa Centro Occidental",
  LARA: "Lara",
  CARABOBO: "Carabobo",
  ARAGUA: "Aragua",
};

// Las 16 columnas de instrumento, con las abreviaturas del archivo expandidas y
// el typo real "M ULTASONICO" corregido. Mismo criterio que el resto del seed.
const INSTRUMENTOS = {
  PRESION: "Presión",
  TEMPERATURA: "Temperatura",
  PDT: "PDT",
  "VAL PRINCIPAL": "Válvula principal",
  "VAL INTERCONEXION": "Válvula de interconexión",
  "VAL TRAMPA": "Válvula de trampa",
  "VAL MANUAL": "Válvula manual",
  PIGSIG: "PIGSIG",
  "I/P": "I/P",
  "VAL REG ELECT": "Válvula reguladora eléctrica",
  "VAL REG NEUM": "Válvula reguladora neumática",
  "M TURBINA": "Medidor de turbina",
  "M ULTASONICO": "Medidor ultrasónico",
  "PLACA ORI": "Placa de orificio",
  VORTEX: "Vortex",
  SEPARADOR: "Separador",
};

const limpiar = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

const wb = XLSX.readFile(RUTA);
const filas = XLSX.utils.sheet_to_json(wb.Sheets["Hoja1"], { header: 1, raw: false, defval: "" });
const head = filas[0].map(limpiar);
const idx = (n) => {
  const i = head.indexOf(n);
  if (i < 0) throw new Error(`falta la columna "${n}" en el inventario`);
  return i;
};
const C = {
  region: idx("REGION"),
  area: idx("AREA"),
  estacion: idx("ESTACION"),
  nodo: idx("NODO"),
  enlace: idx("TIPO ENLACE COM"),
  t: idx("T"),
  d: idx("D"),
};

const crudas = filas.slice(1).filter((r) => limpiar(r[C.estacion]));

// Cuatro estaciones de Altagracia vienen dos veces: una con su nombre real y
// otra con el nodo repetido como nombre. Se descarta la que no aporta nombre.
const porNodo = new Map();
for (const r of crudas) {
  const nodo = limpiar(r[C.nodo]).toUpperCase();
  const nombre = limpiar(r[C.estacion]);
  const previa = porNodo.get(nodo);
  if (previa && nombre.toUpperCase() === nodo) continue;
  if (previa && limpiar(previa[C.estacion]).toUpperCase() !== nodo) continue;
  porNodo.set(nodo, r);
}

const descartadas = crudas.length - porNodo.size;
const areasVistas = new Map();
const estaciones = [];

for (const [nodo, r] of porNodo) {
  const regionCruda = limpiar(r[C.region]).toUpperCase();
  const areaCruda = limpiar(r[C.area]).toUpperCase();
  const region = REGIONES[regionCruda];
  const area = AREAS[areaCruda];
  if (!region) throw new Error(`región desconocida: "${regionCruda}"`);
  if (!area) throw new Error(`área desconocida: "${areaCruda}"`);
  if (!areasVistas.has(area)) areasVistas.set(area, region);

  const enlace = limpiar(r[C.enlace]).toUpperCase();
  if (!["IP PDVSA", "SATELITAL", "SERIAL PDVSA"].includes(enlace))
    throw new Error(`enlace desconocido en ${nodo}: "${enlace}"`);

  const t = limpiar(r[C.t]).toUpperCase() === "X";
  const d = limpiar(r[C.d]).toUpperCase() === "X";
  if (t && d) throw new Error(`${nodo} marcada como transporte y distribución a la vez`);

  const instrumentos = {};
  for (const [col, nombre] of Object.entries(INSTRUMENTOS)) {
    const n = Number(limpiar(r[idx(col)]));
    if (Number.isFinite(n) && n > 0) instrumentos[nombre] = n;
  }

  estaciones.push({
    nodo,
    nombre: limpiar(r[C.estacion]),
    area,
    region,
    tipoEnlaceCom: enlace,
    tipoRed: t ? "TRANSPORTE" : d ? "DISTRIBUCION" : null,
    instrumentos,
  });
}

estaciones.sort((a, b) => a.region.localeCompare(b.region) || a.area.localeCompare(b.area) || a.nodo.localeCompare(b.nodo));
const areas = [...areasVistas.entries()]
  .map(([nombre, region]) => ({ nombre, region }))
  .sort((a, b) => a.region.localeCompare(b.region) || a.nombre.localeCompare(b.nombre));

const ts = `// GENERADO por tools/generar-estaciones.js desde "INVENTARIO ESTACIONES.xls"
// (hoja Hoja1). No editar a mano: editar el generador y volver a correrlo.
//
// ${estaciones.length} estaciones, ${areas.length} áreas operacionales y ${Object.keys(INSTRUMENTOS).length} tipos de instrumento.
// Del archivo se descartaron ${descartadas} filas duplicadas (cuatro estaciones de
// Altagracia listadas dos veces, la segunda con el nodo repetido como nombre).
// Las abreviaturas de instrumento se expandieron y se corrigió el typo real
// "M ULTASONICO". \`tipoRed\` es null en las 3 estaciones que el inventario no
// clasifica ni como transporte ni como distribución.

export interface AreaSeed {
  nombre: string;
  region: string;
}

export interface EstacionSeed {
  nodo: string;
  nombre: string;
  area: string;
  region: string;
  tipoEnlaceCom: string;
  tipoRed: "TRANSPORTE" | "DISTRIBUCION" | null;
  instrumentos: Record<string, number>;
}

export const TIPOS_INSTRUMENTO_SEED: string[] = ${JSON.stringify(Object.values(INSTRUMENTOS), null, 2)};

export const AREAS_SEED: AreaSeed[] = ${JSON.stringify(areas, null, 2)};

export const ESTACIONES_SEED: EstacionSeed[] = ${JSON.stringify(estaciones, null, 2)};
`;

fs.writeFileSync(SALIDA, ts);

const porRed = estaciones.reduce((a, e) => ((a[e.tipoRed ?? "sin clasificar"] = (a[e.tipoRed ?? "sin clasificar"] || 0) + 1), a), {});
console.log(`filas leídas: ${crudas.length}  duplicadas descartadas: ${descartadas}  estaciones: ${estaciones.length}`);
console.log(`áreas: ${areas.length}  tipos de instrumento: ${Object.keys(INSTRUMENTOS).length}`);
console.log(`tipo de red: ${JSON.stringify(porRed)}`);
console.log(`instrumentos instalados: ${estaciones.reduce((a, e) => a + Object.values(e.instrumentos).reduce((x, y) => x + y, 0), 0)}`);
console.log(`escrito: ${SALIDA}`);
