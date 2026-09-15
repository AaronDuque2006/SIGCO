"use client";

import type { UsuarioSesionDto } from "@sicog/shared-types";

/**
 * Explica por qué una grilla quedó de sólo lectura.
 *
 * Decisión #22: cualquiera consulta cualquier departamento, pero sólo edita el
 * propio. Sin este aviso la grilla se dibuja con las celdas apagadas y sin
 * decir nada, y cien filas con "—" son indistinguibles de una pantalla rota.
 * Pasó exactamente eso: la única cuenta que existía era el superadmin de
 * arranque, que por la decisión #21 no pertenece a ningún departamento, así
 * que no podía digitar nada y la pantalla no lo explicaba.
 *
 * Esto es cortesía, no control de acceso: quien se salte la UI se topa igual
 * con el 403 de `requireDepartamento`, que se resuelve contra la base.
 */
export function AvisoSoloConsulta({
  sesion,
  departamento,
}: {
  sesion: UsuarioSesionDto | null;
  /** Debe coincidir carácter por carácter con la fila de `DEPARTAMENTO`. */
  departamento: string;
}) {
  // Mientras la sesión carga no se afirma nada: un aviso que aparece y
  // desaparece solo es peor que ninguno.
  if (sesion === null || sesion.departamentosQueEdita.includes(departamento)) return null;

  return (
    <div
      role="status"
      className="mt-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
    >
      <strong className="font-medium text-foreground">Modo consulta.</strong>{" "}
      {sesion.departamento === null ? (
        <>
          La cuenta <span className="font-medium">{sesion.nombre}</span> administra el
          sistema y no pertenece a ningún departamento, así que no digita datos de{" "}
          {departamento}. Para cargar valores hace falta una cuenta de {departamento}.
        </>
      ) : (
        <>
          La cuenta <span className="font-medium">{sesion.nombre}</span> es de{" "}
          {sesion.departamento}, y cada quien edita sólo los datos de su propio
          departamento.
        </>
      )}
    </div>
  );
}
