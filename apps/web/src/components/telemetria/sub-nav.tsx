"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Las vistas dentro de Telemetría. Mismo patrón que la sub-navegación de
 * Actividades y por el mismo motivo: sumarle tres entradas al menú lateral del
 * dominio lo llevaría a cinco, y la crítica de diseño del 2026-09-17 marcó que
 * seis ya estaban por encima de lo que se sostiene de un vistazo.
 */
export function SubNavTelemetria() {
  const ruta = usePathname();
  const vistas = [
    { href: "/mantenimiento/telemetria", nombre: "Disponibilidad" },
    { href: "/mantenimiento/telemetria/estaciones", nombre: "Estaciones" },
    { href: "/mantenimiento/telemetria/fallas", nombre: "Bitácora de fallas" },
  ];

  return (
    <nav aria-label="Vistas de Telemetría" className="mt-4 mb-4 border-b border-border">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {vistas.map((v) => {
          const activa = ruta === v.href;
          return (
            <li key={v.href} className="shrink-0">
              <Link
                href={v.href}
                aria-current={activa ? "page" : undefined}
                className={`block border-b-2 px-3 py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
                  activa
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {v.nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
