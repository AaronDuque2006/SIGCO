"use client";

import type { TipoCorte } from "@sicog/shared-types";
import { useState } from "react";
import { GraficaBarras, GraficaDona, GraficaLinea } from "@/components/graficas";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  diaMes,
  formatearVolumen,
  hoy,
  useBalanceNacion,
  useConsumoPorSectores,
  useSerieBalance,
} from "@/lib/despacho";

const CAMPO =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Los reportes del módulo, con las gráficas del workbook.
 *
 * En el Excel son ocho gráficas repartidas en dos hojas, `EJECUTIVO PUNTUAL` y
 * `PROMEDIO`. Son las **mismas cuatro** en cada hoja, cambiando sólo el corte,
 * así que acá van una vez con el selector de corte arriba — igual que Balance
 * Diario.
 */
export default function ReportesPage() {
  const [fecha, setFecha] = useState(hoy);
  const [tipoCorte, setTipoCorte] = useState<TipoCorte>("PUNTUAL");
  const [dias, setDias] = useState(7);

  const balance = useBalanceNacion(fecha, tipoCorte);
  const consumo = useConsumoPorSectores(fecha, tipoCorte);
  const serie = useSerieBalance(fecha, dias, tipoCorte);

  const error = balance.error ?? consumo.error ?? serie.error;

  return (
    <main>
      <h1 className="text-lg font-semibold tracking-tight">Reportes y gráficas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Las mismas cuatro vistas de las hojas <em>EJECUTIVO PUNTUAL</em> y{" "}
        <em>PROMEDIO</em> del balance, con el corte como selector.
      </p>

      {/* Los filtros, en una fila arriba de todo lo demás. */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="corte">Corte</Label>
          <select
            id="corte"
            value={tipoCorte}
            onChange={(e) => setTipoCorte(e.target.value as TipoCorte)}
            className={CAMPO}
          >
            <option value="PUNTUAL">Puntual</option>
            <option value="CIERRE_PROMEDIO">Cierre promedio</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dias">Ventana de la serie</Label>
          <select
            id="dias"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className={CAMPO}
          >
            <option value={7}>7 días</option>
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
          </select>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {/* Balance Nación como cifras y no como gráfica: son cuatro números
          sueltos, y una barra de un solo valor no dice más que el número. */}
      {balance.data ? (
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta titulo="Recibido" valor={balance.data.recibidoMmpced} />
          <Tarjeta
            titulo="Transportado"
            valor={balance.data.transportadoMmpced}
            nota={
              balance.data.quemaMmpced > 0
                ? `incluye ${formatearVolumen(balance.data.quemaMmpced)} de quema`
                : undefined
            }
          />
          <Tarjeta titulo="Variación" valor={balance.data.variacionMmpced} />
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-xs font-medium text-muted-foreground">Condición</h2>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {balance.data.condicion === "EMPAQUE" ? "Empaque" : "Desempaque"}
            </p>
          </div>
        </section>
      ) : null}

      {serie.data ? (
        <section className="mt-4 rounded-lg border border-border bg-card p-4">
          <GraficaLinea
            puntos={serie.data.dias.map((d) => ({
              etiqueta: diaMes(d.fecha),
              recibido: d.recibidoMmpced,
              transportado: d.transportadoMmpced,
            }))}
            promedioRecibido={serie.data.promedioRecibidoMmpced}
            promedioTransportado={serie.data.promedioTransportadoMmpced}
          />
        </section>
      ) : null}

      {consumo.data ? (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-border bg-card p-4">
              {/* Dona, como en el workbook y a pedido del owner. Las porciones
                  van en el orden del catálogo —por `sector.id`— y no por
                  tamaño: así un sector está siempre en el mismo lugar del
                  anillo y comparar dos días muestra porciones que cambian de
                  tamaño, no de posición. */}
              <GraficaDona
                titulo="Consumo por sectores"
                datos={[...consumo.data.nacional]
                  .sort((a, b) => a.sector.id - b.sector.id)
                  .map((s) => ({
                    id: s.sector.id,
                    etiqueta: s.sector.nombre,
                    valor: s.totalMmpced,
                  }))}
                total={consumo.data.totalMmpced}
                nota="No incluye la quema nacional: no es consumo de ningún sector."
              />
            </section>

            <section className="rounded-lg border border-border bg-card p-4">
              <GraficaBarras
                titulo="Entregado por región"
                datos={consumo.data.porRegion
                  .map((r) => ({ etiqueta: r.region.nombre, valor: r.totalMmpced }))
                  .sort((a, b) => b.valor - a.valor)}
                total={consumo.data.totalMmpced}
              />
            </section>
          </div>

          {/* La cuarta gráfica del workbook. Agrupa por sub-sistema cuando el
              cliente tiene uno y por sistema cuando no (decisión #78): así
              Costa Oeste y Costa Este salen como barras propias aunque
              compartan sistema y región, que es lo que el Excel muestra y lo
              que agrupar por `SISTEMA` no podía producir. */}
          <section className="mt-4 rounded-lg border border-border bg-card p-4">
            <GraficaBarras
              titulo="Entregado por sistema"
              datos={consumo.data.porAgrupacion.map((a) => ({
                etiqueta: a.nombre,
                valor: a.totalMmpced,
                detalle: a.subSistema ? a.sistema.nombre : undefined,
              }))}
              total={consumo.data.totalMmpced}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Las ramas con nombre propio van separadas; el resto de cada sistema se
              suma en una barra del sistema.
            </p>
          </section>

          {/* La vista de tabla: el mismo dato en números, que además es el
              desglose región × sector del workbook. */}
          <section className="mt-4">
            <h2 className="text-sm font-medium">Región y sector</h2>
            {consumo.data.porRegion.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Ninguna lectura cargada ese día con ese corte.
              </p>
            ) : (
              <TablaDesplazable anchoMinimo="min-w-[32rem]">
                <thead>
                  <tr className="bg-card text-left text-xs text-muted-foreground">
                    <th scope="col" className={TH}>Región</th>
                    <th scope="col" className={TH}>Sector</th>
                    <th scope="col" className={`${TH} text-right`}>MMPCED</th>
                  </tr>
                </thead>
                <tbody>
                  {consumo.data.porRegion.map((r) =>
                    r.sectores.map((s, i) => (
                      <tr
                        key={`${r.region.id}-${s.sector.id}`}
                        className="border-b border-border last:border-0"
                      >
                        {/* El nombre de la región sólo en su primera fila: el
                            desglose es disperso y repetirlo sería ruido. */}
                        <th scope="row" className="px-3 py-1.5 text-left font-normal">
                          {i === 0 ? r.region.nombre : ""}
                        </th>
                        <td className="px-3 py-1.5 text-muted-foreground">{s.sector.nombre}</td>
                        <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                          {formatearVolumen(s.totalMmpced)}
                        </td>
                      </tr>
                    )),
                  )}
                  <tr className="border-t border-border">
                    <th scope="row" className="px-3 py-1.5 text-left font-medium">
                      Total
                    </th>
                    <td />
                    <td className="px-3 py-1.5 text-right font-mono font-medium tabular-nums">
                      {formatearVolumen(consumo.data.totalMmpced)}
                    </td>
                  </tr>
                </tbody>
              </TablaDesplazable>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

function Tarjeta({
  titulo,
  valor,
  nota,
}: {
  titulo: string;
  valor: number;
  nota?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-xs font-medium text-muted-foreground">{titulo}</h2>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
        {formatearVolumen(valor)}
      </p>
      <p className="text-xs text-muted-foreground">{nota ?? "MMPCED"}</p>
    </div>
  );
}
