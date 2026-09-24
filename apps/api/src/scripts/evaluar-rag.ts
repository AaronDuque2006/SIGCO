/**
 * Mide la recuperación del asistente contra un set de preguntas reales
 * (CONTEXTO_PROYECTO.md §16.9). Correrlo antes y después de tocar el modelo de
 * embeddings, el troceo o la búsqueda: es lo que dice si el cambio mejoró.
 *
 *   pnpm --filter api run evaluar-rag [ruta-del-set.json]
 *
 * El set vive en `archivos-fuente/rag/preguntas.json` (gitignored: cita
 * contenido de los manuales). Cada entrada es `{ "p": pregunta, "s": [slides
 * que la responden] }`, y el documento tiene que estar cargado y procesado.
 * Mide sólo la búsqueda, no la respuesta del modelo: una fuente que no se
 * recupera no la salva ningún prompt.
 */
import { readFileSync } from "node:fs";
import { chunkRagRepository } from "../modules/rag/repositories/chunk-rag.repository.js";
import { modeloLenguaje } from "../modules/rag/services/ollama.client.js";
import { paraIndexar } from "../modules/rag/services/texto-indexado.js";

const RUTA = process.argv[2] ?? "../../archivos-fuente/rag/preguntas.json";
const K = 5;

async function main(): Promise<void> {
  const preguntas = JSON.parse(readFileSync(RUTA, "utf8")) as { p: string; s: number[] }[];
  let primeras = 0;
  let entreK = 0;
  let mrr = 0;

  for (const { p, s } of preguntas) {
    const texto = paraIndexar(p);
    const [vector] = await modeloLenguaje.embeber([texto], "consulta");
    const recuperados = await chunkRagRepository.buscar(vector!, texto, K);
    const posicion = recuperados.findIndex((c) => s.includes(c.origenDesde ?? -1));
    if (posicion === 0) primeras++;
    if (posicion >= 0) {
      entreK++;
      mrr += 1 / (posicion + 1);
    } else {
      console.log(`  no aparece: ${p}  (esperaba ${s.join("/")}, trajo ${recuperados.map((c) => c.origenDesde ?? "novedad").join(",")})`);
    }
  }

  const n = preguntas.length;
  console.log(`${n} preguntas · primera ${primeras}/${n} · entre las ${K} primeras ${entreK}/${n} · MRR ${(mrr / n).toFixed(2)}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
