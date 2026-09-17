"use client";

import type { FilaTransferenciaDto, TipoCorte } from "@sicog/shared-types";
import { Fragment } from "react";
import { CeldaVolumen } from "@/components/celda-volumen";
import {
  BotonCorrecciones,
  FilaHistorial,
  useDesplegable,
} from "@/components/historial-correcciones";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { formatearVolumen, useGuardarTransferencia } from "@/lib/despacho";

/**
 * Las transferencias, al final del Balance Diario.
 *
 * Van acá y no en una pantalla propia porque es donde el workbook las tiene y
 * donde el analista ya está digitando el día: son cinco filas más, no un
 * desvío. Lo que sí cambia es que **no son clientes** — salen del sistema sin
 * que nadie las consuma— así que van en su propio bloque rotulado y no
 * mezcladas entre los ciento once (decisión #79).
 *
 * Recibe las filas ya cargadas: la pantalla espera a sus tres consultas y
 * aparece entera, en vez de traer tres bloques con su propio "Cargando…".
 */
export function BloqueTransferencias({
  filas,
  fecha,
  tipoCorte,
  puedeEditar,
}: {
  filas: FilaTransferenciaDto[];
  fecha: string;
  tipoCorte: TipoCorte;
  puedeEditar: boolean;
}) {
  const { abierta, alternar } = useDesplegable();

  const total = filas.reduce((suma, f) => suma + (f.lectura?.mmpced ?? 0), 0);
  const cargadas = filas.filter((f) => f.lectura !== null).length;

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">Transferencias</h2>
        {filas.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {cargadas} de {filas.length} con lectura · total{" "}
            <span className="font-mono text-foreground">{formatearVolumen(total)}</span> MMPCED
          </p>
        ) : null}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Gas que sale del sistema sin ser consumo de un cliente. Suma al transportado
        del Balance Nación, pero no al consumo por sectores.
      </p>

      {filas.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No hay puntos de transferencia en el catálogo.
        </p>
      ) : (
        <TablaDesplazable anchoMinimo="min-w-[40rem]">
          <thead>
            <tr className="bg-card text-left text-xs text-muted-foreground">
              <th scope="col" className={TH}>Punto</th>
              <th scope="col" className={TH}>Destino</th>
              <th scope="col" className={TH}>Sistema</th>
              <th scope="col" className={`${TH} text-right`}>MMPCED</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => {
              const clave = String(fila.punto.id);
              const idPanel = `historial-transferencia-${clave}`;
              const abierto = abierta === clave;
              return (
                <Fragment key={fila.punto.id}>
                  <tr className="border-b border-border last:border-0">
                    <th scope="row" className="px-3 py-1.5 text-left font-normal">
                      {fila.punto.nombre}
                      {/* Qué significa el signo, dicho donde se teclea. Antes
                          decía "va en los dos sentidos", que plantea la
                          pregunta sin contestarla: cuál de los dos es el
                          positivo vivía sólo en un comentario del código. */}
                      {fila.punto.bidireccional ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          + hacia {fila.punto.destino}, − al contrario
                        </span>
                      ) : null}
                    </th>
                    <td className="px-3 py-1.5 text-muted-foreground">{fila.punto.destino}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {fila.punto.subSistema?.nombre ?? fila.punto.sistema.nombre}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <span className="inline-flex items-center justify-end gap-2">
                        {/* El backend le escribe historial en la misma
                            transacción desde el primer día, y el conteo ya
                            viajaba en el DTO: lo único que faltaba era
                            mirarlo. Sin esto, el bloque más nuevo era el único
                            que no cumplía la decisión #69. */}
                        <BotonCorrecciones
                          correcciones={fila.correcciones}
                          abierto={abierto}
                          onClick={() => alternar(clave)}
                          etiqueta={fila.punto.nombre}
                          idPanel={idPanel}
                        />
                        <Celda
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
                      recurso="transferencias"
                      lecturaId={fila.lectura.id}
                      columnas={4}
                      idPanel={idPanel}
                      valorActual={fila.lectura.mmpced}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </TablaDesplazable>
      )}
    </section>
  );
}

function Celda({
  fila,
  fecha,
  tipoCorte,
  puedeEditar,
}: {
  fila: FilaTransferenciaDto;
  fecha: string;
  tipoCorte: TipoCorte;
  puedeEditar: boolean;
}) {
  const guardar = useGuardarTransferencia(fecha, tipoCorte);

  // Misma regla que las lecturas: el `CIERRE_PROMEDIO` lo escribe el job de
  // medianoche, así que una fila que no existe no se crea desde acá.
  const editable = puedeEditar && (tipoCorte === "PUNTUAL" || fila.lectura !== null);

  return (
    <CeldaVolumen
      valor={fila.lectura?.mmpced ?? null}
      etiqueta={`${fila.punto.nombre} en MMPCED`}
      editable={editable}
      // En un punto bidireccional el signo es el dato: positivo en el sentido
      // que nombra el punto, negativo en el contrario.
      permiteNegativo={fila.punto.bidireccional}
      guardando={guardar.isPending}
      error={guardar.error?.message ?? null}
      onGuardar={(mmpced) =>
        guardar.mutate({ puntoId: fila.punto.id, lecturaId: fila.lectura?.id ?? null, mmpced })
      }
    />
  );
}
