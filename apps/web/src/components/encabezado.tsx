"use client";

import { CONTENEDOR } from "@/components/contenedor";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { SelectorTema } from "@/components/selector-tema";
import { Button } from "@/components/ui/button";
import { useLogout, useSesion } from "@/lib/sesion";
import { IconHome } from "@tabler/icons-react";
import { MarcaSicog } from "@/components/logo-sicog";
import { LogoPdvsaGas } from "@/components/logo-pdvsa";

/**
 * Cabecera común de las pantallas autenticadas. El nombre del sistema lleva al
 * hub de dominios, que es el punto de partida de todo recorrido.
 */
export function Encabezado() {
  const { sesion } = useSesion();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  // Sólo tiene sentido "volver al inicio" cuando no se está ya ahí: en el hub
  // (`/`) y en las pantallas que no cuelgan de un departamento (`/usuarios`,
  // `/cambiar-password`) el ícono sería un atajo a la propia pantalla. El
  // asistente no es un departamento, pero se entra a él desde el hub igual
  // que a uno.
  const dentroDeUnDepartamento =
    pathname.startsWith("/despacho") ||
    pathname.startsWith("/mantenimiento") ||
    pathname.startsWith("/asistente");
  // "Salir" es el control más prominente del encabezado y está a un clic
  // durante las doce horas del turno. Cerrar sesión no destruye datos, pero sí
  // saca a alguien de la pantalla que estaba digitando, así que pide un paso
  // más — el mismo patrón en el lugar que ya usa el borrado de contactos, en
  // vez de un `confirm()` del navegador.
  const [confirmando, setConfirmando] = useState(false);

  if (!sesion) return null;

  return (
    <header className="border-b border-border">
      <div className={`${CONTENEDOR} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight hover:underline"
          >
            {/* Alude al hub de dominios, que es "el inicio": mismo ícono que
                usaría cualquier menú para volver a la pantalla de arranque.
                Sólo aparece dentro de un departamento — en el propio hub
                sería un atajo a la pantalla en la que ya se está.
                `relative top-px`: centrado por caja da el pico del techo
                más alto que la altura de mayúscula del texto; el ajuste
                óptico lo asienta junto a "SICOG" en vez de sobre él. */}
            {dentroDeUnDepartamento ? (
              <IconHome size={18} stroke={1.75} className="relative top-px" aria-hidden />
            ) : null}
            <MarcaSicog className="size-5" />
            {/* Gruesa, para que pegue con el "PDVSA" del logo que va a la
                derecha (decisión #114). */}
            <span className="font-marca text-lg leading-none font-extrabold">
              SICOG
            </span>
          </Link>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {sesion.nombre} · {sesion.puesto}
            {sesion.departamento ? ` · ${sesion.departamento}` : ""}
            {sesion.esSuperadmin ? " · Superadmin" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* La institución, sin su rojo: el encabezado acompaña toda la
              guardia y el único acento de la pantalla de trabajo es el Azul
              Señal (decisión #113). En la tinta de los botones de al lado, no
              en la tenue, que en este sistema se lee como deshabilitado; y no
              en azul, que acá significa "se puede tocar". Separado de los
              controles por un filete, porque no es uno de ellos. */}
          <LogoPdvsaGas
            variante="tenue"
            className="mr-2 hidden h-6 w-auto border-r border-border pr-4 text-foreground sm:block"
          />
          <SelectorTema />
          {/* Sólo se muestra a quien puede usarla. La puerta real es el 403 de
              `requireSuperadmin`, que además deja registro del intento. */}
          {sesion.esSuperadmin ? (
            <Button variant="ghost" onClick={() => router.push("/usuarios")}>
              Usuarios
            </Button>
          ) : null}
          {confirmando ? (
            <>
              <span className="text-sm text-muted-foreground">¿Cerrar la sesión?</span>
              {/* El peso marcado va en confirmar y el normal en cancelar: quien
                  llegó acá de más tiene que encontrar la salida fácil. */}
              <Button
                variant="destructive"
                onClick={() =>
                  logout.mutate(undefined, { onSuccess: () => router.replace("/login") })
                }
                disabled={logout.isPending}
              >
                {logout.isPending ? "Saliendo…" : "Sí, salir"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmando(false)}>
                Seguir aquí
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirmando(true)}>
              Salir
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
