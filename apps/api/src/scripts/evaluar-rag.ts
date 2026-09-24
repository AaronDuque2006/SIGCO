/**
 * Evalúa el asistente contra un set de preguntas reales (CONTEXTO_PROYECTO.md
 * §16.9). Correrlo antes y después de tocar el modelo, el troceo, la búsqueda
 * o el prompt: es lo que dice si el cambio mejoró.
 *
 *   pnpm --filter api run evaluar-rag                  # sólo la búsqueda (~1 min)
 *   pnpm --filter api run evaluar-rag -- --respuestas  # también las respuestas (~1 min por pregunta)
 *   pnpm --filter api run evaluar-rag -- otra-planilla.xlsx
 *
 * El set vive en `archivos-fuente/rag/preguntas.xlsx` (gitignored: cita
 * contenido de los manuales); la hoja "Cómo llenarla" explica las columnas.
 * En "Dato clave", ";" separa datos que tienen que estar todos y "|"
 * alternativas válidas para uno mismo ("2022 | 2017").
 *
 * Dos capas, porque fallan por motivos distintos:
 *   - Búsqueda: ¿la slide que responde está entre las 5 primeras? Si no, el
 *     modelo no tiene con qué contestar.
 *   - Respuesta (con --respuestas): ¿aparece el dato clave?, ¿la cita apunta a
 *     esa slide?, ¿las fuera de tema dicen "no lo encuentro"? Lo que no se
 *     puede decidir solo —las explicaciones, si inventa— queda como "Revisar"
 *     en una planilla de resultados, con una columna vacía para la revisión
 *     humana.
 */
import path from "node:path";
import XLSX from "xlsx";
import { consultaRagService, NO_LO_ENCUENTRO } from "../modules/rag/services/consulta-rag.service.js";

const argumentos = process.argv.slice(2);
const CON_RESPUESTAS = argumentos.includes("--respuestas");
const RUTA = argumentos.find((a) => !a.startsWith("--")) ?? "../../archivos-fuente/rag/preguntas.xlsx";
const K = 5;

type Tipo = "Dato puntual" | "Definición" | "Explicación" | "Novedad" | "Fuera de tema";

interface Pregunta {
  pregunta: string;
  tipo: Tipo;
  slides: number[];
  claves: string[];
}

function leerPlanilla(ruta: string): Pregunta[] {
  const libro = XLSX.readFile(ruta);
  const hoja = libro.Sheets["Preguntas"] ?? libro.Sheets[libro.SheetNames[0]!]!;
  return XLSX.utils
    .sheet_to_json<Record<string, unknown>>(hoja, { defval: "" })
    .map((f) => ({
      pregunta: String(f["Pregunta"] ?? "").trim(),
      tipo: String(f["Tipo"] ?? "Dato puntual").trim() as Tipo,
      slides: String(f["Slide(s)"] ?? "")
        .split(/[/,]/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0),
      claves: String(f["Dato clave"] ?? "")
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean),
    }))
    .filter((p) => p.pregunta);
}

// Para comparar el dato clave: sin tildes ni mayúsculas, y "0.46" igual a
// "0,46" (el manual usa coma; el modelo a veces escribe punto).
const normalizar = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/(\d)\.(\d)/g, "$1,$2")
    .replace(/\s+/g, " ");

interface Resultado {
  pregunta: Pregunta;
  posicion: number | null;
  respuesta?: string;
  citadas?: string;
  claveOk?: boolean | null;
  citaOk?: boolean | null;
  veredicto?: string;
  segundos?: number;
}

async function evaluarRespuesta(p: Pregunta, r: Resultado): Promise<void> {
  const inicio = Date.now();
  let texto = "";
  const fuentes = new Map<number, { origen: number | null; novedad: boolean }>();
  for await (const e of consultaRagService.responder(p.pregunta, 0, new AbortController().signal, { auditar: false })) {
    if (e.tipo === "fuentes") e.fuentes.forEach((f) => fuentes.set(f.n, { origen: f.origen, novedad: !!f.novedadId }));
    if (e.tipo === "texto") texto += e.texto;
    if (e.tipo === "error") texto = `[ERROR] ${e.mensaje}`;
  }
  r.respuesta = texto.trim();
  r.segundos = Math.round((Date.now() - inicio) / 1000);

  const citas = [...new Set([...texto.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])))].map((n) => fuentes.get(n)).filter(Boolean);
  r.citadas = citas.map((c) => (c!.novedad ? "novedad" : `slide ${c!.origen}`)).join(", ");

  const negado = normalizar(texto).includes(normalizar(NO_LO_ENCUENTRO).replace(/\.$/, ""));
  // Cada dato clave puede traer alternativas separadas por "|": un gasoducto
  // con dos tramos de 30" tiene dos años de puesta en servicio válidos.
  r.claveOk = p.claves.length
    ? p.claves.every((c) => c.split("|").some((alt) => normalizar(texto).includes(normalizar(alt.trim()))))
    : null;
  r.citaOk = p.slides.length
    ? citas.some((c) => p.slides.includes(c!.origen ?? -1))
    : p.tipo === "Novedad"
      ? citas.some((c) => c!.novedad)
      : null;

  // "No respondió" sólo si además falta el dato: la regla 3 del prompt le
  // pide dar lo que tiene y decir qué falta, así que "N50 […] No lo encuentro
  // para la planta nueva" es una respuesta, no una negativa.
  if (p.tipo === "Fuera de tema") r.veredicto = negado ? "Correcta" : "Incorrecta: respondió algo fuera de tema";
  else if (negado && !r.claveOk) r.veredicto = "No respondió";
  else if (p.tipo === "Explicación" || r.claveOk === null) r.veredicto = "Revisar";
  else if (r.claveOk && r.citaOk !== false) r.veredicto = "Correcta";
  else if (r.claveOk) r.veredicto = "Parcial: dato correcto, cita a otra fuente";
  else r.veredicto = "Incorrecta: falta el dato clave";
}

function guardarInforme(resultados: Resultado[]): string {
  const filas = resultados.map((r) => ({
    Pregunta: r.pregunta.pregunta,
    Tipo: r.pregunta.tipo,
    "Slide esperada": r.pregunta.slides.join(" / "),
    "Búsqueda: posición": r.pregunta.slides.length ? (r.posicion ?? "no aparece") : "",
    Respuesta: r.respuesta ?? "",
    "Fuentes citadas": r.citadas ?? "",
    "Dato clave": r.pregunta.claves.join("; "),
    "¿Aparece?": r.claveOk === null || r.claveOk === undefined ? "" : r.claveOk ? "Sí" : "No",
    "¿Cita la fuente?": r.citaOk === null || r.citaOk === undefined ? "" : r.citaOk ? "Sí" : "No",
    Veredicto: r.veredicto ?? "",
    "Revisión humana: ¿inventa algo?": "",
    Segundos: r.segundos ?? "",
  }));
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [60, 13, 10, 10, 80, 18, 20, 9, 9, 30, 30, 9].map((wch) => ({ wch }));
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Resultados");
  const sello = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const ruta = path.join(path.dirname(RUTA), `resultados-${sello}.xlsx`);
  XLSX.writeFile(libro, ruta);
  return ruta;
}

async function main(): Promise<void> {
  const preguntas = leerPlanilla(RUTA);
  const resultados: Resultado[] = [];

  // ── Búsqueda ──
  const conSlide = preguntas.filter((p) => p.slides.length);
  let primeras = 0;
  let entreK = 0;
  let mrr = 0;
  for (const p of preguntas) {
    const r: Resultado = { pregunta: p, posicion: null };
    if (p.slides.length) {
      const recuperados = await consultaRagService.recuperar(p.pregunta, K);
      const i = recuperados.findIndex((c) => p.slides.includes(c.origenDesde ?? -1));
      if (i >= 0) {
        r.posicion = i + 1;
        entreK++;
        mrr += 1 / (i + 1);
        if (i === 0) primeras++;
      } else {
        console.log(`  no aparece: ${p.pregunta}  (esperaba ${p.slides.join("/")}, trajo ${recuperados.map((c) => c.origenDesde ?? "novedad").join(",")})`);
      }
    }
    resultados.push(r);
  }
  const n = conSlide.length;
  console.log(`Búsqueda: ${n} preguntas con slide · primera ${primeras}/${n} · entre las ${K} primeras ${entreK}/${n} · MRR ${(mrr / n).toFixed(2)}`);

  if (!CON_RESPUESTAS) return;

  // ── Respuestas ──
  console.log(`\nRespuestas: ${preguntas.length} preguntas, cerca de un minuto cada una…`);
  for (const [i, r] of resultados.entries()) {
    await evaluarRespuesta(r.pregunta, r);
    console.log(`  [${i + 1}/${resultados.length}] ${r.veredicto} (${r.segundos} s) — ${r.pregunta.pregunta}`);
  }
  const cuenta = (v: string) => resultados.filter((r) => r.veredicto?.startsWith(v)).length;
  console.log(
    `\nRespuestas: ${cuenta("Correcta")} correctas · ${cuenta("Parcial")} parciales · ${cuenta("Incorrecta")} incorrectas · ` +
      `${cuenta("No respondió")} sin respuesta · ${cuenta("Revisar")} para revisar a mano`,
  );
  console.log(`Informe: ${guardarInforme(resultados)}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
