// Regenera clientes.seed.ts desde el Excel. Requiere el paquete `xlsx` y el
// archivo en archivos-fuente/ (gitignored). Uso: node generar-clientes.js

const XLSX = require("xlsx");
const fs = require("fs");

const RUTA = "/home/aaron/Documents/aaronduque-pasantias/SICOG/archivos-fuente/NUEVO BALANCE ACTUALIZADO.xlsm";
const wb = XLSX.readFile(RUTA, { cellFormula: true });
const ej = wb.Sheets["EJECUTIVO PUNTUAL"];
const cen = wb.Sheets["CEN-ORI"];
const rows = XLSX.utils.sheet_to_json(cen, { header: 1, raw: false, defval: "" });

// --- 1. Mapeo cliente -> region/sector, leído de las fórmulas del Excel ---
const porFormula = new Map();
let region = null;
for (let f = 50; f <= 80; f++) {
  const j = ej[`J${f}`], k = ej[`K${f}`], l = ej[`L${f}`];
  if (j && String(j.v).trim()) region = String(j.v).trim();
  if (!k || !l?.f || !region) continue;
  const sector = String(k.v).trim();
  for (const m of String(l.f).matchAll(/'CEN-ORI'!D(\d+)/g)) porFormula.set(Number(m[1]), { region, sector });
}

// --- 2. Filas excluidas por decisión del owner ---
const EXCLUIR = new Set([
  117, 118,               // RECAT SAN JOAQUIN y SJB: son FUENTE, no CLIENTE
  120,                    // TOT. DE CLIENT. MEDIDOS: subtotal
  141, 142, 143, 144,     // APORTE A EYP: transferencias entre sistemas
  156,                    // TRANSFERENCIA ICO-NURGAS: idem

]);

const SISTEMA_POR_ETIQUETA = {
  "ANACO-JOSE-ORIENTE": "Anaco - José - Puerto La Cruz - Sinorgas",
  "NOR ORIENTE /SINORGAS": "Anaco - José - Puerto La Cruz - Sinorgas",
  "PUERTO ORDAZ": "Anaco - Puerto Ordaz",
  "CENTRO-CARACAS": "Anaco - Caracas - Barquisimeto - Río Seco",
  "CENTRO/OCCIDENTE": "Anaco - Caracas - Barquisimeto - Río Seco",
  "COSTA OESTE": "Ulé - Amuay",
  "COSTA ESTE": "Ulé - Amuay",
  "ULE - AMUAY": "Ulé - Amuay",
  "ENTREGAS DIRECTAS OCC": "Ulé - Amuay",
};

const REGION_DB = { ORIENTE: "Oriente", CENTRO: "Centro", "CEN-OCC": "Centro-Occidente", OCC: "Occidente" };
const SECTOR_DB = {
  PETROLERO: "Petrolero", ELECTRICO: "Eléctrico", SIDERURGICO: "Siderúrgico",
  PETROQUIMICO: "Petroquímico", CEMENTO: "Cemento", OTROS: "Otros",
};

// --- 3. Recorrer la hoja ---
const clientes = [];
const descartes = [];
let etiqueta = null;
let ultimaRegionDelBloque = null;

rows.forEach((row, i) => {
  const n = i + 1;
  const nombre = String(row[2] || "").trim();
  const valor = String(row[3] || "").trim();
  if (nombre && String(row[4] || "").trim() === "CIERRE PROMEDIO") { etiqueta = nombre; return; }
  if (!etiqueta || nombre === "CLIENTES") return;
  if (!nombre || valor === "" || isNaN(Number(valor))) return;

  const deFormula = porFormula.get(n);
  // Si una fórmula de sector la referencia, el Excel la cuenta como consumo y
  // es un cliente, aunque se llame "TOTAL OTROS ..." (son bolsas, no subtotales).
  // El filtro por nombre sólo aplica a las filas que ninguna fórmula usa.
  if (!deFormula && /^TOTAL/i.test(nombre)) return;
  if (deFormula) ultimaRegionDelBloque = deFormula.region;

  if (EXCLUIR.has(n)) { descartes.push({ n, nombre, motivo: "excluido por decisión" }); return; }

  const sistema = SISTEMA_POR_ETIQUETA[etiqueta];
  if (!sistema) { descartes.push({ n, nombre, motivo: `etiqueta sin sistema: ${etiqueta}` }); return; }

  // Sin fórmula de sector -> "Otros": autogeneración/P.E. internas e industriales
  // en cero, que el Excel deja fuera de los totales por sector.
  const regionExcel = deFormula?.region ?? ultimaRegionDelBloque;
  const sectorExcel = deFormula?.sector ?? "OTROS";
  if (!regionExcel) { descartes.push({ n, nombre, motivo: "sin región" }); return; }

  clientes.push({
    nombre,
    sistema,
    region: REGION_DB[regionExcel],
    sector: SECTOR_DB[sectorExcel],
    derivado: !deFormula,
  });
});

const cabecera = `// GENERADO desde "NUEVO BALANCE ACTUALIZADO.xlsm" (hoja CEN-ORI).
// region y sector NO están inferidos por el nombre: salen de las fórmulas de
// "Consumo por Sectores" de la hoja EJECUTIVO PUNTUAL, que referencian celda por
// celda a cada cliente. Las filas marcadas \`derivado: true\` son las que el
// Excel deja fuera de todo sector (autogeneración e industriales en cero) y que
// por decisión del owner van a "Otros".
// Ver decisión #46 en CONTEXTO_PROYECTO.md.

export interface ClienteSeed {
  nombre: string;
  sistema: string;
  region: string;
  sector: string;
  derivado: boolean;
}

export const CLIENTES_SEED: ClienteSeed[] = ${JSON.stringify(clientes, null, 2)};
`;

fs.writeFileSync("/home/aaron/Documents/aaronduque-pasantias/SICOG/packages/db/prisma/clientes.seed.ts", cabecera);

console.log(`Clientes generados: ${clientes.length}`);
console.log(`  con region/sector de fórmula: ${clientes.filter((c) => !c.derivado).length}`);
console.log(`  derivados a "Otros":          ${clientes.filter((c) => c.derivado).length}`);
const porSistema = {};
for (const c of clientes) porSistema[c.sistema] = (porSistema[c.sistema] || 0) + 1;
console.log("\nPor sistema:"); for (const [s, n] of Object.entries(porSistema)) console.log(`  ${String(n).padStart(3)} ${s}`);
const porSector = {};
for (const c of clientes) porSector[c.sector] = (porSector[c.sector] || 0) + 1;
console.log("\nPor sector:"); for (const [s, n] of Object.entries(porSector)) console.log(`  ${String(n).padStart(3)} ${s}`);
console.log("\nDescartados:"); for (const d of descartes) console.log(`  ${String(d.n).padStart(4)} ${d.nombre.padEnd(46)} ${d.motivo}`);
