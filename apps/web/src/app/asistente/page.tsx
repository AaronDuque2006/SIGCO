"use client";

import type { ConsultaPropiaRagDto, FuenteRagDto } from "@sicog/shared-types";
import { useQueryClient } from "@tanstack/react-query";
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
import { CLAVE_MIS_CONSULTAS, consultarAsistente, useMisConsultas, useValorarRespuesta } from "@/lib/asistente";
import { evidencias, type Evidencia } from "@/lib/evidencia";
import { useSesion } from "@/lib/sesion";

export default function AsistentePage() {
  return (
    <GuardiaSesion>
      <Asistente />
    </GuardiaSesion>
  );
}

type Fase = "buscando" | "esperando" | "leyendo" | "escribiendo" | "lista" | "detenida" | "error";

interface Intercambio {
  id: number;
  /** El id en el servidor, para valorarla; null si no se pudo registrar. */
  consultaId: string | null;
  pregunta: string;
  fuentes: FuenteRagDto[];
  respuesta: string;
  fase: Fase;
  /** Cuántas respuestas hay por delante, si el modelo está ocupado. */
  porDelante: number;
  error: string | null;
  /** Para el cronómetro: la espera es de casi un minuto y tiene que verse viva. */
  inicio: number;
  duracion: number | null;
}

// Preguntas que el asistente contesta bien con el Manual DAO cargado — están
// en el set de evaluación (§16.9). Si el manual se saca del corpus, cambiarlas.
const EJEMPLOS = [
  "¿Qué es la holgura operacional?",
  "¿Qué diámetro tiene el gasoducto EPA - Puerto Ordaz y cuándo entró en servicio?",
  "¿Cuánto gas envió Cardón al sistema Ulé - Amuay en 2021?",
  "¿Qué novedades hubo por mantenimiento programado?",
];

// Fuera del componente: se llama sólo desde manejadores de eventos, pero el
// lint de pureza de React no distingue eso de una llamada durante el render.
const ahora = (): number => Date.now();

const enCurso = (f: Fase) => f === "buscando" || f === "esperando" || f === "leyendo" || f === "escribiendo";

/** El error de la API se traduce a lo que le sirve a quien pregunta. */
function mensajeDeError(err: unknown): string {
  if (err instanceof ApiError) {
    // 403 trae su propio motivo (el límite de consultas, por ejemplo).
    if (err.status === 403 || err.status === 422) return err.message;
    if (err.status === 401) return "La sesión venció. Vuelva a iniciar sesión.";
  }
  return "El asistente no está disponible en este momento. Intente de nuevo en unos minutos; si sigue igual, avise al administrador del sistema.";
}

/**
 * El asistente de consulta (Fase 2, §16): responde con los documentos
 * cargados y el histórico de novedades operativas, citando de dónde sale cada
 * dato.
 *
 * La respuesta más reciente va arriba, pegada al campo: con el campo arriba y
 * las respuestas abajo en orden de llegada, cada pregunta nueva quedaba al
 * fondo de la página.
 */
function Asistente() {
  const { sesion } = useSesion();
  const [pregunta, setPregunta] = useState("");
  const [intercambios, setIntercambios] = useState<Intercambio[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const control = useRef<AbortController | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const siguienteId = useRef(1);
  const cliente = useQueryClient();

  // Si se sale de la pantalla a mitad de una respuesta, se corta: el servidor
  // aborta también la generación y libera el modelo para el siguiente.
  useEffect(() => () => control.current?.abort(), []);

  if (!sesion) return null;

  const actualizar = (id: number, cambio: (i: Intercambio) => Intercambio) =>
    setIntercambios((lista) => lista.map((i) => (i.id === id ? cambio(i) : i)));

  const preguntar = async (textoPregunta: string) => {
    const texto = textoPregunta.trim();
    if (texto.length < 3 || ocupado) return;
    const id = siguienteId.current++;
    const ctrl = new AbortController();
    control.current = ctrl;
    setOcupado(true);
    setPregunta("");
    const inicio = ahora();
    setIntercambios((lista) => [
      { id, consultaId: null, pregunta: texto, fuentes: [], respuesta: "", fase: "buscando", porDelante: 0, error: null, inicio, duracion: null },
      ...lista,
    ]);
    const cerrar = (fase: Fase, error: string | null = null) =>
      actualizar(id, (i) => ({ ...i, fase, error, duracion: ahora() - inicio }));

    try {
      await consultarAsistente(texto, ctrl.signal, (e) => {
        if (e.tipo === "consulta") actualizar(id, (i) => ({ ...i, consultaId: e.id }));
        else if (e.tipo === "fuentes") actualizar(id, (i) => ({ ...i, fuentes: e.fuentes, fase: "leyendo" }));
        else if (e.tipo === "espera") actualizar(id, (i) => ({ ...i, fase: "esperando", porDelante: e.posicion }));
        else if (e.tipo === "texto")
          actualizar(id, (i) => ({ ...i, fase: "escribiendo", respuesta: i.respuesta + e.texto }));
        else if (e.tipo === "error") cerrar("error", mensajeDeError(null));
        else if (e.tipo === "fin") actualizar(id, (i) => (i.fase === "error" ? i : { ...i, fase: "lista", duracion: ahora() - inicio }));
      });
    } catch (err) {
      if (ctrl.signal.aborted) cerrar("detenida");
      else cerrar("error", mensajeDeError(err));
    } finally {
      control.current = null;
      setOcupado(false);
      // La que acaba de terminar ya quedó en la base: el historial la trae,
      // aunque la deja afuera mientras siga a la vista arriba.
      void cliente.invalidateQueries({ queryKey: CLAVE_MIS_CONSULTAS });
      campo.current?.focus();
    }
  };

  const reintentar = (texto: string) => {
    // Desde el historial, la respuesta nueva aparece arriba: se vuelve ahí.
    campo.current?.scrollIntoView({ block: "center" });
    setPregunta(texto);
    void preguntar(texto);
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
                <Button variant="outline" nativeButton={false} render={<Link href="/asistente/documentos" />}>
                  Documentos cargados
                </Button>
              ) : null
            }
          >
            Pregunte en lenguaje natural sobre los manuales cargados y las novedades operativas. Cada
            respuesta dice de qué documento sale.
          </EncabezadoVista>
        </div>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            void preguntar(pregunta);
          }}
        >
          <Label htmlFor="pregunta">Su pregunta</Label>
          <div className="mt-1.5 flex gap-3">
            <Input
              ref={campo}
              id="pregunta"
              value={pregunta}
              maxLength={1000}
              autoComplete="off"
              aria-describedby="pregunta-ayuda"
              onChange={(e) => setPregunta(e.target.value)}
            />
            {ocupado ? (
              <Button type="button" variant="outline" onClick={() => control.current?.abort()}>
                Detener
              </Button>
            ) : (
              <Button type="submit" disabled={pregunta.trim().length < 3}>
                Preguntar
              </Button>
            )}
          </div>
          <p id="pregunta-ayuda" className="mt-1.5 text-xs text-muted-foreground">
            Cada pregunta se responde por separado: el asistente no recuerda las anteriores. La
            respuesta tarda cerca de un minuto.
          </p>
        </form>

        {intercambios.length === 0 ? (
          <Ejemplos onElegir={reintentar} deshabilitado={ocupado} />
        ) : (
          <ol className="mt-6 space-y-4" aria-label="Respuestas, la más reciente primero">
            {intercambios.map((i) => (
              <li key={i.id}>
                <Respuesta intercambio={i} onReintentar={ocupado ? null : () => reintentar(i.pregunta)} />
              </li>
            ))}
          </ol>
        )}

        <MisConsultas
          ocultar={new Set(intercambios.map((i) => i.consultaId).filter((id): id is string => id !== null))}
          onPreguntarDeNuevo={ocupado ? null : reintentar}
        />
      </main>
    </>
  );
}

function Ejemplos({ onElegir, deshabilitado }: { onElegir: (p: string) => void; deshabilitado: boolean }) {
  return (
    <section className="mt-8" aria-labelledby="titulo-ejemplos">
      <h2 id="titulo-ejemplos" className="text-sm font-medium">
        Por ejemplo
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {EJEMPLOS.map((e) => (
          <li key={e}>
            <button
              type="button"
              disabled={deshabilitado}
              onClick={() => onElegir(e)}
              className="h-full w-full rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-ring hover:bg-panel-raised hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
            >
              {e}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

const formatoDia = new Intl.DateTimeFormat("es-VE", { weekday: "long", day: "numeric", month: "long" });
const formatoHora = new Intl.DateTimeFormat("es-VE", { hour: "2-digit", minute: "2-digit", hour12: false });

function rotuloDia(fecha: Date): string {
  const inicioDe = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((inicioDe(new Date()) - inicioDe(fecha)) / 86_400_000);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  const texto = formatoDia.format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * "Mis consultas" (decisión #108): las propias de los últimos 30 días,
 * agrupadas por día, con la respuesta y las fuentes tal como se mostraron. Una
 * respuesta vieja puede haber quedado desactualizada si cambiaron los
 * documentos; por eso cada una ofrece preguntarla de nuevo.
 */
function MisConsultas({
  ocultar,
  onPreguntarDeNuevo,
}: {
  /** Las de esta sesión, que ya se ven arriba. */
  ocultar: Set<string>;
  onPreguntarDeNuevo: ((pregunta: string) => void) | null;
}) {
  const lista = useMisConsultas();
  const visibles = (lista.data ?? []).filter((c) => !ocultar.has(c.id));

  const porDia = new Map<string, ConsultaPropiaRagDto[]>();
  for (const c of visibles) {
    const dia = rotuloDia(new Date(c.creadoEn));
    porDia.set(dia, [...(porDia.get(dia) ?? []), c]);
  }

  return (
    <section className="mt-10 border-t border-border pt-6" aria-labelledby="titulo-mis-consultas">
      <h2 id="titulo-mis-consultas" className="text-sm font-medium">
        Mis consultas
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Las de los últimos 30 días. Sólo las ve usted. Si los documentos cambiaron desde entonces, la
        respuesta puede no estar al día: pregúntela de nuevo.
      </p>

      {lista.error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{lista.error.message}</AlertDescription>
        </Alert>
      ) : lista.isPending ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Cargando…
        </p>
      ) : visibles.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {lista.data.length === 0 ? "Todavía no hizo ninguna consulta." : "Las de hoy están arriba."}
        </p>
      ) : (
        [...porDia.entries()].map(([dia, consultas]) => (
          <div key={dia} className="mt-4">
            <h3 className="text-xs font-medium text-muted-foreground">{dia}</h3>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-card">
              {consultas.map((c) => (
                <li key={c.id}>
                  <ConsultaDelHistorial consulta={c} onPreguntarDeNuevo={onPreguntarDeNuevo} />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

function ConsultaDelHistorial({
  consulta: c,
  onPreguntarDeNuevo,
}: {
  consulta: ConsultaPropiaRagDto;
  onPreguntarDeNuevo: ((pregunta: string) => void) | null;
}) {
  const idBase = `h${c.id}`;
  return (
    <details className="group px-3 py-2">
      <summary className="flex cursor-pointer items-baseline gap-3 text-sm">
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {formatoHora.format(new Date(c.creadoEn))}
        </span>
        <span className="min-w-0 flex-1 group-open:font-medium">{c.pregunta}</span>
        {c.util === false ? <span className="shrink-0 text-xs text-muted-foreground">Marcada: no sirvió</span> : null}
      </summary>
      <div className="mt-2 pb-1 pl-12">
        {c.respuesta ? (
          <p className="max-w-[75ch] text-sm leading-relaxed whitespace-pre-wrap">
            <ConCitas texto={c.respuesta} idIntercambio={idBase} fuentes={c.fuentes} />
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {c.anteriorAlHistorial
              ? "Es de antes de que se guardaran las respuestas; pregúntela de nuevo para verla."
              : "Se cortó antes de que el asistente respondiera."}
          </p>
        )}
        {c.fuentes.length > 0 ? (
          <div className="mt-3">
            <Fuentes texto={c.respuesta ?? ""} fuentes={c.fuentes} idIntercambio={idBase} />
          </div>
        ) : null}
        {onPreguntarDeNuevo ? (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => onPreguntarDeNuevo(c.pregunta)}>
            Preguntar de nuevo
          </Button>
        ) : null}
      </div>
    </details>
  );
}

/** Segundos desde que se hizo la pregunta, mientras sigue en curso. */
function Cronometro({ desde }: { desde: number }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span>
      <span className="font-mono tabular-nums">{Math.max(0, Math.round((ahora - desde) / 1000))}</span> s
    </span>
  );
}

function textoDeEstado(i: Intercambio): string {
  switch (i.fase) {
    case "buscando":
      return "Buscando en los documentos";
    case "esperando":
      return i.porDelante === 1
        ? "En espera: hay otra consulta antes que esta"
        : `En espera: hay ${i.porDelante} consultas antes que esta`;
    case "leyendo":
      return `Leyendo ${i.fuentes.length} ${i.fuentes.length === 1 ? "fragmento" : "fragmentos"} · suele tardar cerca de un minuto`;
    case "escribiendo":
      return "Escribiendo";
    default:
      return "";
  }
}

function Respuesta({ intercambio: i, onReintentar }: { intercambio: Intercambio; onReintentar: (() => void) | null }) {
  const activa = enCurso(i.fase);

  return (
    <article className="rounded-lg border border-border bg-card p-4" aria-busy={activa}>
      <h2 className="text-sm font-medium">{i.pregunta}</h2>

      {i.respuesta ? (
        <p className="mt-2 max-w-[75ch] text-sm leading-relaxed whitespace-pre-wrap">
          <ConCitas texto={i.respuesta} idIntercambio={String(i.id)} fuentes={i.fuentes} />
        </p>
      ) : null}

      {activa ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          <span className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" aria-hidden />
          {textoDeEstado(i)}
          <span aria-hidden>·</span>
          <Cronometro desde={i.inicio} />
        </p>
      ) : null}

      {i.fase === "detenida" || i.fase === "error" ? (
        <div className="mt-3 space-y-3">
          {i.error ? (
            <Alert variant="destructive">
              <AlertDescription>{i.error}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">Detuvo esta respuesta.</p>
          )}
          {onReintentar ? (
            <Button variant="outline" size="sm" onClick={onReintentar}>
              Preguntar de nuevo
            </Button>
          ) : null}
        </div>
      ) : null}

      {i.fuentes.length > 0 && i.fase === "lista" ? (
        <div className="mt-4 border-t border-border pt-3">
          <Fuentes texto={i.respuesta} fuentes={i.fuentes} idIntercambio={String(i.id)} />
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            {i.consultaId ? <Valoracion consultaId={i.consultaId} /> : <span />}
            {i.duracion !== null ? (
              <p className="text-xs text-muted-foreground">
                Respondida en <span className="font-mono tabular-nums">{Math.round(i.duracion / 1000)}</span> s
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

/**
 * "¿Le sirvió?". Un "No" pide, opcional, qué estuvo mal: esa frase es lo que
 * después le permite al superadmin entender la falla sin repetir la consulta.
 */
function Valoracion({ consultaId }: { consultaId: string }) {
  const valorar = useValorarRespuesta();
  const [dijoNo, setDijoNo] = useState(false);
  const [comentario, setComentario] = useState("");
  const [enviada, setEnviada] = useState<boolean | null>(null);

  if (enviada !== null) {
    return (
      <p className="text-xs text-muted-foreground" role="status">
        {enviada ? "Gracias, quedó registrado." : "Gracias. Lo va a revisar el administrador del sistema."}
      </p>
    );
  }

  const enviar = (util: boolean) =>
    valorar.mutate(
      { id: consultaId, valoracion: { util, comentario: util ? null : comentario.trim() || null } },
      { onSuccess: () => setEnviada(util) },
    );

  if (dijoNo) {
    return (
      <form
        className="flex min-w-0 flex-1 flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(false);
        }}
      >
        <div className="min-w-56 flex-1 space-y-1.5">
          <Label htmlFor={`comentario-${consultaId}`}>¿Qué estuvo mal? (opcional)</Label>
          <Input
            id={`comentario-${consultaId}`}
            value={comentario}
            maxLength={500}
            autoFocus
            placeholder="Por ejemplo: el dato es de otro año"
            onChange={(e) => setComentario(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={valorar.isPending}>
          Enviar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDijoNo(false)}>
          Cancelar
        </Button>
        {valorar.error ? <p className="basis-full text-xs text-destructive">{valorar.error.message}</p> : null}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span id={`valorar-${consultaId}`}>¿Le sirvió?</span>
      <div role="group" aria-labelledby={`valorar-${consultaId}`} className="flex gap-1.5">
        <Button variant="outline" size="xs" disabled={valorar.isPending} onClick={() => enviar(true)}>
          Sí
        </Button>
        <Button variant="outline" size="xs" disabled={valorar.isPending} onClick={() => setDijoNo(true)}>
          No
        </Button>
      </div>
      {valorar.error ? <span className="text-destructive">{valorar.error.message}</span> : null}
    </div>
  );
}

/** Las citadas a la vista; las consultadas sin citar, plegadas. */
function Fuentes({ texto, fuentes, idIntercambio }: { texto: string; fuentes: FuenteRagDto[]; idIntercambio: string }) {
  const citadas = new Set([...texto.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
  const fuentesCitadas = fuentes.filter((f) => citadas.has(f.n));
  const otras = fuentes.filter((f) => !citadas.has(f.n));
  const evidencia = evidencias(texto, fuentesCitadas);
  return (
    <>
      {fuentesCitadas.length > 0 ? (
        <>
          <h3 className="text-xs font-medium text-muted-foreground">Fuentes · verifique la cifra antes de usarla</h3>
          <ListaFuentes fuentes={fuentesCitadas} idIntercambio={idIntercambio} evidencia={evidencia} />
        </>
      ) : null}
      {otras.length > 0 ? (
        <details className={fuentesCitadas.length > 0 ? "mt-3" : undefined}>
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            {fuentesCitadas.length > 0
              ? `${otras.length} ${otras.length === 1 ? "fragmento más consultado" : "fragmentos más consultados"}, sin citar`
              : `${otras.length} ${otras.length === 1 ? "fragmento consultado" : "fragmentos consultados"}`}
          </summary>
          <ListaFuentes fuentes={otras} idIntercambio={idIntercambio} />
        </details>
      ) : null}
    </>
  );
}

// Tope de líneas de evidencia por fuente: si una cifra aparece en muchas
// filas (un "1" o un "2"), no identifica ninguna y mostrarlas todas es ruido.
const MAX_EVIDENCIAS = 3;

function ListaFuentes({
  fuentes,
  idIntercambio,
  evidencia,
}: {
  fuentes: FuenteRagDto[];
  idIntercambio: string;
  /** Dónde está cada cifra de la respuesta en la fuente; sólo en las citadas. */
  evidencia?: Map<number, Evidencia[]>;
}) {
  return (
    <ul className="mt-2 space-y-1.5">
      {fuentes.map((f) => {
        const lineas = evidencia?.get(f.n) ?? [];
        const aMostrar = lineas.length <= MAX_EVIDENCIAS ? lineas : [];
        const resaltar = new Set(aMostrar.flatMap((e) => e.pares));
        return (
          <li key={f.n} id={`fuente-${idIntercambio}-${f.n}`} className="scroll-mt-4">
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                <span className="font-mono text-primary tabular-nums">[{f.n}]</span> {rotulo(f)}
                {aMostrar.map((e, i) => (
                  <span key={i} className="mt-1 block pl-7 text-xs text-foreground">
                    {e.pares.includes(e.fila) ? null : (
                      <>
                        <span className="text-muted-foreground">{e.fila}</span>
                        <span className="text-muted-foreground"> … </span>
                      </>
                    )}
                    {e.pares.map((par, j) => (
                      <span key={j}>
                        {j > 0 ? <span className="text-muted-foreground"> · </span> : null}
                        <Resaltado>{par}</Resaltado>
                      </span>
                    ))}
                  </span>
                ))}
              </summary>
              <pre className="mt-1.5 max-h-64 overflow-auto rounded-md border border-border bg-background p-2 font-sans text-xs whitespace-pre-wrap text-muted-foreground">
                {resaltar.size ? <ConResaltado texto={f.contenido} pares={resaltar} /> : f.contenido}
              </pre>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * El valor del que sale la cifra de la respuesta. Azul Señal al 12%: marca lo
 * enfocado, como el foco de un campo — no es un color de estado.
 */
function Resaltado({ children }: { children: React.ReactNode }) {
  return <mark className="rounded-sm bg-accent-soft px-0.5 font-medium text-foreground">{children}</mark>;
}

/** El contenido completo de la fuente, con los mismos pares resaltados. */
function ConResaltado({ texto, pares }: { texto: string; pares: Set<string> }) {
  const patron = new RegExp(`(${[...pares].map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return (
    <>
      {texto.split(patron).map((parte, i) => (pares.has(parte) ? <Resaltado key={i}>{parte}</Resaltado> : parte))}
    </>
  );
}

function rotulo(f: FuenteRagDto): string {
  if (f.novedadId) return `Novedad operativa #${f.novedadId}`;
  const partes = [f.documento?.replace(/\.[^.]+$/, ""), f.origen != null ? `slide ${f.origen}` : null, f.seccion];
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
  idIntercambio: string;
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
            aria-label={`Ver la fuente ${n}`}
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
