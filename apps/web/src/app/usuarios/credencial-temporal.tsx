"use client";

import type { UsuarioConPasswordTemporalDto } from "@sicog/shared-types";
import { Button } from "@/components/ui/button";

/**
 * La contraseña temporal existe en claro **una sola vez**: no se guarda así y
 * no hay forma de volver a consultarla (decisión #54). Por eso no es un aviso
 * que se desvanece solo — se queda hasta que la persona diga que ya la anotó.
 */
export function CredencialTemporal({
  resultado,
  onCerrar,
}: {
  resultado: UsuarioConPasswordTemporalDto;
  onCerrar: () => void;
}) {
  const vence = new Date(resultado.passwordExpiraEn).toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      role="alert"
      className="mt-4 rounded-lg border border-ok/40 bg-ok-soft p-4"
    >
      <h2 className="font-medium text-ok">Contraseña temporal de {resultado.usuario.nombre}</h2>
      <p className="mt-2 font-mono text-lg tracking-wide">{resultado.passwordTemporal}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Anótela ahora y entréguela en persona: <strong>no se puede volver a consultar</strong>.
        Vence el {vence}, y al entrar el sistema le va a exigir cambiarla.
      </p>
      <Button variant="outline" className="mt-3" onClick={onCerrar}>
        Ya la anoté
      </Button>
    </div>
  );
}
