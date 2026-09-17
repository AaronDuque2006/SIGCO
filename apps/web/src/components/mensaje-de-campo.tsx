/**
 * El error de un campo, debajo del campo.
 *
 * Estaba escrito dos veces, carácter por carácter, en las dos pantallas de
 * autenticación. Vive acá para que el día que cambie —un icono, un `role`, un
 * color— cambie en las dos.
 *
 * Va con `role="alert"` porque aparece después de que la persona intentó
 * enviar: sin eso, quien usa lector de pantalla se queda esperando una
 * respuesta que ya está en la pantalla.
 */
export function MensajeDeCampo({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {texto}
    </p>
  );
}
