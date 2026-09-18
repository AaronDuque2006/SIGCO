"use client";

import { CONTENEDOR } from "@/components/contenedor";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Encabezado } from "@/components/encabezado";
import { GuardiaSesion } from "@/components/guardia-sesion";
import { IconAntenna, IconClipboardList } from "@tabler/icons-react";

interface Vista {
  ruta: string;
  nombre: string;
  descripcion: string;
  /** `false` mientras la vista no exista todavía. */
  disponible: boolean;
  /** El icono es semántico, no decorativo: en un menú de seis entradas con
   *  nombres de longitud parecida, la forma se reconoce antes que la palabra. */
  Icono: typeof IconClipboardList;
}

// El orden es el del trabajo: primero se registra lo que se hizo, después se
// mira contra el plan, y los catálogos quedan al final porque casi nunca se
// tocan (los gobierna el Supervisor, decisión #31).
const VISTAS: Vista[] = [
  {
    ruta: "/mantenimiento",
    nombre: "Actividades",
    descripcion: "Bitácora, plan y reportes",
    disponible: true,
    Icono: IconClipboardList,
  },
  // Lo que el dominio va a tener y todavía no: se muestra atenuado y fuera del
  // recorrido del teclado, igual que los dominios sin construir del hub.
  {
    ruta: "/mantenimiento/telemetria",
    nombre: "Telemetría",
    descripcion: "Estaciones T&D",
    disponible: false,
    Icono: IconAntenna,
  },
];

/**
 * Cáscara de Mantenimiento, calcada de la de Despacho a propósito: la crítica
 * de diseño del 2026-09-17 encontró que el mayor problema del sistema era la
 * deriva entre pantallas, así que un dominio nuevo no estrena estructura.
 *
 * Hoy el dominio es casi sólo el módulo de Actividades (decisión #9: un módulo
 * transversal con una sección por departamento). Telemetría y estaciones están
 * modeladas y sin construir.
 */
export default function MantenimientoLayout({ children }: LayoutProps<"/mantenimiento">) {
  return (
    <GuardiaSesion>
      <Encabezado />
      <div className={`${CONTENEDOR} flex flex-col gap-4 p-4 md:flex-row`}>
        <MenuLateral />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </GuardiaSesion>
  );
}

function MenuLateral() {
  const ruta = usePathname();

  return (
    // En pantalla angosta el menú deja de ser lateral y pasa a ser una fila que
    // se desplaza: un panel fijo a la izquierda se comería el ancho que la
    // grilla necesita.
    <nav aria-label="Vistas de Mantenimiento" className="md:w-56 md:shrink-0">
      <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {VISTAS.map((vista) => (
          <li key={vista.ruta} className="shrink-0 md:shrink">
            <EntradaMenu vista={vista} activa={ruta === vista.ruta} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function EntradaMenu({ vista, activa }: { vista: Vista; activa: boolean }) {
  const { Icono } = vista;
  const contenido = (
    <span className="flex items-start gap-2.5">
      {/* `aria-hidden`: el nombre de al lado ya dice qué es, y un lector de
          pantalla no gana nada leyendo el icono dos veces. */}
      <Icono size={18} stroke={1.75} aria-hidden className="mt-0.5 shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{vista.nombre}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {vista.disponible ? vista.descripcion : "En desarrollo"}
        </span>
      </span>
    </span>
  );

  // Una vista que no existe no es un control: va atenuada y fuera del recorrido
  // del teclado, igual que los dominios sin construir del hub.
  if (!vista.disponible) {
    return (
      <div className="rounded-lg border border-transparent px-3 py-2 opacity-55">{contenido}</div>
    );
  }

  return (
    <Link
      href={vista.ruta}
      aria-current={activa ? "page" : undefined}
      className={`block rounded-lg border px-3 py-2 transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
        activa
          ? "border-border bg-panel-raised"
          : "border-transparent hover:border-border hover:bg-card"
      }`}
    >
      {contenido}
    </Link>
  );
}
