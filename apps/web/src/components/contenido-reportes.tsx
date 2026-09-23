import type { BalanceNacionDto, ConsumoPorSectoresDto, TipoCorte } from "@sicog/shared-types";
import { GraficaBarras, GraficaDona } from "@/components/graficas";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { TarjetaCifra } from "@/components/tarjeta-cifra";
import { formatearVolumen } from "@/lib/despacho";

/**
 * El cuerpo del reporte — tarjetas, gráficas y tabla — separado de
 * `reportes/page.tsx` para que la vista de impresión (`/imprimir/reportes`,
 * la que arma el PDF) pinte exactamente lo mismo sin duplicar el JSX. Las dos
 * pantallas ya tenían el mismo dato cargado (`balance`/`consumo`); esto sólo
 * saca la parte que no depende de cómo se pidió.
 */
export function ContenidoReportes({
  balance,
  consumo,
  tipoCorte,
}: {
  balance: BalanceNacionDto;
  consumo: ConsumoPorSectoresDto;
  tipoCorte: TipoCorte;
}) {
  return (
    <>
      {/* Balance Nación como cifras y no como gráfica: son cuatro números
          sueltos, y una barra de un solo valor no dice más que el número. */}
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Mismo texto de pie que las tarjetas de Balance Diario
            (`tarjetas-balance.tsx`): es la misma cifra en dos pantallas, y el
            pie ya dice de dónde sale — "MMPCED" ahí es la unidad, que la
            cifra ya muestra al lado del número (ver `TarjetaCifra`), no algo
            para repetir. */}
        <TarjetaCifra titulo="Recibido" valor={balance.recibidoMmpced} pie="Lecturas de fuentes" />
        <TarjetaCifra
          titulo="Transportado"
          valor={balance.transportadoMmpced}
          pie={desgloseTransportado(balance) ?? "Lecturas de clientes"}
        />
        <TarjetaCifra
          titulo="Variación"
          valor={balance.variacionMmpced}
          pie="Recibido menos entregado"
        />
        <div className="rounded-lg border border-border bg-card px-3 py-2.5">
          <dt className="text-xs font-medium text-muted-foreground">Condición</dt>
          <dd className="mt-0.5">
            <span
              className={`rounded-md px-2 py-0.5 text-sm font-medium ${
                balance.condicion === "EMPAQUE" ? "bg-ok-soft text-ok" : "bg-danger-soft text-destructive"
              }`}
            >
              {balance.condicion === "EMPAQUE" ? "Empacado" : "Desempacado"}
            </span>
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">Del sistema de transporte</p>
        </div>
      </dl>

      {/*
       * Recibido vs transportado, sólo con CIERRE_PROMEDIO.
       *
       * En PUNTUAL "transportado" es un valor a medio corregir en cualquier
       * momento del día —puede estar al 20% o al 90% de lo que va a terminar
       * siendo—, así que compararlo contra "recibido" no dice nada real; por
       * eso no se muestra en ese corte, ni con una nota (el owner lo pidió
       * así: la ausencia ya dice que ahí no aplica).
       *
       * Es del día elegido nada más, no una serie en el tiempo: las tarjetas
       * de arriba ya dan esos números, y una línea con varios días en el eje
       * X mezclaba "qué pasó hoy" con "qué pasó esta semana" en una sola
       * lectura confusa (confirmado con el owner).
       */}
      {tipoCorte === "CIERRE_PROMEDIO" ? (
        <section className="mt-4 rounded-lg border border-border bg-card p-4">
          <GraficaBarras
            titulo="Recibido vs transportado"
            datos={[
              { etiqueta: "Recibido", valor: balance.recibidoMmpced },
              { etiqueta: "Transportado", valor: balance.transportadoMmpced },
            ]}
            total={0}
          />
        </section>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4">
          {/* Dona, como en el workbook y a pedido del owner. Las porciones
              van en el orden del catálogo —por `sector.id`— y no por
              tamaño: así un sector está siempre en el mismo lugar del
              anillo y comparar dos días muestra porciones que cambian de
              tamaño, no de posición. */}
          <GraficaDona
            titulo="Consumo por sectores"
            datos={[...consumo.nacional]
              .sort((a, b) => a.sector.id - b.sector.id)
              .map((s) => ({ id: s.sector.id, etiqueta: s.sector.nombre, valor: s.totalMmpced }))}
            total={consumo.totalMmpced}
            nota="No incluye la quema nacional: no es consumo de ningún sector."
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <GraficaBarras
            titulo="Entregado por región"
            datos={consumo.porRegion
              .map((r) => ({ etiqueta: r.region.nombre, valor: r.totalMmpced }))
              .sort((a, b) => b.valor - a.valor)}
            total={consumo.totalMmpced}
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
          datos={consumo.porAgrupacion.map((a) => ({
            etiqueta: a.nombre,
            valor: a.totalMmpced,
            detalle: a.subSistema ? a.sistema.nombre : undefined,
          }))}
          total={consumo.totalMmpced}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Las ramas con nombre propio van separadas; el resto de cada sistema se suma en una
          barra del sistema.
        </p>
      </section>

      {/* La vista de tabla: el mismo dato en números, que además es el
          desglose región × sector del workbook. */}
      <section className="mt-4">
        <h2 className="text-sm font-medium">Región y sector</h2>
        {consumo.porRegion.length === 0 ? (
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
              {consumo.porRegion.map((r) =>
                r.sectores.map((s, i) => (
                  <tr
                    key={`${r.region.id}-${s.sector.id}`}
                    className="border-b border-border last:border-0"
                  >
                    {/* El nombre de la región se **ve** sólo en su
                        primera fila —repetirlo sería ruido— pero se
                        **anuncia** en todas: con el `<th>` vacío, un lector
                        de pantalla oía un encabezado de fila en blanco en
                        cada sector siguiente y perdía de qué región estaba
                        leyendo. */}
                    <th scope="row" className="px-3 py-1.5 text-left font-normal">
                      <span aria-hidden={i !== 0}>{i === 0 ? r.region.nombre : ""}</span>
                      {i === 0 ? null : <span className="sr-only">{r.region.nombre}</span>}
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
                  {formatearVolumen(consumo.totalMmpced)}
                </td>
              </tr>
            </tbody>
          </TablaDesplazable>
        )}
      </section>
    </>
  );
}

/**
 * Qué parte del transportado no es consumo de clientes.
 *
 * Se nombra sólo lo que hay: un día sin quema ni transferencias no necesita
 * explicar que no las tuvo.
 */
function desgloseTransportado(b: {
  quemaMmpced: number;
  transferenciasMmpced: number;
}): string | null {
  const partes: string[] = [];
  if (b.quemaMmpced !== 0) partes.push(`${formatearVolumen(b.quemaMmpced)} de quema`);
  if (b.transferenciasMmpced !== 0) {
    partes.push(`${formatearVolumen(b.transferenciasMmpced)} de transferencias`);
  }
  return partes.length === 0 ? null : `incluye ${partes.join(" y ")}`;
}
