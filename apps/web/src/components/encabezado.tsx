"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogout, useSesion } from "@/lib/sesion";

/**
 * Cabecera común de las pantallas autenticadas. El nombre del sistema lleva al
 * hub de dominios, que es el punto de partida de todo recorrido.
 */
export function Encabezado() {
  const { sesion } = useSesion();
  const logout = useLogout();
  const router = useRouter();

  if (!sesion) return null;

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <Link href="/" className="text-base font-semibold tracking-tight hover:underline">
            SICOG
          </Link>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {sesion.nombre} · {sesion.puesto}
            {sesion.departamento ? ` · ${sesion.departamento}` : ""}
            {sesion.esSuperadmin ? " · Superadmin" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            logout.mutate(undefined, { onSuccess: () => router.replace("/login") })
          }
          disabled={logout.isPending}
        >
          Salir
        </Button>
      </div>
    </header>
  );
}
