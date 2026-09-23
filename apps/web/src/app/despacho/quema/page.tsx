"use client";

import type { QuemaNacionalDto, TipoCorte } from "@sicog/shared-types";
import { useState } from "react";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { comoTexto, evaluarCelda } from "@/components/celda-volumen";
import { TablaHistorial } from "@/components/historial-correcciones";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEPARTAMENTO_DESPACHO,
  formatearVolumen,
  hoy,
  puedeEditarDespacho,
  useGuardarQuema,
  useHistorialQuema,
  useEditarHistorial,
  useQuemaDelDia,
} from "@/lib/despacho";
import { useSesion } from "@/lib/sesion";
import { EncabezadoVista } from "@/components/encabezado-vista";

/**
 * La quema nacional es **una sola cifra por día y por corte**, no una grilla.
 *
 * Por eso esta pantalla no tiene tabla ni filtros de sistema: lo único que se
 * elige es el día y el corte. El historial de correcciones sí se muestra —en
 * las grillas queda escondido porque serían cien historiales, acá cabe al lado
 * de la cifra y es justamente lo que se quiere ver cuando el número cambió
 * tres veces en la mañana.
 */
export default function QuemaNacionalPage() {
  const { sesion } = useSesion();
  const [fecha, setFecha] = useState(hoy);
  const [tipoCorte, setTipoCorte] = useState<TipoCorte>("PUNTUAL");

  const dia = useQuemaDelDia(fecha, tipoCorte);
  const quema = dia.data?.quema ?? null;
  const historial = useHistorialQuema(quema?.id ?? null);
  const editarHistorial = useEditarHistorial("quema-nacional", quema?.id ?? null, fecha);

  const puedeEditar = puedeEditarDespacho(sesion);
  // Igual que en Balance Diario: el `CIERRE_PROMEDIO` lo escribe únicamente el
  // job de medianoche (decisión #42), así que una fila que no existe no se
  // puede crear desde acá; una que ya existe sí se corrige.
  const editable = puedeEditar && (tipoCorte === "PUNTUAL" || quema !== null);

  return (
    <main>
      <EncabezadoVista titulo="Quema nacional">
        El total quemado en el día. No entra ni en el recibido ni en el transportado
        del Balance Nación: se informa aparte.
      </EncabezadoVista>

      <AvisoSoloConsulta sesion={sesion} departamento={DEPARTAMENTO_DESPACHO} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="corte">Corte</Label>
          <select
            id="corte"
            value={tipoCorte}
            onChange={(e) => setTipoCorte(e.target.value as TipoCorte)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="PUNTUAL">Puntual</option>
            <option value="CIERRE_PROMEDIO">Cierre promedio</option>
          </select>
        </div>
      </div>

      {tipoCorte === "CIERRE_PROMEDIO" ? (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          El cierre promedio lo calcula el job de medianoche con todos los valores que
          tuvo el puntual ese día. Acá no se puede crear; si ya existe, sí se corrige.
        </p>
      ) : null}

      {dia.isPending ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Cargando…
        </p>
      ) : dia.error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{dia.error.message}</AlertDescription>
        </Alert>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormularioQuema quema={quema} fecha={fecha} tipoCorte={tipoCorte} editable={editable} />

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-xs font-medium text-muted-foreground">
              Correcciones del día
            </h2>
            {quema === null ? (
              <p className="mt-2 text-sm text-muted-foreground">Sin valor cargado.</p>
            ) : (
              // La misma cuadrícula que despliegan las grillas de Balance y
              // Fuentes, con el vigente arriba: acá cabe a la vista porque es
              // una sola cifra por día (decisión #68).
              <div className="mt-2">
                <TablaHistorial
                  valorActual={quema.mmpced}
                  horaActual={quema.horaLectura}
                  usuarioActual={quema.usuarioNombre}
                  editadoPorActual={quema.editadoPor}
                  editadoEnActual={quema.editadoEn}
                  entradas={historial.data?.data ?? []}
                  editar={
                    puedeEditar
                      ? {
                          guardar: (historialId, valor) =>
                            editarHistorial.mutate({ historialId, valor }),
                          enCurso: editarHistorial.isPending,
                        }
                      : undefined
                  }
                />
              </div>
            )}
            {editarHistorial.error ? (
              <p className="mt-2 text-xs text-destructive" role="alert">
                {editarHistorial.error.message}
              </p>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}

/**
 * Un solo formulario —volumen y hora juntos— igual que en las dos grillas.
 * Acá no hace falta un modo "editando" aparte: es un solo registro por día y
 * corte, así que el formulario está siempre a la vista cuando se puede tocar.
 */
function FormularioQuema({
  quema,
  fecha,
  tipoCorte,
  editable,
}: {
  quema: QuemaNacionalDto | null;
  fecha: string;
  tipoCorte: TipoCorte;
  editable: boolean;
}) {
  const guardar = useGuardarQuema(fecha, tipoCorte);
  const [volumenTexto, setVolumenTexto] = useState(comoTexto(quema?.mmpced ?? null));
  const [horaTexto, setHoraTexto] = useState(quema?.horaLectura ?? "");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Si cambia el día/corte elegido, o el guardado trae otro valor vigente, el
  // formulario tiene que reflejarlo — mismo criterio que `CeldaVolumen`.
  const [quemaAnterior, setQuemaAnterior] = useState(quema);
  if (quema !== quemaAnterior) {
    setQuemaAnterior(quema);
    setVolumenTexto(comoTexto(quema?.mmpced ?? null));
    setHoraTexto(quema?.horaLectura ?? "");
  }

  const confirmar = () => {
    const resultado = evaluarCelda(volumenTexto, quema?.mmpced ?? null);
    if (resultado.tipo === "rechazar") {
      setErrorLocal(resultado.mensaje);
      return;
    }
    const mmpced = resultado.tipo === "guardar" ? resultado.numero : (quema?.mmpced ?? null);
    if (mmpced === null) {
      setErrorLocal("Hace falta un volumen");
      return;
    }
    setErrorLocal(null);
    guardar.mutate({
      quemaId: quema?.id ?? null,
      mmpced,
      horaLectura: horaTexto === "" ? null : horaTexto,
    });
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-xs font-medium text-muted-foreground">MMPCED quemados</h2>
      {editable ? (
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="quema-volumen" className="text-xs">
              Volumen (MMPCED)
            </Label>
            <Input
              id="quema-volumen"
              inputMode="decimal"
              value={volumenTexto}
              onChange={(e) => {
                setVolumenTexto(e.target.value);
                setErrorLocal(null);
              }}
              className="h-8 w-32 font-mono tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quema-hora" className="text-xs">
              Hora de la lectura
            </Label>
            <Input
              id="quema-hora"
              type="time"
              value={horaTexto}
              onChange={(e) => setHoraTexto(e.target.value)}
              className="h-8 w-28"
            />
          </div>
          <Button disabled={guardar.isPending} onClick={confirmar}>
            {guardar.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-2xl tabular-nums">
            {quema === null ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              formatearVolumen(quema.mmpced)
            )}
          </span>
          {quema?.horaLectura ? (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {quema.horaLectura}
            </span>
          ) : null}
        </div>
      )}
      {(errorLocal ?? guardar.error?.message) ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {errorLocal ?? guardar.error?.message}
        </p>
      ) : null}
      {quema === null && tipoCorte === "CIERRE_PROMEDIO" ? (
        <p className="mt-3 text-xs text-muted-foreground">Todavía no se cerró este día.</p>
      ) : null}
    </section>
  );
}
