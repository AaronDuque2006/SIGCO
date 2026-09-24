"use client";

import type { DocumentoRagDto } from "@sicog/shared-types";
import { IconUpload } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTENEDOR } from "@/components/contenedor";
import { Encabezado } from "@/components/encabezado";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { GuardiaSesion } from "@/components/guardia-sesion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  useDocumentosRag,
  useEliminarDocumento,
  useReprocesarDocumento,
  useSubirDocumento,
} from "@/lib/asistente";
import { useSesion } from "@/lib/sesion";

export default function DocumentosAsistentePage() {
  return (
    <GuardiaSesion>
      <Documentos />
    </GuardiaSesion>
  );
}

/**
 * Qué entra al corpus del asistente. Sólo el superadmin (decisión #101): un
 * documento malo contamina las respuestas de todos.
 */
function Documentos() {
  const { sesion } = useSesion();
  const router = useRouter();

  // La puerta real es el 403 de `requireSuperadmin`, que además deja registro.
  // Esto sólo evita mostrarle una pantalla rota a quien no corresponde.
  useEffect(() => {
    if (sesion && !sesion.esSuperadmin) router.replace("/asistente");
  }, [sesion, router]);

  const lista = useDocumentosRag();

  if (!sesion?.esSuperadmin) return null;

  return (
    <>
      <Encabezado />
      <main className={`${CONTENEDOR} p-4`}>
        <div className="mt-4">
          <EncabezadoVista
            titulo="Documentos del asistente"
            meta={
              <Button variant="outline" nativeButton={false} render={<Link href="/asistente" />}>
                Ir al asistente
              </Button>
            }
          >
            Lo que se sube acá es lo que el asistente puede consultar, para todos los usuarios. Las
            novedades operativas entran solas; no hace falta subirlas.
          </EncabezadoVista>
        </div>

        <FormularioCarga />

        {lista.error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{lista.error.message}</AlertDescription>
          </Alert>
        ) : lista.isPending ? (
          <p className="mt-6 text-sm text-muted-foreground" role="status">
            Cargando…
          </p>
        ) : lista.data.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Todavía no hay documentos. Mientras tanto, el asistente sólo responde con las novedades
            operativas.
          </p>
        ) : (
          <Tabla documentos={lista.data} />
        )}
      </main>
    </>
  );
}

function FormularioCarga() {
  const subir = useSubirDocumento();
  const [arrastrando, setArrastrando] = useState(false);
  const [subido, setSubido] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  const enviar = (archivo: File | undefined) => {
    if (!archivo || subir.isPending) return;
    setSubido(null);
    subir.mutate(archivo, {
      onSuccess: (d) => setSubido(d.nombre),
      onSettled: () => {
        if (campo.current) campo.current.value = "";
      },
    });
  };

  return (
    <section className="mt-6" aria-labelledby="titulo-carga">
      <h2 id="titulo-carga" className="text-sm font-medium">
        Subir un documento
      </h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Zona de arrastre: el <label> abre el selector al hacer clic y
            recibe el archivo si se lo suelta encima. El input queda oculto
            pero accesible, así que el teclado llega igual. */}
        <label
          htmlFor="archivo"
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            enviar(e.dataTransfer.files[0]);
          }}
          className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 ${
            arrastrando ? "border-ring bg-accent-soft" : "border-border bg-card hover:border-ring hover:bg-panel-raised"
          } ${subir.isPending ? "pointer-events-none opacity-60" : ""}`}
        >
          <IconUpload size={20} stroke={1.75} className="mb-1 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">
            {subir.isPending ? "Subiendo…" : "Arrastre el archivo acá o haga clic para elegirlo"}
          </span>
          <span className="text-xs text-muted-foreground">
            .pptx o .docx, hasta 50 MB. PDF y Excel todavía no se pueden procesar.
          </span>
          <input
            ref={campo}
            id="archivo"
            type="file"
            accept=".pptx,.docx"
            className="sr-only"
            onChange={(e) => enviar(e.target.files?.[0])}
          />
        </label>

        <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Antes de subir</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            <li>Manuales, guías y formatos de procedimiento.</li>
            <li>
              No suba planillas con datos que ya están en SICOG: el asistente respondería con la
              cifra vieja del archivo.
            </li>
            <li>No suba documentos con datos personales; se rechazan.</li>
          </ul>
        </div>
      </div>

      {subir.error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{subir.error.message}</AlertDescription>
        </Alert>
      ) : subido ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Se subió «{subido}». Se procesa en segundo plano y tarda unos minutos; el estado se
          actualiza solo en la tabla.
        </p>
      ) : null}
    </section>
  );
}
const formatoFecha = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const tamano = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

function Tabla({ documentos }: { documentos: DocumentoRagDto[] }) {
  const eliminar = useEliminarDocumento();
  const reprocesar = useReprocesarDocumento();
  // Una confirmación abierta a la vez, en la propia fila (mismo patrón que
  // "Salir" en el encabezado): borrar saca el documento del corpus para todos.
  const [confirmando, setConfirmando] = useState<number | null>(null);

  return (
    <>
      {eliminar.error || reprocesar.error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{(eliminar.error ?? reprocesar.error)?.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-card text-left text-xs text-muted-foreground">
              <th scope="col" className="px-3 py-2 font-medium">Documento</th>
              <th scope="col" className="px-3 py-2 font-medium">Estado</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Fragmentos</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Diagramas sin describir</th>
              <th scope="col" className="px-3 py-2 font-medium">Subido</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((d) => (
              <tr key={d.id} className="border-b border-border align-top last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  {d.nombre}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {d.tipoArchivo} · <span className="font-mono tabular-nums">{tamano(d.tamanoBytes)}</span>
                  </span>
                </th>
                <td className="px-3 py-2">
                  <Estado documento={d} />
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {d.estado === "LISTO" ? d.chunks : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {d.estado === "LISTO" ? d.imagenesSinDescripcion : "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {d.subidoPor}
                  <span className="mt-0.5 block font-mono text-xs tabular-nums">
                    {formatoFecha.format(new Date(d.subidoEn))}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    {confirmando === d.id ? (
                      <>
                        <span className="self-center text-xs text-muted-foreground">
                          ¿Sacarlo del corpus?
                        </span>
                        {/* El peso marcado va en confirmar y el normal en
                            cancelar (La Regla del Peso Invertido). */}
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={eliminar.isPending}
                          onClick={() => eliminar.mutate(d.id, { onSuccess: () => setConfirmando(null) })}
                        >
                          {eliminar.isPending ? "Eliminando…" : "Sí, eliminar"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmando(null)}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={d.estado === "PROCESANDO" || d.estado === "PENDIENTE" || reprocesar.isPending}
                          onClick={() => reprocesar.mutate(d.id)}
                        >
                          Reprocesar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={d.estado === "PROCESANDO"}
                          title={d.estado === "PROCESANDO" ? "Espere a que termine de procesarse" : undefined}
                          onClick={() => setConfirmando(d.id)}
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {documentos.some((d) => d.imagenesSinDescripcion > 0) ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Los diagramas (como el esquema de la red de gasoductos) no se pueden leer como texto: el
          asistente los ignora hasta que alguien escriba qué muestran. Esa función todavía no existe.
        </p>
      ) : null}
    </>
  );
}

function Estado({ documento: d }: { documento: DocumentoRagDto }) {
  if (d.estado === "ERROR") {
    return (
      <>
        <span className="rounded-md bg-danger-soft px-1.5 py-0.5 text-xs text-destructive">Error</span>
        {d.errorDetalle ? (
          <span className="mt-1 block max-w-xs text-xs text-muted-foreground">{d.errorDetalle}</span>
        ) : null}
      </>
    );
  }
  if (d.estado === "PENDIENTE" || d.estado === "PROCESANDO") {
    return (
      <span className="rounded-md bg-warn-soft px-1.5 py-0.5 text-xs text-warn" role="status">
        {d.estado === "PENDIENTE" ? "En cola" : "Procesando…"}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">Listo</span>;
}
