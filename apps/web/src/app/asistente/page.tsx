"use client";

import type { FuenteRagDto } from "@sicog/shared-types";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CONTENEDOR } from "@/components/contenedor";
import { Encabezado } from "@/components/encabezado";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { GuardiaSesion } from "@/components/guardia-sesion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { consultarAsistente } from "@/lib/asistente";
import { useSesion } from "@/lib/sesion";

export default function AsistentePage() {
  return (
    <GuardiaSesion>
      <Asistente />
    </GuardiaSesion>
  );
}

type Fase = "buscando" | "esperando" | "escribiendo" | "lista" | "detenida" | "error";

interface Intercambio {
  id: number;
  pregunta: string;
  fuentes: FuenteRagDto[];
  respuesta: string;
  fase: Fase;
  /** Cuántas respuestas hay por delante, si el modelo está ocupado. */
  porDelante: number;
  error: string | null;
}

/**
 * El asistente de consulta (Fase 2, §16): responde con los documentos
 * cargados y el histórico de novedades operativas, citando de dónde sale cada
 * dato.
 *
 * Cada pregunta es independiente —el modelo no recuerda las anteriores— y la
 * pantalla lo dice, para que nadie escriba "¿y en 2022?" esperando que sepa
 * de qué se hablaba.
 */
function Asistente() {
  const { sesion } = useSesion();
  const [pregunta, setPregunta] = useState("");
  const [intercambios, setIntercambios] = useState<Intercambio[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const control = useRef<AbortController | null>(null);
  const siguienteId = useRef(1);

  // Si se sale de la pantalla a mitad de una respuesta, se corta: el servidor
  // aborta también la generación y libera el modelo para el siguiente.
  useEffect(() => () => control.current?.abort(), []);

  if (!sesion) return null;

  const actualizar = (id: number, cambio: (i: Intercambio) => Intercambio) =>
    setIntercambios((lista) => lista.map((i) => (i.id === id ? cambio(i) : i)));

  const enviar = async () => {
    const texto = pregunta.trim();
    if (texto.length < 3 || ocupado) return;
    const id = siguienteId.current++;
    const ctrl = new AbortController();
    control.current = ctrl;
    setOcupado(true);
    setPregunta("");
    setIntercambios((lista) => [
      ...lista,
      { id, pregunta: texto, fuentes: [], respuesta: "", fase: "buscando", porDelante: 0, error: null },
    ]);

    try {
      await consultarAsistente(texto, ctrl.signal, (e) => {
        if (e.tipo === "fuentes") actualizar(id, (i) => ({ ...i, fuentes: e.fuentes }));
        else if (e.tipo === "espera") actualizar(id, (i) => ({ ...i, fase: "esperando", porDelante: e.posicion }));
        else if (e.tipo === "texto")
          actualizar(id, (i) => ({ ...i, fase: "escribiendo", respuesta: i.respuesta + e.texto }));
        else if (e.tipo === "error") actualizar(id, (i) => ({ ...i, fase: "error", error: e.mensaje }));
        else if (e.tipo === "fin") actualizar(id, (i) => ({ ...i, fase: i.fase === "error" ? "error" : "lista" }));
      });
    } catch (err) {
      if (ctrl.signal.aborted) {
        actualizar(id, (i) => ({ ...i, fase: "detenida" }));
      } else {
        const mensaje = err instanceof ApiError ? err.message : "No se pudo contactar al servidor.";
        actualizar(id, (i) => ({ ...i, fase: "error", error: mensaje }));
      }
    } finally {
      control.current = null;
      setOcupado(false);
    }
  };

  return (
    <>
      <Encabezado />
      <main className={`${CONTENEDOR} p-4`}>
        <div className="mt-4">
          <EncabezadoVista
            titulo="Asistente de consulta"
            meta={
              sesion.esSuperadmin ? (
                <Link href="/asistente/documentos" className="text-primary hover:underline">
                  Administrar documentos
                </Link>
              ) : null
            }
          >
            Responde con los documentos cargados y el histórico de novedades operativas, y cita de
            dónde sale cada dato. Verifique la fuente antes de usar una cifra: es un modelo de
            lenguaje y puede equivocarse. Cada pregunta se responde por separado; no recuerda las
            anteriores.
          </EncabezadoVista>
        </div>

        <form
          className="mt-6 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void enviar();
          }}
        >
          <div className="min-w-64 flex-1 space-y-1.5">
            <Label htmlFor="pregunta">Pregunta</Label>
            <Input
              id="pregunta"
              value={pregunta}
              maxLength={1000}
              autoComplete="off"
              placeholder="¿Qué diámetro tiene el gasoducto EPA - Puerto Ordaz?"
              onChange={(e) => setPregunta(e.target.value)}
            />
          </div>
          {ocupado ? (
            <Button type="button" variant="outline" onClick={() => control.current?.abort()}>
              Detener
            </Button>
          ) : (
            <Button type="submit" disabled={pregunta.trim().length < 3}>
              Consultar
            </Button>
          )}
        </form>

        {intercambios.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Todavía no hay preguntas. La respuesta puede tardar cerca de un minuto: el modelo corre
            en el propio servidor de SICOG, sin servicios externos.
          </p>
        ) : (
          <ol className="mt-6 space-y-4">
            {intercambios.map((i) => (
              <li key={i.id}>
                <Respuesta intercambio={i} />
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}

const ESTADO: Partial<Record<Fase, string>> = {
  buscando: "Buscando en los documentos…",
  escribiendo: "Escribiendo…",
  detenida: "Detenida.",
};

function Respuesta({ intercambio: i }: { intercambio: Intercambio }) {
  const estado =
    i.fase === "esperando"
      ? `En espera: ${i.porDelante === 1 ? "hay una consulta" : `hay ${i.porDelante} consultas`} antes que esta.`
      : ESTADO[i.fase];

  return (
    <article className="rounded-lg border border-border bg-card p-4" aria-busy={i.fase !== "lista" && i.fase !== "error" && i.fase !== "detenida"}>
      <h2 className="text-sm font-medium">{i.pregunta}</h2>

      {i.respuesta ? (
        <p className="mt-2 text-sm whitespace-pre-wrap">
          <ConCitas texto={i.respuesta} idIntercambio={i.id} fuentes={i.fuentes} />
        </p>
      ) : null}

      {estado ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          {estado}
        </p>
      ) : null}

      {i.error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{i.error}</AlertDescription>
        </Alert>
      ) : null}

      {i.fuentes.length > 0 ? (
        <div className="mt-4 border-t border-border pt-3">
          <h3 className="text-xs font-medium text-muted-foreground">Fuentes consultadas</h3>
          <ul className="mt-2 space-y-1.5">
            {i.fuentes.map((f) => (
              <li key={f.n} id={`fuente-${i.id}-${f.n}`}>
                <details className="group text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    <span className="font-mono tabular-nums">[{f.n}]</span> {rotulo(f)}
                  </summary>
                  <pre className="mt-1.5 max-h-64 overflow-auto rounded-md border border-border bg-background p-2 font-sans text-xs whitespace-pre-wrap text-muted-foreground">
                    {f.contenido}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function rotulo(f: FuenteRagDto): string {
  if (f.novedadId) return `Novedad operativa #${f.novedadId}`;
  const partes = [f.documento, f.origen != null ? `slide ${f.origen}` : null, f.seccion];
  return partes.filter(Boolean).join(" · ");
}

/**
 * La respuesta con cada "[n]" convertido en un enlace a su fuente, que además
 * la despliega: la cita existe para verificarla, no para leerla.
 */
function ConCitas({
  texto,
  idIntercambio,
  fuentes,
}: {
  texto: string;
  idIntercambio: number;
  fuentes: FuenteRagDto[];
}) {
  const existentes = new Set(fuentes.map((f) => f.n));
  return (
    <>
      {texto.split(/(\[\d+\])/g).map((parte, k) => {
        const n = /^\[(\d+)\]$/.exec(parte)?.[1];
        if (!n || !existentes.has(Number(n))) return parte;
        const destino = `fuente-${idIntercambio}-${n}`;
        return (
          <a
            key={k}
            href={`#${destino}`}
            className="font-mono text-xs text-primary tabular-nums hover:underline"
            onClick={() => {
              const detalle = document.getElementById(destino)?.querySelector("details");
              if (detalle) detalle.open = true;
            }}
          >
            [{n}]
          </a>
        );
      })}
    </>
  );
}
