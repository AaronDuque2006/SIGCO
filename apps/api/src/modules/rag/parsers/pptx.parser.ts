import {
  abrirZip,
  chunksDeTabla,
  decodificar,
  partirTexto,
  serializarTabla,
  todos,
  type ChunkCandidato,
} from "./comun.js";

// Una slide con más cajas de texto que esto es un esquema (§16.4): su
// significado está en la posición de las etiquetas, no en el orden de lectura.
// El Manual DAO tiene sus 11 esquemas entre 56 y 143 cajas; ninguna slide de
// texto o tabla pasa de 17.
const CAJAS_ESQUEMA = 40;

// Separadora de sección: "SISTEMA ANACO PUERTO ORDAZ / contenido", sin tabla.
const LARGO_MAX_SEPARADORA = 80;

interface Slide {
  numero: number;
  cajas: string[];
  tablas: string[][][];
}

const textoDeParrafos = (xml: string): string =>
  todos(xml, /<a:p>[\s\S]*?<\/a:p>/g)
    .map((p) => decodificar(todos(p, /<a:t>[^<]*<\/a:t>/g).map((t) => t.slice(5, -6)).join("")))
    .join("\n")
    .trim();

function leerSlide(xml: string, numero: number): Slide {
  const cajas = todos(xml, /<p:sp>[\s\S]*?<\/p:sp>/g).map(textoDeParrafos).filter(Boolean);
  const tablas = todos(xml, /<a:tbl>[\s\S]*?<\/a:tbl>/g).map((tbl) =>
    todos(tbl, /<a:tr[ >][\s\S]*?<\/a:tr>/g).map((tr) =>
      todos(tr, /<a:tc[ >][\s\S]*?<\/a:tc>/g).map((tc) => textoDeParrafos(tc).replace(/\n/g, " ")),
    ),
  );
  return { numero, cajas, tablas };
}

/** Las slides en el orden de la presentación, no en el de los nombres de archivo. */
function ordenDeSlides(archivos: Record<string, string>): string[] {
  const presentacion = archivos["ppt/presentation.xml"] ?? "";
  const rels = archivos["ppt/_rels/presentation.xml.rels"] ?? "";
  const destino = new Map(
    todos(rels, /<Relationship [^>]*>/g).map((r) => [
      /Id="([^"]+)"/.exec(r)?.[1] ?? "",
      /Target="([^"]+)"/.exec(r)?.[1] ?? "",
    ]),
  );
  const orden = todos(presentacion, /<p:sldId [^>]*>/g)
    .map((s) => destino.get(/r:id="([^"]+)"/.exec(s)?.[1] ?? ""))
    .filter((t): t is string => !!t)
    .map((t) => `ppt/${t.replace(/^\/?ppt\//, "")}`);
  if (orden.length) return orden;
  // Sin presentation.xml legible: por número de archivo.
  return Object.keys(archivos)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]));
}

export function parsearPptx(datos: Uint8Array, nombreDocumento: string): ChunkCandidato[] {
  const archivos = abrirZip(
    datos,
    (n) =>
      n === "ppt/presentation.xml" ||
      n === "ppt/_rels/presentation.xml.rels" ||
      /^ppt\/slides\/slide\d+\.xml$/.test(n),
  );

  const chunks: ChunkCandidato[] = [];
  let seccion = "";

  ordenDeSlides(archivos).forEach((ruta, indice) => {
    const xml = archivos[ruta];
    if (!xml) return;
    const slide = leerSlide(xml, indice + 1);
    const lineas = slide.cajas.flatMap((c) => c.split("\n")).map((l) => l.trim()).filter(Boolean);
    // La primera línea es el título sólo si es corta: en algunas slides la
    // primera caja ya es un párrafo ("Calidad del Gas: Es el conjunto…").
    const titulo = (lineas[0]?.length ?? 0) < LARGO_MAX_SEPARADORA ? lineas[0]! : "";
    const textoTotal = lineas.join("\n");

    if (slide.cajas.length <= 2 && !slide.tablas.length && textoTotal.length < LARGO_MAX_SEPARADORA) {
      if (titulo) seccion = titulo.replace(/\.$/, "");
      return;
    }

    const contexto = [seccion, titulo].filter(Boolean).join(" — ");
    const base = { origenDesde: slide.numero, origenHasta: slide.numero, seccion: contexto || null };

    // Esquema: no se indexa el texto crudo. Queda registrado, sin embedding,
    // hasta que alguien del área escriba su descripción (§16.4).
    if (slide.cajas.length > CAJAS_ESQUEMA) {
      chunks.push({ ...base, tipo: "IMAGEN", contenido: "" });
      return;
    }

    const encabezado = `${nombreDocumento} — ${contexto}`;
    for (const tabla of slide.tablas) {
      const serializada = serializarTabla(tabla);
      const { titulos } = serializada;
      const cabecera = titulos.length ? `${encabezado} — ${titulos.join(" / ")}` : encabezado;
      for (const contenido of chunksDeTabla(serializada, cabecera)) {
        chunks.push({ ...base, tipo: "TABLA", contenido });
      }
    }

    // Texto corrido: todo menos el título, que ya viaja en la cabecera.
    const parrafos = titulo ? lineas.slice(1) : lineas;
    if (parrafos.join(" ").length >= 150) {
      for (const parte of partirTexto(parrafos)) {
        chunks.push({ ...base, tipo: "TEXTO", contenido: `${encabezado}\n${parte}` });
      }
    }
  });

  return chunks;
}
