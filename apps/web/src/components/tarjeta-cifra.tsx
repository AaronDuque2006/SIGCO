import { formatearVolumen } from "@/lib/despacho";

/**
 * La tarjeta de una cifra, común a Balance Diario y a Reportes.
 *
 * Existía dos veces con escalas distintas: `text-xl` y `p-3` en una pantalla,
 * `text-2xl font-semibold` y `p-4` en la otra. La segunda además ponía la cifra
 * **por encima del título de vista**, que el sistema declara como techo de la
 * escala. Acá hay una sola, en el paso de la rampa que le corresponde.
 *
 * Va en `<dt>`/`<dd>` porque es exactamente eso: un rótulo y su valor. Quien la
 * use la envuelve en un `<dl>`.
 */
export function TarjetaCifra({
  titulo,
  valor,
  pie,
  tono,
  curva,
}: {
  titulo: string;
  valor: number;
  /** Debajo de la cifra: de dónde sale, o qué incluye. */
  pie: string;
  /** Sólo para valores que **son** un estado. Nunca decorativo. */
  tono?: "ok" | "warn";
  /** Una `Chispa` con la serie corta de esta misma cifra. Cabe acá adentro
   *  porque el alto de la pantalla le pertenece a la grilla. */
  curva?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <dt className="text-xs font-medium text-muted-foreground">{titulo}</dt>
      <dd
        className={`mt-0.5 font-mono text-xl tabular-nums ${
          tono === "ok" ? "text-ok" : tono === "warn" ? "text-warn" : ""
        }`}
      >
        {formatearVolumen(valor)}{" "}
        <span className="font-sans text-xs text-muted-foreground">MMPCED</span>
      </dd>
      {curva}
      <p className="mt-1 text-xs text-muted-foreground">{pie}</p>
    </div>
  );
}
