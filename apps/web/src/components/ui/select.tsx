import * as React from "react";
import { cn } from "cn";

/**
 * El `<select>` nativo, con el vestido de la casa.
 *
 * Nativo a propósito: en una sala de control el desplegable del sistema
 * operativo se abre con el teclado, se navega escribiendo, y no depende de que
 * un portal se posicione bien dentro de una tabla que scrollea en los dos ejes.
 * Un combobox propio no compraría nada acá.
 *
 * Existe porque el mismo puñado de clases estaba copiado en tres archivos —dos
 * veces como literal y una como constante— y ya había empezado a divergir. La
 * forma la toma de `Input`, que es el campo con el que comparte fila.
 */
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
