"use client";

import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * Campo de contraseña con la opción de verla.
 *
 * Existe porque escribir a ciegas una contraseña que el sistema **genera**
 * —`carro-8602`, decisión #58— y hay que transcribir de un papel es donde más
 * se equivoca la gente, y el error vuelve como "credenciales inválidas", que no
 * distingue entre "la tecleó mal" y "no es su contraseña".
 *
 * **Arranca oculta y cada campo decide por su cuenta.** Un interruptor único
 * para los tres campos del cambio de contraseña dejaría las tres a la vista de
 * quien pase por detrás, cuando en general alcanza con mirar una.
 *
 * El botón dice **a qué lleva**, no en qué estado está: "Mostrar" cuando está
 * oculta. `aria-pressed` es lo que comunica el estado, que es su trabajo.
 */
export function CampoPassword({
  id,
  invalido,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; invalido?: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        aria-invalid={invalido}
        // Sitio para el botón, para que el texto largo no le pase por debajo.
        className="pr-9"
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar la contraseña" : "Mostrar la contraseña"}
        aria-pressed={visible}
        aria-controls={id}
        // `tabIndex={-1}` a propósito: quien llena el formulario con el teclado
        // pasa de la contraseña al botón de enviar, no a un interruptor de
        // visibilidad. Sigue siendo alcanzable con el mouse y por el lector de
        // pantalla, que no navega por el orden de tabulación.
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {visible ? (
          <IconEyeOff size={16} stroke={1.75} aria-hidden />
        ) : (
          <IconEye size={16} stroke={1.75} aria-hidden />
        )}
      </button>
    </div>
  );
}
