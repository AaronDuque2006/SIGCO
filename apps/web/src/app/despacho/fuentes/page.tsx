"use client";

import type { FilaFuenteDiariaDto } from "@sicog/shared-types";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { AvanceDelDia } from "@/components/avance-del-dia";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { comoTexto, evaluarCelda } from "@/components/celda-volumen";
import {
  BotonCorrecciones,
  FilaHistorial,
  useDesplegable,
} from "@/components/historial-correcciones";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEPARTAMENTO_DESPACHO,
  formatearVolumen,
  hoy,
  puedeEditarDespacho,
  useGrillaFuentes,
  useGuardarLecturaFuente,
} from "@/lib/despacho";
import { exportarExcel } from "@/lib/exportar-excel";
import { useSesion } from "@/lib/sesion";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { IconFileTypeXls } from "@tabler/icons-react";

export default function LecturasFuentePage() {
  const { sesion } = useSesion();
  const [fecha, setFecha] = useState(hoy);
  const [sistema, setSistema] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Sin selector de corte: el modelo guarda una lectura por fuente y por día
  // (@@unique(fuenteId, fecha)); la mecánica puntual/cierre de la decisión #34
  // aplica a clientes y a la quema, no a las fuentes.
  const grilla = useGrillaFuentes(fecha);
  const filas = useMemo(() => grilla.data?.data ?? [], [grilla.data]);

  const sistemas = useMemo(
    () =>
      [...new Set(filas.map((f) => f.fuente.sistema.nombre))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [filas],
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter(
      (f) =>
        (sistema === "" || f.fuente.sistema.nombre === sistema) &&
        (q === "" || f.fuente.nombre.toLowerCase().includes(q)),
    );
  }, [filas, sistema, busqueda]);

  // Lo mismo que suma el recibido: residual más desvío (decisión #107).
  const total = visibles.reduce(
    (s, f) => s + (f.lectura?.volumenMmpced ?? 0) + (f.lectura?.desvio ?? 0),
    0,
  );
  const cargadas = visibles.filter((f) => f.lectura !== null).length;
  const puedeEditar = puedeEditarDespacho(sesion);

  return (
    <>
      <main>
        <EncabezadoVista
          titulo="Lecturas de fuentes"
          meta={
            <>
              total{" "}
              <span className="font-mono text-foreground tabular-nums">
                {formatearVolumen(total)}
              </span>{" "}
              MMPCED
            </>
          }
        >
          Esto es el <strong>recibido</strong> del balance: el gas que entra al sistema. Las
          entregas directas también suman, pero salen de sus lecturas en Balance Diario.
        </EncabezadoVista>

        <AvanceDelDia cargadas={cargadas} total={visibles.length} sustantivo="fuentes" />

        <AvisoSoloConsulta sesion={sesion} departamento={DEPARTAMENTO_DESPACHO} />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
            <Label htmlFor="sistema">Sistema</Label>
            <select
              id="sistema"
              value={sistema}
              onChange={(e) => setSistema(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Todos</option>
              {sistemas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="busqueda">Fuente</Label>
            <Input
              id="busqueda"
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            disabled={visibles.length === 0}
            onClick={() =>
              exportarExcel(
                `lecturas-fuente-${fecha}.xlsx`,
                "Lecturas de fuentes",
                [
                  { encabezado: "Fuente", ancho: 28 },
                  { encabezado: "Sistema", ancho: 24 },
                  { encabezado: "Hora", ancho: 10 },
                  { encabezado: "Procesado", ancho: 12 },
                  { encabezado: "Desvío", ancho: 12 },
                  { encabezado: "MMPCED", ancho: 12 },
                ],
                visibles.map((f) => [
                  f.fuente.nombre,
                  f.fuente.sistema.nombre,
                  f.lectura?.horaLectura ?? "",
                  f.fuente.procesaGas ? (f.lectura?.procesado ?? "") : "",
                  f.fuente.procesaGas ? (f.lectura?.desvio ?? "") : "",
                  f.lectura?.volumenMmpced ?? "",
                ]),
              )
            }
          >
            <IconFileTypeXls size={16} stroke={1.75} aria-hidden />
            Exportar Excel
          </Button>
        </div>

        {grilla.isPending ? (
          <p className="mt-6 text-sm text-muted-foreground" role="status">
            Cargando la grilla…
          </p>
        ) : grilla.error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{grilla.error.message}</AlertDescription>
          </Alert>
        ) : visibles.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Ninguna fuente coincide con el filtro.
          </p>
        ) : (
          <Tabla filas={visibles} fecha={fecha} puedeEditar={puedeEditar} />
        )}
      </main>
    </>
  );
}

function Tabla({
  filas,
  fecha,
  puedeEditar,
}: {
  filas: FilaFuenteDiariaDto[];
  fecha: string;
  puedeEditar: boolean;
}) {
  const { abierta, alternar } = useDesplegable();
  const [editando, setEditando] = useState<string | null>(null);

  return (
    <TablaDesplazable anchoMinimo="min-w-[40rem]">
      <thead>
        <tr className="bg-card text-left text-xs text-muted-foreground">
          <th scope="col" className={TH}>Fuente</th>
          <th scope="col" className={TH}>Sistema</th>
          <th scope="col" className={TH}>Hora</th>
          <th scope="col" className={`${TH} text-right`}>Procesado</th>
          <th scope="col" className={`${TH} text-right`}>Desvío</th>
          <th scope="col" className={`${TH} text-right`}>MMPCED</th>
          <th scope="col" className="px-3 py-1.5"><span className="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => {
          const clave = String(fila.fuente.id);
          const idPanel = `historial-fuente-${clave}`;
          const abierto = abierta === clave;
          return (
            <Fragment key={fila.fuente.id}>
              <FilaFuente
                fila={fila}
                fecha={fecha}
                puedeEditar={puedeEditar}
                editando={editando === clave}
                onEditar={() => setEditando(clave)}
                onListo={() => setEditando(null)}
                correccionesBoton={
                  <BotonCorrecciones
                    correcciones={fila.correcciones}
                    abierto={abierto}
                    onClick={() => alternar(clave)}
                    etiqueta={fila.fuente.nombre}
                    idPanel={idPanel}
                  />
                }
              />
              {abierto && fila.lectura ? (
                <FilaHistorial
                  recurso="lecturas-fuente"
                  lecturaId={fila.lectura.id}
                  columnas={7}
                  idPanel={idPanel}
                  valorActual={fila.lectura.volumenMmpced}
                  horaActual={fila.lectura.horaLectura}
                  usuarioActual={fila.lectura.usuarioNombre}
                />
              ) : null}
            </Fragment>
          );
        })}
      </tbody>
    </TablaDesplazable>
  );
}

/** Mismo formulario por fila que Balance Diario: volumen y hora juntos. */
function FilaFuente({
  fila,
  fecha,
  puedeEditar,
  editando,
  onEditar,
  onListo,
  correccionesBoton,
}: {
  fila: FilaFuenteDiariaDto;
  fecha: string;
  puedeEditar: boolean;
  editando: boolean;
  onEditar: () => void;
  onListo: () => void;
  correccionesBoton: ReactNode;
}) {
  const guardar = useGuardarLecturaFuente(fecha);
  const [volumenTexto, setVolumenTexto] = useState(comoTexto(fila.lectura?.volumenMmpced ?? null));
  const [horaTexto, setHoraTexto] = useState(fila.lectura?.horaLectura ?? "");
  const [procesadoTexto, setProcesadoTexto] = useState(
    comoTexto(fila.lectura?.procesado ?? null),
  );
  const [desvioTexto, setDesvioTexto] = useState(comoTexto(fila.lectura?.desvio ?? null));
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  if (editando) {
    const confirmar = () => {
      const resultado = evaluarCelda(volumenTexto, fila.lectura?.volumenMmpced ?? null);
      if (resultado.tipo === "rechazar") {
        setErrorLocal(resultado.mensaje);
        return;
      }
      const volumenMmpced =
        resultado.tipo === "guardar" ? resultado.numero : (fila.lectura?.volumenMmpced ?? null);
      if (volumenMmpced === null) {
        setErrorLocal("Hace falta un volumen");
        return;
      }

      // El procesado es informativo (no entra al balance), así que un valor
      // que no se puede interpretar simplemente no se manda — no vale la
      // pena bloquear el volumen, que sí importa, por un dato aparte.
      let procesado: number | null | undefined;
      let desvio: number | null | undefined;
      if (fila.fuente.procesaGas) {
        // El desvío, en cambio, sí suma al recibido (decisión #107): un
        // valor mal escrito frena el guardado igual que el volumen.
        const resultadoDesvio = evaluarCelda(desvioTexto, fila.lectura?.desvio ?? null);
        if (resultadoDesvio.tipo === "rechazar") {
          setErrorLocal(`Desvío: ${resultadoDesvio.mensaje}`);
          return;
        }
        desvio =
          resultadoDesvio.tipo === "guardar"
            ? resultadoDesvio.numero
            : resultadoDesvio.tipo === "reponer"
              ? null
              : undefined;

        const resultadoProcesado = evaluarCelda(procesadoTexto, fila.lectura?.procesado ?? null);
        procesado =
          resultadoProcesado.tipo === "guardar"
            ? resultadoProcesado.numero
            : resultadoProcesado.tipo === "reponer"
              ? null
              : undefined;
      }

      setErrorLocal(null);
      guardar.mutate(
        {
          fuenteId: fila.fuente.id,
          lecturaId: fila.lectura?.id ?? null,
          volumenMmpced,
          horaLectura: horaTexto === "" ? null : horaTexto,
          procesado,
          desvio,
        },
        { onSuccess: onListo },
      );
    };

    return (
      <tr className="border-b border-border last:border-0">
        <th scope="row" className="px-3 py-1.5 text-left font-normal">
          {fila.fuente.nombre}
        </th>
        <td className="px-3 py-1.5 text-muted-foreground">{fila.fuente.sistema.nombre}</td>
        <td className="px-3 py-1.5">
          <Input
            type="time"
            aria-label={`Hora de lectura de ${fila.fuente.nombre}`}
            value={horaTexto}
            onChange={(e) => setHoraTexto(e.target.value)}
            className="h-8 w-28"
          />
        </td>
        <td className="px-3 py-1.5">
          {/* Sólo las plantas que procesan gas (San Joaquín Tren A y B y
              Tren C) tienen este dato y el desvío en el workbook real; el
              resto de las fuentes no procesan nada. */}
          {fila.fuente.procesaGas ? (
            <Input
              inputMode="decimal"
              aria-label={`Procesado de ${fila.fuente.nombre} en MMPCED`}
              value={procesadoTexto}
              onChange={(e) => setProcesadoTexto(e.target.value)}
              className="h-8 w-28 text-right font-mono tabular-nums"
            />
          ) : (
            <span className="block text-right text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-3 py-1.5">
          {fila.fuente.procesaGas ? (
            <Input
              inputMode="decimal"
              aria-label={`Desvío de ${fila.fuente.nombre} en MMPCED`}
              value={desvioTexto}
              onChange={(e) => {
                setDesvioTexto(e.target.value);
                setErrorLocal(null);
              }}
              className="h-8 w-28 text-right font-mono tabular-nums"
            />
          ) : (
            <span className="block text-right text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-3 py-1.5">
          <Input
            inputMode="decimal"
            aria-label={`Volumen de ${fila.fuente.nombre} en MMPCED`}
            value={volumenTexto}
            onChange={(e) => {
              setVolumenTexto(e.target.value);
              setErrorLocal(null);
            }}
            className="h-8 w-28 text-right font-mono tabular-nums"
          />
        </td>
        <td className="px-3 py-1.5 text-right">
          <span className="inline-flex flex-col items-end gap-1">
            {(errorLocal ?? guardar.error?.message) ? (
              <span className="text-xs text-destructive" role="alert">
                {errorLocal ?? guardar.error?.message}
              </span>
            ) : null}
            <span className="inline-flex gap-2">
              <Button disabled={guardar.isPending} onClick={confirmar}>
                {guardar.isPending ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="outline" disabled={guardar.isPending} onClick={onListo}>
                Cancelar
              </Button>
            </span>
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <th scope="row" className="px-3 py-1.5 text-left font-normal">
        {fila.fuente.nombre}
      </th>
      <td className="px-3 py-1.5 text-muted-foreground">{fila.fuente.sistema.nombre}</td>
      <td className="px-3 py-1.5 font-mono text-xs tabular-nums text-muted-foreground">
        {fila.lectura?.horaLectura ?? "—"}
      </td>
      <td className="px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
        {!fila.fuente.procesaGas || fila.lectura?.procesado == null
          ? "—"
          : formatearVolumen(fila.lectura.procesado)}
      </td>
      <td className="px-3 py-1.5 text-right font-mono tabular-nums">
        {!fila.fuente.procesaGas || fila.lectura?.desvio == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          formatearVolumen(fila.lectura.desvio)
        )}
      </td>
      <td className="px-3 py-1.5 text-right font-mono tabular-nums">
        {fila.lectura === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          formatearVolumen(fila.lectura.volumenMmpced)
        )}
      </td>
      <td className="px-3 py-1.5 text-right">
        <span className="inline-flex items-center justify-end gap-2">
          {correccionesBoton}
          {puedeEditar ? (
            <Button variant="outline" onClick={onEditar}>
              Editar
            </Button>
          ) : null}
        </span>
      </td>
    </tr>
  );
}
