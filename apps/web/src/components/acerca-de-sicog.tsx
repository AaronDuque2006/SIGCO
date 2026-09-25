import { IconMail, IconPhone } from "@tabler/icons-react";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { SelloSicog } from "@/components/logo-sicog";
import { LogoPdvsaGas } from "@/components/logo-pdvsa";

/**
 * "Acerca de SICOG": qué es el sistema, qué versión corre y a quién escribirle.
 * Pedido del owner el 2026-09-25 (decisión #112). Es **la misma página** en
 * cada departamento — `/despacho/acerca` y `/mantenimiento/acerca` la
 * renderizan tal cual —, así que el texto vive una sola vez, acá.
 *
 * El contacto lo ve cualquier usuario autenticado: son datos que el owner
 * eligió publicar dentro del sistema, no datos de personal.
 */

/** Se sube a mano al entregar una versión nueva, con el `version` de los package.json. */
const VERSION = "0.1.0";
const ANIO = 2026;

/** Los datos del autor, tal como el owner pidió que aparezcan. Sin cargo: no lo dio. */
const AUTOR = {
  nombre: "Aaron David Duque Romero",
  correo: "duqueaaron022006@gmail.com",
  telefono: "+58 412-5418979",
};

export function AcercaDeSicog() {
  return (
    <div className="max-w-3xl space-y-6">
      <EncabezadoVista titulo="Acerca de SICOG" meta={`Versión ${VERSION} · ${ANIO}`}>
        Sistema de Información para la Gerencia de Control Operacional de Gas.
      </EncabezadoVista>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
        <SelloSicog className="size-28 shrink-0 text-foreground" />
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            SICOG reemplaza las planillas con las que la Gerencia de Control Operacional llevaba el
            balance diario de gas, las lecturas de fuentes, la quema nacional, las novedades
            operativas y las actividades de mantenimiento. Fue elaborado durante las pasantías de su
            autor en la Gerencia de Control Operacional de PDVSA Gas.
          </p>
          <p>
            Cualquier usuario puede consultar los cuatro departamentos; cada uno edita sólo el suyo.
          </p>
        </div>
      </section>

      <section aria-labelledby="titulo-creditos">
        <h2 id="titulo-creditos" className="text-sm font-medium">
          Créditos y contacto
        </h2>
        <div className="mt-3 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Desarrollado por</p>
              <p className="mt-1 font-medium">{AUTOR.nombre}</p>
            </div>
            <LogoPdvsaGas variante="tenue" className="h-8 w-auto text-foreground" />
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconMail size={14} stroke={1.75} aria-hidden />
                Correo
              </dt>
              <dd className="mt-0.5">
                <a href={`mailto:${AUTOR.correo}`} className="text-primary underline-offset-4 hover:underline">
                  {AUTOR.correo}
                </a>
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconPhone size={14} stroke={1.75} aria-hidden />
                Teléfono
              </dt>
              <dd className="mt-0.5 font-mono tabular-nums">
                <a
                  href={`tel:${AUTOR.telefono.replace(/[^\d+]/g, "")}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {AUTOR.telefono}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
