"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Encabezado } from "@/components/encabezado";
import { GuardiaSesion } from "@/components/guardia-sesion";
import {
  IconAlertTriangle,
  IconChartBar,
  IconFlame,
  IconGauge,
  IconPhone,
  IconTable,
} from "@tabler/icons-react";

interface Vista {
  ruta: string;
  nombre: string;
  descripcion: string;
  /** `false` mientras la vista no exista todavía. */
  disponible: boolean;
  /** El icono es semántico, no decorativo: en un menú de seis entradas con
   *  nombres de longitud parecida, la forma se reconoce antes que la palabra. */
  Icono: typeof IconTable;
}

// El orden es el del trabajo diario: primero se digita lo entregado a clientes,
// después lo recibido de las fuentes, luego la quema —que no entra en ninguno
// de los dos (decisión #62)— y al final se mira el resultado.
const VISTAS: Vista[] = [
  {
    ruta: "/despacho",
    nombre: "Balance diario",
    descripcion: "Entregas por cliente",
    disponible: true,
    Icono: IconTable,
  },
  {
    ruta: "/despacho/fuentes",
    nombre: "Lecturas de fuentes",
    descripcion: "Gas recibido",
    disponible: true,
    Icono: IconGauge,
  },
  {
    ruta: "/despacho/quema",
    nombre: "Quema nacional",
    descripcion: "Total quemado del día",
    disponible: true,
    Icono: IconFlame,
  },
  {
    ruta: "/despacho/novedades",
    nombre: "Novedades",
    descripcion: "Eventos operativos",
    disponible: true,
    Icono: IconAlertTriangle,
  },
  {
    ruta: "/despacho/contactos",
    nombre: "Contactos",
    descripcion: "Teléfonos de operadores",
    disponible: true,
    Icono: IconPhone,
  },
  {
    ruta: "/despacho/reportes",
    nombre: "Reportes y gráficas",
    descripcion: "Balance nación y consumo",
    disponible: true,
    Icono: IconChartBar,
  },
];

/**
 * Cáscara de Despacho: la guardia de sesión y la cabecera viven acá y no en
 * cada pantalla, así que agregar una vista nueva es agregar una fila a `VISTAS`
 * y un `page.tsx`.
 *
 * El menú es de **este dominio**, no global: elegir dominio es lo que hace el
 * hub (decisión #59), y mezclar las dos cosas en un solo menú borraría esa
 * distinción.
 */
export default function DespachoLayout({ children }: LayoutProps<"/despacho">) {
  return (
    <GuardiaSesion>
      <Encabezado />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:flex-row">
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
    <nav aria-label="Vistas de Despacho" className="md:w-56 md:shrink-0">
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
