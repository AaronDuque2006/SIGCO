import {
  abrirZip,
  chunksDeTabla,
  decodificar,
  partirTexto,
  serializarTabla,
  todos,
  type ChunkCandidato,
} from "./comun.js";

// Estilos de título de Word en inglés y en español ("Heading1", "Ttulo1").
const ESTILO_TITULO = /<w:pStyle w:val="(Heading|Ttulo|Titulo|Title)\d*"/i;

// Muchos manuales armados a mano no usan estilos de título: el título es un
// párrafo corto en negrita ("SISTEMA ANACO – JOSE / PTO. LA CRUZ"). Así viene
// el "Manual contingencia 2024.docx", el primer docx real del corpus: sin
// esto, sus 221 chunks quedaban sin sección y la cita no decía de qué parte
// del manual salía el dato.
const LARGO_MAX_TITULO = 90;
const LARGO_MAX_SECCION = 120;
const NEGRITA = /<w:b(?:\s+w:val="(?:1|true|on)")?\s*\/>/;

function esTituloPorFormato(xml: string, texto: string): boolean {
  if (texto.length > LARGO_MAX_TITULO || /[.;,]$/.test(texto)) return false;
  // Todas las corridas con texto van en negrita.
  const corridas = todos(xml, /<w:r[ >][\s\S]*?<\/w:r>/g).filter((r) => /<w:t[ >]/.test(r));
  return corridas.length > 0 && corridas.every((r) => NEGRITA.test(r));
}

const textoDeParrafo = (xml: string): string =>
  decodificar(todos(xml, /<w:t(?: [^>]*)?>[^<]*<\/w:t>/g).map((t) => t.replace(/<[^>]+>/g, "")).join("")).trim();

/**
 * Word no tiene páginas en el XML (las calcula al mostrar), así que los chunks
 * de un docx se citan por sección, con `origenDesde` en null.
 */
export function parsearDocx(datos: Uint8Array, nombreDocumento: string): ChunkCandidato[] {
  const archivos = abrirZip(datos, (n) => n === "word/document.xml");
  const cuerpo = archivos["word/document.xml"];
  if (!cuerpo) return [];

  const chunks: ChunkCandidato[] = [];
  let seccion = "";
  let parrafos: string[] = [];
  // Títulos seguidos se leen como uno solo: "SUB-SISTEMA" + "ALTAGRACIA (N50)
  // – ARICHUNA (ARI)" es un único título partido en dos renglones.
  let ultimoFueTitulo = false;

  const volcarTexto = (): void => {
    if (parrafos.join(" ").length >= 80) {
      const encabezado = [nombreDocumento, seccion].filter(Boolean).join(" — ");
      for (const parte of partirTexto(parrafos)) {
        chunks.push({ tipo: "TEXTO", origenDesde: null, origenHasta: null, seccion: seccion || null, contenido: `${encabezado}\n${parte}` });
      }
    }
    parrafos = [];
  };

  // Párrafos y tablas del cuerpo, en orden. Los párrafos dentro de una tabla
  // se leen como parte de la tabla, no sueltos.
  for (const bloque of todos(cuerpo, /<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g)) {
    if (bloque.startsWith("<w:tbl>")) {
      ultimoFueTitulo = false;
      volcarTexto();
      const tabla = todos(bloque, /<w:tr[ >][\s\S]*?<\/w:tr>/g).map((tr) =>
        todos(tr, /<w:tc>[\s\S]*?<\/w:tc>/g).map((tc) =>
          todos(tc, /<w:p[ >][\s\S]*?<\/w:p>/g).map(textoDeParrafo).filter(Boolean).join(" "),
        ),
      );
      const serializada = serializarTabla(tabla);
      const cabecera = [nombreDocumento, seccion, ...serializada.titulos].filter(Boolean).join(" — ");
      for (const contenido of chunksDeTabla(serializada, cabecera)) {
        chunks.push({ tipo: "TABLA", origenDesde: null, origenHasta: null, seccion: seccion || null, contenido });
      }
      continue;
    }

    const texto = textoDeParrafo(bloque);
    if (!texto) continue;
    if (ESTILO_TITULO.test(bloque) || esTituloPorFormato(bloque, texto)) {
      volcarTexto();
      const limpio = texto.replace(/:$/, "");
      // Si la unión se vuelve un párrafo (cinco pies de figura seguidos), queda
      // sólo el último: una sección de 300 caracteres no ubica a nadie.
      const unido = `${seccion} ${limpio}`;
      seccion = ultimoFueTitulo && unido.length <= LARGO_MAX_SECCION ? unido : limpio;
      ultimoFueTitulo = true;
    } else {
      parrafos.push(texto);
      ultimoFueTitulo = false;
    }
  }
  volcarTexto();
  return chunks;
}
