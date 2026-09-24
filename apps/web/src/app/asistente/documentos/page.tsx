"use client";

import type { DocumentoRagDto } from "@sicog/shared-types";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTENEDOR } from "@/components/contenedor";
import { Encabezado } from "@/components/encabezado";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { GuardiaSesion } from "@/components/guardia-sesion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            meta={lista.data ? `${lista.data.length} ${lista.data.length === 1 ? "documento" : "documentos"}` : null}
          >
            Manuales, guías y formatos de procedimiento. No suba planillas cuyos datos ya están en
            SICOG —el asistente respondería con la cifra vieja del Excel— ni documentos con datos
            personales. Las novedades operativas entran solas, no hace falta subirlas.
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
  const [archivo, setArchivo] = useState<File | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  return (
    <form
      className="mt-6 flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!archivo) return;
        subir.mutate(archivo, {
          onSuccess: () => {
            setArchivo(null);
            if (campo.current) campo.current.value = "";
          },
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="archivo">Archivo (.pptx o .docx)</Label>
        <Input
          ref={campo}
          id="archivo"
          type="file"
          accept=".pptx,.docx"
          aria-invalid={subir.isError || undefined}
          onChange={(e) => {
            subir.reset();
            setArchivo(e.target.files?.[0] ?? null);
          }}
        />
      </div>
      <Button type="submit" disabled={!archivo || subir.isPending}>
        {subir.isPending ? "Subiendo…" : "Subir"}
      </Button>
      {subir.error ? (
        <Alert variant="destructive" className="basis-full">
          <AlertDescription>{subir.error.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
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
              <th scope="col" className="px-3 py-2 text-right font-medium">Esquemas sin descripción</th>
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
