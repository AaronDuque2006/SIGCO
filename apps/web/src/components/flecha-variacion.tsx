import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";

/**
 * Si el valor subió o bajó respecto del que reemplazó — el que tenía antes de
 * la última corrección. Nada si son iguales, o si nunca se corrigió (no hay
 * contra qué compararlo).
 *
 * **Sin color.** Que un volumen suba o baje no es bueno ni malo: es una
 * dirección, no un estado. El verde y el rojo del sistema están reservados
 * para estados operativos —el empaque/desempaque del balance— y gastarlos acá
 * diría que entregar más gas "está bien".
 */
export function FlechaVariacion({ valor, anterior }: { valor: number; anterior: number | null }) {
  if (anterior === null || valor === anterior) return null;
  const subio = valor > anterior;
  const Icono = subio ? IconArrowUp : IconArrowDown;
  return (
    <Icono
      size={14}
      stroke={2}
      role="img"
      aria-label={subio ? "subió respecto del valor anterior" : "bajó respecto del valor anterior"}
      className="text-muted-foreground"
    />
  );
}
