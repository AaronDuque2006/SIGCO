import { env } from "../../../shared/env.js";

/**
 * Lo único que el módulo necesita de un modelo de lenguaje. Los Services
 * dependen de esta interfaz y no de Ollama, igual que dependen de los
 * Repositories y no de Prisma.
 */
export interface IModeloLenguaje {
  /** Un vector normalizado por texto, en el mismo orden. */
  embeber(textos: string[], uso: "documento" | "consulta"): Promise<number[][]>;
  /** La respuesta de a pedazos, a medida que el modelo la genera. */
  conversar(mensajes: MensajeChat[], senal: AbortSignal): AsyncGenerator<string>;
}

export interface MensajeChat {
  role: "system" | "user" | "assistant";
  content: string;
}

// nomic-embed-text exige estos prefijos: sin ellos la medición del 2026-09-24
// bajó de MRR 0,82 a 0,78.
const PREFIJO = { documento: "search_document: ", consulta: "search_query: " } as const;
const LOTE_EMBEDDINGS = 16;

const normalizar = (v: number[]): number[] => {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
};

export class OllamaClient implements IModeloLenguaje {
  async embeber(textos: string[], uso: "documento" | "consulta"): Promise<number[][]> {
    const salida: number[][] = [];
    for (let i = 0; i < textos.length; i += LOTE_EMBEDDINGS) {
      const lote = textos.slice(i, i + LOTE_EMBEDDINGS).map((t) => PREFIJO[uso] + t);
      const res = await fetch(`${env.OLLAMA_URL}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: env.RAG_MODELO_EMBEDDING, input: lote, truncate: true }),
      });
      if (!res.ok) throw new Error(`Ollama /api/embed respondió ${res.status}: ${await res.text()}`);
      const { embeddings } = (await res.json()) as { embeddings: number[][] };
      salida.push(...embeddings.map(normalizar));
    }
    return salida;
  }

  async *conversar(mensajes: MensajeChat[], senal: AbortSignal): AsyncGenerator<string> {
    const res = await fetch(`${env.OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.RAG_MODELO_CHAT,
        messages: mensajes,
        stream: true,
        // Sin modo de razonamiento: en los modelos que lo tienen (Qwen3), en
        // CPU sumaría minutos de "pensar" antes de la primera palabra. Los que
        // no lo tienen (Qwen2.5) ignoran el parámetro.
        think: false,
        // Baja temperatura: se le pide que repita lo que dicen los
        // fragmentos, no que sea creativo.
        // 4096 alcanza: con el presupuesto de 4.000 caracteres el prompt
        // entero ronda los 2.000 tokens. Con 8192 cada modelo reservaba ~1 GB
        // más de memoria, y Qwen3 8B no entraba en una máquina de 15 GB con
        // el resto del entorno abierto (oom-kill, 2026-09-24).
        options: { temperature: 0.1, num_ctx: 4096 },
      }),
      signal: senal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`Ollama /api/chat respondió ${res.status}: ${await res.text()}`);
    }

    // Ollama responde NDJSON: una línea JSON por pedazo.
    const decoder = new TextDecoder();
    let pendiente = "";
    for await (const bytes of res.body) {
      pendiente += decoder.decode(bytes as Uint8Array, { stream: true });
      const lineas = pendiente.split("\n");
      pendiente = lineas.pop() ?? "";
      for (const linea of lineas) {
        if (!linea.trim()) continue;
        const evento = JSON.parse(linea) as { message?: { content?: string }; done?: boolean };
        if (evento.message?.content) yield evento.message.content;
        if (evento.done) return;
      }
    }
  }
}

export const modeloLenguaje: IModeloLenguaje = new OllamaClient();
