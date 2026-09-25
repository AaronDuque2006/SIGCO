"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cambiarPasswordSchema, PASSWORD_MIN_LARGO } from "@sicog/shared-validators";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PantallaDeEspera } from "@/components/guardia-sesion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CampoPassword } from "@/components/campo-password";
import { FondoCursor } from "@/components/fondo-cursor";
import { MensajeDeCampo } from "@/components/mensaje-de-campo";
import { SelectorTemaFlotante } from "@/components/selector-tema";
import { EncabezadoVista } from "@/components/encabezado-vista";
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
    <main className="flex min-h-[100dvh] items-center justify-center p-6">
      <FondoCursor />
      <SelectorTemaFlotante />
      {/* `data-panel-sobre-fondo`: la retícula del fondo se apaga al acercarse
          a este elemento, para que no se corte seco contra su borde. */}
      <div
        data-panel-sobre-fondo
        className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        <div className="mb-6">
          <EncabezadoVista titulo={forzado ? "Cambie su contraseña" : "Cambiar contraseña"}>
            {forzado
              ? "Está usando una contraseña temporal. Debe cambiarla antes de poder usar el sistema."
              : "Al cambiarla se cierran todas sus sesiones abiertas, en este y en cualquier otro equipo."}
          </EncabezadoVista>
        </div>

        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordActual">
              {forzado ? "Contraseña temporal" : "Contraseña actual"}
            </Label>
            <CampoPassword
              id="passwordActual"
              autoComplete="current-password"
              autoFocus
              invalido={form.formState.errors.passwordActual !== undefined}
              {...form.register("passwordActual")}
            />
            <MensajeDeCampo texto={form.formState.errors.passwordActual?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordNueva">Contraseña nueva</Label>
            <CampoPassword
              id="passwordNueva"
              autoComplete="new-password"
              aria-describedby="ayuda-password"
              invalido={form.formState.errors.passwordNueva !== undefined}
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
            <CampoPassword
              id="confirmacion"
              autoComplete="new-password"
              invalido={form.formState.errors.confirmacion !== undefined}
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

        {/* Quien llegó con una temporal no tiene a dónde ir: el backend le
            responde 403 en todo lo demás hasta que la cambie (decisión #54).
            Quien vino por su cuenta sí, y hasta acá el único camino de vuelta
            era el botón atrás del navegador. */}
        {forzado ? null : (
          <p className="mt-6 text-center text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground hover:underline">
              Volver sin cambiarla
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
