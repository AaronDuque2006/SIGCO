/**
 * Contenedor de las grillas de digitación, común a clientes y a fuentes.
 *
 * La tabla es lo único que puede desbordar, y scrollea acá adentro en los dos
 * ejes: a lo ancho para que la página no scrollee en horizontal, y a lo alto
 * para que lo de arriba —las tarjetas de balance, los filtros— no se vaya de
 * pantalla al recorrer cien filas.
 *
 * El alto era `65vh`, un número elegido a ojo. Ahora se mide contra la pantalla
 * real: `100dvh` menos las 12rem que ocupan el encabezado de la aplicación y el
 * aire de arriba. Así la grilla usa todo lo que el monitor da en vez de una
 * fracción fija, que en una pantalla alta desperdiciaba espacio y en una baja
 * empujaba el resto fuera de vista. `dvh` y no `vh` porque en móvil la barra
 * del navegador se retrae y `vh` no se entera.
 */
export function TablaDesplazable({
  anchoMinimo,
  children,
}: {
  /** Clase de ancho mínimo; debajo de eso la tabla scrollea en horizontal. */
  anchoMinimo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 max-h-[calc(100dvh-12rem)] overflow-auto rounded-lg border border-border">
      <table className={`w-full ${anchoMinimo} border-collapse text-sm`}>{children}</table>
    </div>
  );
}

/**
 * Clase de las celdas del encabezado, que queda fijo mientras la tabla
 * scrollea: si no, al bajar se pierde qué columna es cuál.
 *
 * La línea inferior es una sombra interior y no un `border-b` porque con
 * `border-collapse` el borde de una celda `sticky` no se dibuja: se queda en su
 * posición original y desaparece apenas se scrollea.
 */
export const TH =
  "sticky top-0 z-10 bg-card px-3 py-2 font-medium shadow-[inset_0_-1px_0_var(--border)]";
