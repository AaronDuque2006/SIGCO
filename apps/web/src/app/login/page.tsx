"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@sicog/shared-validators";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensajeDeCampo } from "@/components/mensaje-de-campo";
import { useLogin, useSesion } from "@/lib/sesion";

export default function LoginPage() {
  const router = useRouter();
  const { sesion, cargando } = useSesion();
  const login = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nombre: "", password: "" },
  });

  // Quien ya tiene sesión no debería quedarse mirando el formulario.
  useEffect(() => {
    if (cargando || !sesion) return;
    router.replace(sesion.debeCambiarPassword ? "/cambiar-password" : "/");
  }, [cargando, sesion, router]);

  const enviar = form.handleSubmit((datos) => {
    login.mutate(datos, {
      onSuccess: (nueva) =>
        router.replace(nueva.debeCambiarPassword ? "/cambiar-password" : "/"),
    });
  });

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">SICOG</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control Operacional de Gas
          </p>
        </div>

        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Usuario</Label>
            <Input
              id="nombre"
              autoComplete="username"
              autoFocus
              placeholder="nombre.usuario"
              aria-invalid={form.formState.errors.nombre !== undefined}
              {...form.register("nombre")}
            />
            <MensajeDeCampo texto={form.formState.errors.nombre?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={form.formState.errors.password !== undefined}
              {...form.register("password")}
            />
            <MensajeDeCampo texto={form.formState.errors.password?.message} />
          </div>

          {login.error ? (
            <Alert variant="destructive">
              <AlertDescription>{login.error.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ¿Olvidó su contraseña? Solicite un reinicio al administrador del sistema.
        </p>
      </div>
    </main>
  );
}
