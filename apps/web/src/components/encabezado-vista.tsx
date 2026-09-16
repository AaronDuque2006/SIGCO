/**
 * El encabezado de una vista: título, cifra de contexto y descripción.
 *
 * Existe para que la escala tipográfica no se vuelva a desalinear. Antes cada
 * pantalla escribía su propio `<h1 className="text-lg …">`, y las diez
 * terminaron con el título del mismo tamaño que un rótulo de tarjeta: entre el
 * nombre de la vista y el texto del cuerpo había medio escalón, así que ningún
 * título leía como título.
 *
 * La escala del tablero, de arriba abajo:
 *
 *   título de vista   text-xl   semibold      ← acá
 *   título de sección text-sm   medium
 *   rótulo de tarjeta text-xs   medium, tenue
 *
 * Sigue siendo una escala corta a propósito. Esto es una sala de control, no
 * una portada: la jerarquía tiene que existir sin gastar altura de pantalla,
 * que es lo que las grillas necesitan.
 */
export function EncabezadoVista({
  titulo,
  meta,
  children,
}: {
  titulo: string;
  /** Cifra de contexto a la derecha del título — conteos, totales. */
  meta?: React.ReactNode;
  /** Descripción opcional, debajo. */
  children?: React.ReactNode;
}) {
  return (
    <header>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
        {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
      </div>
      {children ? <p className="mt-2 text-sm text-muted-foreground">{children}</p> : null}
    </header>
  );
}
