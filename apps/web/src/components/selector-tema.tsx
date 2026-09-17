"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";
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
 * pintado. Este componente sólo lo cambia después, así que arranca leyendo lo
 * que ese script ya dejó puesto en el `<html>`.
 */
export function SelectorTema() {
  const [tema, setTema] = useState<Tema>("dark");

  // El valor real está en el DOM antes de que React monte. Leerlo en un efecto
  // y no en el render inicial es lo que evita el error de hidratación: en el
  // servidor no hay `document`.
  useEffect(() => {
    const puesto = document.documentElement.getAttribute("data-theme");
    if (puesto === "light" || puesto === "dark") setTema(puesto);
  }, []);

  const alternar = () => {
    const nuevo: Tema = tema === "dark" ? "light" : "dark";
    setTema(nuevo);
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
