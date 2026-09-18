"use client";

import Link from "next/link";
import { CONTENEDOR } from "@/components/contenedor";
import { Encabezado } from "@/components/encabezado";
import { GuardiaSesion } from "@/components/guardia-sesion";
import { DEPARTAMENTOS, type Departamento } from "@/lib/departamentos";
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
 * Punto de llegada después de autenticarse: los cuatro departamentos.
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
      <main className={`${CONTENEDOR} p-4`}>
        <div className="mt-4">
          <EncabezadoVista titulo="Departamentos">
            Puede consultar los cuatro. Edita sólo el que le corresponde.
          </EncabezadoVista>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {DEPARTAMENTOS.map((departamento) => (
            <li key={departamento.nombre}>
              <CardDepartamento
                departamento={departamento}
                puedeEditar={sesion.departamentosQueEdita.includes(departamento.nombre)}
              />
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

function CardDepartamento({ departamento, puedeEditar }: { departamento: Departamento; puedeEditar: boolean }) {
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium">{departamento.nombre}</h2>
        {departamento.ruta === null ? (
          <Etiqueta tono="neutro">En desarrollo</Etiqueta>
        ) : (
          <Etiqueta tono={puedeEditar ? "ok" : "neutro"}>
            {puedeEditar ? "Puede editar" : "Sólo consulta"}
          </Etiqueta>
        )}
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{departamento.descripcion}</p>
    </>
  );

  // Un departamento sin construir no es un enlace ni un botón deshabilitado: no es
  // un control. Se muestra atenuado y fuera del recorrido del teclado, para que
  // un lector de pantalla tampoco lo anuncie como algo accionable.
  if (departamento.ruta === null) {
    return (
      <div className="h-full rounded-lg border border-border bg-card p-4 opacity-55">
        {contenido}
      </div>
    );
  }

  return (
    <Link
      href={departamento.ruta}
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
