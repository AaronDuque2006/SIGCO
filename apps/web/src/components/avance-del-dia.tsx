/**
 * En qué punto va la jornada, para cualquier grilla que se digite de corrido.
 *
 * El progreso era una línea de texto tenue entre otras, y digitar el día es
 * **la** tarea del producto: terminar no producía ninguna señal, así que la
 * jornada no tenía cierre. Acá la cifra queda en primer plano y la barra la
 * hace legible sin leer.
 *
 * Sobrio a propósito: dos píxeles de alto y ningún color de estado hasta que
 * está completo. El verde al final es el único momento en que la pantalla dice
 * "listo", y por eso vale.
 */
export function AvanceDelDia({
  cargadas,
  total,
  sustantivo,
}: {
  cargadas: number;
  total: number;
  /** Qué se está contando: "clientes", "fuentes". */
  sustantivo: string;
}) {
  if (total === 0) return null;

  const completo = cargadas === total;
  const porcentaje = Math.round((cargadas / total) * 100);

  return (
    <section className="mt-3" aria-label={`Avance de la digitación de ${sustantivo}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-sm">
          <span className={`font-mono tabular-nums ${completo ? "text-ok" : "text-foreground"}`}>
            {cargadas} de {total}
          </span>{" "}
          <span className="text-muted-foreground">
            {completo ? `${sustantivo} — día completo` : `${sustantivo} con lectura`}
          </span>
        </p>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">{porcentaje}%</p>
      </div>
      <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${completo ? "bg-ok" : "bg-primary"}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </section>
  );
}
