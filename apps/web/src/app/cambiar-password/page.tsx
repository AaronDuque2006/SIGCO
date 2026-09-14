"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cambiarPasswordSchema, PASSWORD_MIN_LARGO } from "@sicog/shared-validators";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PantallaDeEspera } from "@/components/guardia-sesion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCambiarPassword, useSesion } from "@/lib/sesion";

// La confirmación es sólo de la pantalla: al backend le llegan dos campos, no
// tres. Por eso se extiende acá y no se toca el schema compartido, que es el
// contrato de la API.
const formularioSchema = cambiarPasswordSchema
  .extend({ confirmacion: z.string() })
  .refine((d) => d.passwordNueva === d.confirmacion, {
    path: ["confirmacion"],
    message: "Las dos contraseñas no coinciden.",
  });

type FormularioInput = z.infer<typeof formularioSchema>;

export default function CambiarPasswordPage() {
  const router = useRouter();
  const { sesion, cargando, sinSesion } = useSesion();
  const cambiar = useCambiarPassword();

  const form = useForm<FormularioInput>({
    resolver: zodResolver(formularioSchema),
    defaultValues: { passwordActual: "", passwordNueva: "", confirmacion: "" },
  });

  useEffect(() => {
    if (!cargando && sinSesion) router.replace("/login");
  }, [cargando, sinSesion, router]);

  if (cargando || sinSesion) return <PantallaDeEspera />;

  const forzado = sesion?.debeCambiarPassword === true;

  const enviar = form.handleSubmit(({ passwordActual, passwordNueva }) => {
    cambiar.mutate(
      { passwordActual, passwordNueva },
      { onSuccess: () => router.replace("/") },
    );
  });

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-lg font-semibold tracking-tight">
            {forzado ? "Cambie su contraseña" : "Cambiar contraseña"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {forzado
              ? "Está usando una contraseña temporal. Debe cambiarla antes de poder usar el sistema."
              : "Al cambiarla se cierran todas sus sesiones abiertas, en este y en cualquier otro equipo."}
          </p>
        </div>

        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordActual">
              {forzado ? "Contraseña temporal" : "Contraseña actual"}
            </Label>
            <Input
              id="passwordActual"
              type="password"
              autoComplete="current-password"
              autoFocus
              aria-invalid={form.formState.errors.passwordActual !== undefined}
              {...form.register("passwordActual")}
            />
            <MensajeDeCampo texto={form.formState.errors.passwordActual?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordNueva">Contraseña nueva</Label>
            <Input
              id="passwordNueva"
              type="password"
              autoComplete="new-password"
              aria-describedby="ayuda-password"
              aria-invalid={form.formState.errors.passwordNueva !== undefined}
              {...form.register("passwordNueva")}
            />
            <p id="ayuda-password" className="text-xs text-muted-foreground">
              Mínimo {PASSWORD_MIN_LARGO} caracteres, con al menos una letra y un
              número. No se exigen mayúsculas ni símbolos, y no se aceptan
              contraseñas obvias ni palabras del trabajo.
            </p>
            <MensajeDeCampo texto={form.formState.errors.passwordNueva?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmacion">Repita la contraseña nueva</Label>
            <Input
              id="confirmacion"
              type="password"
              autoComplete="new-password"
              aria-invalid={form.formState.errors.confirmacion !== undefined}
              {...form.register("confirmacion")}
            />
            <MensajeDeCampo texto={form.formState.errors.confirmacion?.message} />
          </div>

          {cambiar.error ? (
            <Alert variant="destructive">
              <AlertDescription>{cambiar.error.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={cambiar.isPending}>
            {cambiar.isPending ? "Guardando…" : "Cambiar contraseña"}
          </Button>
        </form>
      </div>
    </main>
  );
}

function MensajeDeCampo({ texto }: { texto?: string }) {
  if (!texto) return null;
  return <p className="text-xs text-destructive">{texto}</p>;
}
