"use client";

import { useRouter } from "next/navigation";
import { GuardiaSesion } from "@/components/guardia-sesion";
import { Button } from "@/components/ui/button";
import { useLogout, useSesion } from "@/lib/sesion";

export default function InicioPage() {
  return (
    <GuardiaSesion>
      <Inicio />
    </GuardiaSesion>
  );
}

// Provisional: es el punto de llegada tras iniciar sesión hasta que exista
// Balance Diario, la primera pantalla operativa (CONTEXTO_PROYECTO.md §10).
function Inicio() {
  const { sesion } = useSesion();
  const logout = useLogout();
  const router = useRouter();

  if (!sesion) return null;

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <header className="flex items-baseline justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">SICOG</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sesion.nombre} · {sesion.puesto}
            {sesion.departamento ? ` · ${sesion.departamento}` : ""}
            {sesion.esSuperadmin ? " · Superadmin" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace("/login") })}
          disabled={logout.isPending}
        >
          Salir
        </Button>
      </header>

      <section className="mt-6 space-y-3 text-sm">
        <p className="text-muted-foreground">
          Sesión iniciada. Las pantallas operativas todavía no existen; la primera
          va a ser Balance Diario.
        </p>
        <p className="text-muted-foreground">
          Puede editar datos de:{" "}
          <span className="text-foreground">
            {sesion.departamentosQueEdita.length > 0
              ? sesion.departamentosQueEdita.join(", ")
              : "ningún departamento"}
          </span>
          .
        </p>
      </section>
    </main>
  );
}
