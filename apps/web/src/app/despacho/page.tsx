"use client";

import type { FilaBalanceDiarioDto, TipoCorte } from "@sicog/shared-types";
import { Fragment, useMemo, useState } from "react";
import { AvanceDelDia } from "@/components/avance-del-dia";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { CeldaVolumen } from "@/components/celda-volumen";
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
import { Select } from "@/components/ui/select";
import {
  DEPARTAMENTO_DESPACHO,
  formatearVolumen,
  hoy,
  puedeEditarDespacho,
  useBalanceNacion,
  useGrillaBalance,
  useGrillaTransferencias,
  useGuardarLectura,
  useSerieBalance,
} from "@/lib/despacho";
import { useSesion } from "@/lib/sesion";
import { TarjetasBalance } from "./tarjetas-balance";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { BloqueTransferencias } from "@/components/bloque-transferencias";

export default function BalanceDiarioPage() {
  const { sesion } = useSesion();
  const [fecha, setFecha] = useState(hoy);
  const [tipoCorte, setTipoCorte] = useState<TipoCorte>("PUNTUAL");
  const [sistema, setSistema] = useState("");
  const [sector, setSector] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const grilla = useGrillaBalance(fecha, tipoCorte);
  const balance = useBalanceNacion(fecha, tipoCorte);
  const transferencias = useGrillaTransferencias(fecha, tipoCorte);
  // La misma serie que alimenta la gráfica de Reportes, en la ventana del
  // workbook. No entra en la compuerta de carga de la vista: es contexto, no el
  // dato del día, y hacer esperar la grilla por él sería cobrarle a la tarea el
  // precio de la referencia.
  const serie = useSerieBalance(fecha, 7, tipoCorte);
  const filas = useMemo(() => grilla.data?.data ?? [], [grilla.data]);

  // Las tres consultas describen el mismo día, así que la pantalla espera a las
  // tres y aparece entera. Dejarlas entrar de a una hacía saltar el layout tres
  // veces —tarjetas, grilla y transferencias, cada una con su propio
  // "Cargando…"— justo en la pantalla donde se pasa el turno completo.
  const error = grilla.error ?? balance.error ?? transferencias.error;
  const listo =
    balance.data !== undefined && transferencias.data !== undefined && !grilla.isPending;

  // Los sistemas salen de las filas ya cargadas y no de un catálogo aparte: la
  // grilla trae el sistema de cada cliente y todavía no existe el endpoint de
  // catálogos del §11. De paso, sólo se listan los que tienen clientes.
  const sistemas = useMemo(
    () => [...new Set(filas.map((f) => f.cliente.sistema.nombre))].sort((a, b) => a.localeCompare(b, "es")),
    [filas],
  );

  // Mismo criterio que con los sistemas (decisión #60): el desplegable se arma
  // con los sectores presentes en las filas. `Empresa Mixta` existe en el
  // catálogo pero hoy no tiene clientes, así que no se ofrece.
  const sectores = useMemo(
    () =>
      [...new Set(filas.map((f) => f.cliente.sector.nombre))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [filas],
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter(
      (f) =>
        (sistema === "" || f.cliente.sistema.nombre === sistema) &&
        (sector === "" || f.cliente.sector.nombre === sector) &&
        (q === "" || f.cliente.nombre.toLowerCase().includes(q)),
    );
  }, [filas, sistema, sector, busqueda]);

  const total = visibles.reduce((suma, f) => suma + (f.lectura?.volumenMmpced ?? 0), 0);
  const cargadas = visibles.filter((f) => f.lectura !== null).length;

  // Decisión #22: se puede consultar cualquier departamento, editar sólo el
  // propio. Quien no edita Despacho ve la grilla completa, en modo lectura, y
  // `AvisoSoloConsulta` le dice por qué.
  const puedeEditar = puedeEditarDespacho(sesion);

  return (
    <>
      <main>
        <EncabezadoVista
          titulo="Balance diario"
          meta={
            <>
              total{" "}
              <span className="font-mono text-foreground tabular-nums">
                {formatearVolumen(total)}
              </span>{" "}
              MMPCED
            </>
          }
        />

        <AvanceDelDia cargadas={cargadas} total={visibles.length} sustantivo="clientes" />

        <AvisoSoloConsulta sesion={sesion} departamento={DEPARTAMENTO_DESPACHO} />

        {/* El resumen del día antes de los controles que lo acotan: se entra a
            mirar en qué anda el sistema, y recién después se filtra. La carga y
            el error de las tres consultas se anuncian una sola vez, acá. */}
        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{error.message}</span>
              {/* Nombrar el problema sin ofrecer la salida deja a quien digita
                  con una pantalla vacía y el botón de recargar del navegador,
                  que además le borra los filtros. */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void grilla.refetch();
                  void balance.refetch();
                  void transferencias.refetch();
                }}
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : listo ? (
          <TarjetasBalance
            datos={balance.data}
            serieVariacion={serie.data?.dias.map(
              (d) => d.recibidoMmpced - d.transportadoMmpced,
            )}
          />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            Cargando el día…
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
            <Select
              id="corte"
              value={tipoCorte}
              onChange={(e) => setTipoCorte(e.target.value as TipoCorte)}
            >
              <option value="PUNTUAL">Puntual</option>
              <option value="CIERRE_PROMEDIO">Cierre promedio</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sistema">Sistema</Label>
            <Select id="sistema" value={sistema} onChange={(e) => setSistema(e.target.value)}>
              <option value="">Todos</option>
              {sistemas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sector">Sector</Label>
            <Select id="sector" value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">Todos</option>
              {sectores.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="busqueda">Cliente</Label>
            <Input
              id="busqueda"
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <AvisoAlcance fecha={fecha} tipoCorte={tipoCorte} puedeEditar={puedeEditar} />

        {listo ? (
          <>
            <Tabla
              filas={visibles}
              fecha={fecha}
              tipoCorte={tipoCorte}
              puedeEditar={puedeEditar}
            />
            {/* Al final del día: lo que sale del sistema sin ser consumo de un
                cliente. Va acá porque es donde el workbook lo tiene y donde el
                analista ya está digitando (decisión #79). */}
            <BloqueTransferencias
              filas={transferencias.data.data}
              fecha={fecha}
              tipoCorte={tipoCorte}
              puedeEditar={puedeEditar}
            />
          </>
        ) : null}
      </main>
    </>
  );
}

/**
 * Qué consecuencias tiene escribir en el día que está elegido.
 *
 * El momento de mayor consecuencia del sistema no decía nada: corregir un valor
 * de un día ya cerrado **recalcula** ese `CIERRE_PROMEDIO` y se arrastra a los
 * días siguientes que sigan siendo copias intactas del carry-forward
 * (decisiones #44 y #45). Nadie puede consentir algo que no se le dijo, así que
 * se dice acá, en el aviso que ya existía, y no en un modal que interrumpa.
 */
function AvisoAlcance({
  fecha,
  tipoCorte,
  puedeEditar,
}: {
  fecha: string;
  tipoCorte: TipoCorte;
  puedeEditar: boolean;
}) {
  if (!puedeEditar) return null;

  const cierre = tipoCorte === "CIERRE_PROMEDIO";
  const pasado = fecha < hoy();
  if (!cierre && !pasado) return null;

  return (
    <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
      {cierre ? (
        <>
          El cierre promedio lo calcula el job de medianoche a partir de todos los
          valores que tuvo el puntual ese día. Acá no se pueden crear filas nuevas;
          las que ya existen sí se pueden corregir.{" "}
        </>
      ) : null}
      {pasado ? (
        <>
          Es un día ya cerrado: al corregir un valor se <strong>recalcula el cierre</strong>{" "}
          de esa fecha, y la corrección <strong>se arrastra a los días siguientes</strong> que
          nadie haya tocado a mano. Todo queda en el historial.
        </>
      ) : null}
    </p>
  );
}

function Tabla({
  filas,
  fecha,
  tipoCorte,
  puedeEditar,
}: {
  filas: FilaBalanceDiarioDto[];
  fecha: string;
  tipoCorte: TipoCorte;
  puedeEditar: boolean;
}) {
  const { abierta, alternar } = useDesplegable();

  if (filas.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        Ningún cliente coincide con el filtro.
      </p>
    );
  }

  return (
    <TablaDesplazable anchoMinimo="min-w-[48rem]">
      <thead>
        <tr className="bg-card text-left text-xs text-muted-foreground">
          <th scope="col" className={TH}>Cliente</th>
          <th scope="col" className={TH}>Sistema</th>
          <th scope="col" className={TH}>Región</th>
          <th scope="col" className={TH}>Sector</th>
          <th scope="col" className={`${TH} text-right`}>MMPCED</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => {
          const clave = String(fila.cliente.id);
          const idPanel = `historial-cliente-${clave}`;
          const abierto = abierta === clave;
          return (
            <Fragment key={fila.cliente.id}>
              <tr className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-1.5 text-left font-normal">
                  {fila.cliente.nombre}
                </th>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {fila.cliente.sistema.nombre}
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {fila.cliente.region.nombre}
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {fila.cliente.sector.nombre}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="inline-flex items-center justify-end gap-2">
                    <BotonCorrecciones
                      correcciones={fila.correcciones}
                      abierto={abierto}
                      onClick={() => alternar(clave)}
                      etiqueta={fila.cliente.nombre}
                      idPanel={idPanel}
                    />
                    <CeldaCliente
                      fila={fila}
                      fecha={fecha}
                      tipoCorte={tipoCorte}
                      puedeEditar={puedeEditar}
                    />
                  </span>
                </td>
              </tr>
              {abierto && fila.lectura ? (
                <FilaHistorial
                  recurso="lecturas-balance"
                  lecturaId={fila.lectura.id}
                  columnas={5}
                  idPanel={idPanel}
                  valorActual={fila.lectura.volumenMmpced}
                />
              ) : null}
            </Fragment>
          );
        })}
      </tbody>
    </TablaDesplazable>
  );
}

function CeldaCliente({
  fila,
  fecha,
  tipoCorte,
  puedeEditar,
}: {
  fila: FilaBalanceDiarioDto;
  fecha: string;
  tipoCorte: TipoCorte;
  puedeEditar: boolean;
}) {
  const guardar = useGuardarLectura(fecha, tipoCorte);

  // `CIERRE_PROMEDIO` sólo lo escribe el job de cierre (decisión #42): se puede
  // corregir una fila existente, nunca crear una.
  const editable = puedeEditar && (tipoCorte === "PUNTUAL" || fila.lectura !== null);

  return (
    <CeldaVolumen
      valor={fila.lectura?.volumenMmpced ?? null}
      etiqueta={`Volumen de ${fila.cliente.nombre} en MMPCED`}
      editable={editable}
      guardando={guardar.isPending}
      error={guardar.error?.message ?? null}
      onGuardar={(volumenMmpced) =>
        guardar.mutate({
          clienteId: fila.cliente.id,
          lecturaId: fila.lectura?.id ?? null,
          volumenMmpced,
        })
      }
    />
  );
}
