"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSesion } from "@/lib/sesion";

/**
 * Las tres reglas de ruteo, en un solo lugar:
 *
 *   sin sesión                  -> /login
 *   con contraseña temporal     -> /cambiar-password, y nada más
 *   con contraseña definitiva   -> la aplicación
 *
 * Esto es comodidad para quien usa el sistema, **no** la defensa: el backend
 * responde 403 a todo lo demás mientras la contraseña siga siendo temporal
 * (`requirePasswordVigente`, decisión #54). Si esta guardia tuviera un error,
 * lo peor que pasa es que la pantalla se vea rara, no que alguien entre.
 */
export function GuardiaSesion({ children }: { children: React.ReactNode }) {
  const { sesion, cargando, sinSesion } = useSesion();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    if (sinSesion) router.replace("/login");
    else if (sesion?.debeCambiarPassword) router.replace("/cambiar-password");
  }, [cargando, sinSesion, sesion, router]);

  if (cargando || sinSesion || sesion?.debeCambiarPassword) {
    return <PantallaDeEspera />;
  }
  return <>{children}</>;
}

export function PantallaDeEspera() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      Cargando…
    </div>
  );
}
