"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Las vistas **dentro** de la sección de Actividades de un departamento.
 *
 * Van acá y no en el menú lateral porque el módulo es transversal (decisión
 * #9): sumarle cuatro entradas al menú de cada departamento dejaría a Despacho
 * en diez, y la crítica de diseño del 2026-09-17 ya marcó que sus seis estaban
 * por encima de lo que se sostiene de un vistazo. El menú lateral dice en qué
 * sección estoy; esto, qué miro dentro de ella.
 */
export function SubNavActividades({ base }: { base: string }) {
  const ruta = usePathname();
  const vistas = [
    { href: base, nombre: "Bitácora" },
    { href: `${base}/plan`, nombre: "Plan anual" },
    { href: `${base}/reportes`, nombre: "Reportes" },
    { href: `${base}/catalogos`, nombre: "Catálogos" },
  ];

  return (
    <nav aria-label="Vistas de Actividades" className="mt-4 mb-4 border-b border-border">
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
