"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type Tema = "dark" | "light";

const CLAVE = "tema";

/**
 * Cambia entre el tema oscuro y el claro.
 *
 * **El oscuro sigue siendo el predeterminado**: responde a la sala de control,
 * donde la pantalla no se apaga en doce horas. El claro existe porque de día la
 * luz ambiente cambia el problema, porque la preferencia es personal, y porque
 * los PDF de gráficas y datos se leen mejor en blanco.
 *
 * La preferencia vive en el navegador y no en la cuenta: en una sala de control
 * depende del monitor y de la luz que le da, no de quién se sienta. Guardarla
 * en `USUARIO` habría sido migración, cambio de contrato y una decisión nueva
 * sobre un modelo cerrado, a cambio de que te siga entre equipos — que es justo
 * lo que acá no se quiere.
 *
 * Quien pinta el tema al cargar es el script del `layout`, antes del primer
 * pintado. Este componente sólo lo cambia después.
 *
 * El tema no se copia a un estado de React: se lee del `data-theme` del
 * `<html>`, que es la fuente de verdad (`useSyncExternalStore` con un
 * MutationObserver). Así no hay un `setState` dentro de un efecto para
 * sincronizar la copia, y si otro selector cambia el tema, éste se entera. En
 * el servidor no hay `document`: ahí vale el oscuro, que es el predeterminado,
 * y React lo corrige al hidratar sin error de hidratación.
 */
function suscribirTema(avisar: () => void): () => void {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observador.disconnect();
}

const temaPuesto = (): Tema => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

const temaEnServidor = (): Tema => "dark";

export function SelectorTema() {
  const tema = useSyncExternalStore(suscribirTema, temaPuesto, temaEnServidor);

  const alternar = () => {
    const nuevo: Tema = tema === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nuevo);
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      // Sin almacenamiento el cambio vale para esta pestaña y nada más, que es
      // mejor que romper el botón.
    }
  };

  const aOscuro = tema === "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={alternar}
      // El botón no dice en qué tema estás —eso se ve— sino a cuál te lleva.
      aria-label={aOscuro ? "Cambiar al tema oscuro" : "Cambiar al tema claro"}
      title={aOscuro ? "Tema oscuro" : "Tema claro"}
    >
      {aOscuro ? <IconMoon size={18} stroke={1.75} aria-hidden /> : <IconSun size={18} stroke={1.75} aria-hidden />}
    </Button>
  );
}

/**
 * El mismo selector, para las pantallas que no llevan encabezado.
 *
 * Login y cambio de contraseña son tarjetas centradas sin cabecera, así que sin
 * esto quien entra de día a un equipo nuevo se come el tema oscuro hasta
 * autenticarse — justo el caso que el tema claro venía a resolver. Va fijo en
 * la esquina para no tocar la composición centrada, que es lo único que esas
 * dos pantallas tienen.
 */
export function SelectorTemaFlotante() {
  return (
    <div className="fixed top-4 right-4 z-10">
      <SelectorTema />
    </div>
  );
}
