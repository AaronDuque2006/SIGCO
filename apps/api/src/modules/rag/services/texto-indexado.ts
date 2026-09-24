/**
 * Lo que se indexa (embedding y full-text) no es exactamente lo que se
 * muestra: se expanden las abreviaturas del corpus para que una pregunta
 * escrita como la haría una persona las encuentre. La medición del 2026-09-24
 * perdió "gasoducto de 30 pulgadas" porque el manual dice `GDTO 30"`.
 *
 * Se aplica igual a los chunks y a la pregunta, así las dos quedan en el
 * mismo vocabulario.
 */
export function paraIndexar(texto: string): string {
  return texto
    .replace(/\bGDTOS?\b\.?/gi, (m) => (/s/i.test(m) ? "Gasoductos" : "Gasoducto"))
    .replace(/(\d)\s*(?:"|”|″|'')/g, "$1 pulgadas");
}
