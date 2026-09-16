"use client";

import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { GuardiaSesion } from "@/components/guardia-sesion";
import { DOMINIOS, type Dominio } from "@/lib/dominios";
import { useSesion } from "@/lib/sesion";
import { EncabezadoVista } from "@/components/encabezado-vista";

export default function HubPage() {
  return (
    <GuardiaSesion>
      <Hub />
    </GuardiaSesion>
  );
}

/**
 * Punto de llegada después de autenticarse: los cuatro dominios del sistema.
 *
 * Se muestran los cuatro a todo el mundo a propósito, y es la traducción visual
 * de la decisión #22: cualquiera puede **consultar** los datos de cualquier
 * departamento, pero sólo **editar** los del suyo. Por eso cada card dice a qué
 * viene la persona, en vez de esconder lo que no puede tocar.
 */
function Hub() {
  const { sesion } = useSesion();
  if (!sesion) return null;

  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-5xl p-4">
        <div className="mt-4">
          <EncabezadoVista titulo="Dominios">
            Puede consultar los cuatro. Edita sólo el que le corresponde.
          </EncabezadoVista>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {DOMINIOS.map((dominio) => (
            <li key={dominio.nombre}>
              <CardDominio
                dominio={dominio}
                puedeEditar={sesion.departamentosQueEdita.includes(dominio.nombre)}
              />
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

function CardDominio({ dominio, puedeEditar }: { dominio: Dominio; puedeEditar: boolean }) {
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium">{dominio.nombre}</h2>
        {dominio.ruta === null ? (
          <Etiqueta tono="neutro">En desarrollo</Etiqueta>
        ) : (
          <Etiqueta tono={puedeEditar ? "ok" : "neutro"}>
            {puedeEditar ? "Puede editar" : "Sólo consulta"}
          </Etiqueta>
        )}
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{dominio.descripcion}</p>
    </>
  );

  // Un dominio sin construir no es un enlace ni un botón deshabilitado: no es
  // un control. Se muestra atenuado y fuera del recorrido del teclado, para que
  // un lector de pantalla tampoco lo anuncie como algo accionable.
  if (dominio.ruta === null) {
    return (
      <div className="h-full rounded-lg border border-border bg-card p-4 opacity-55">
        {contenido}
      </div>
    );
  }

  return (
    <Link
      href={dominio.ruta}
      className="block h-full rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring hover:bg-panel-raised focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {contenido}
    </Link>
  );
}

function Etiqueta({ tono, children }: { tono: "ok" | "neutro"; children: React.ReactNode }) {
  return (
    <span
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs ${
        tono === "ok" ? "bg-ok-soft text-ok" : "bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}
