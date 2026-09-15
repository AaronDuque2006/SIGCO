"use client";

import { useId, useState } from "react";
import { formatearVolumen } from "@/lib/despacho";

/**
 * Gráficas del reporte de Despacho, en SVG a mano y sin librería.
 *
 * Son tres formas simples —una línea de dos series, barras horizontales— y
 * meter un paquete de gráficos costaría más megabytes y más memoria que
 * escribirlas, en una máquina que ya viene justa. Además el SVG hereda los
 * tokens del tema sin puente de configuración.
 *
 * **La paleta está validada, no elegida a ojo.** Azul y ámbar separan ΔE 30,2
 * en protanopía y 28,7 en tritanopía sobre la superficie `#101828`, y las dos
 * caen dentro de la banda de luminosidad del modo oscuro. El ámbar del tema
 * (`--chart-3`, `#f2b84b`) quedaba fuera de esa banda: demasiado claro sobre
 * fondo oscuro, así que acá se usa su versión oscurecida.
 */
export const SERIE = {
  recibido: "#3b82f6",
  transportado: "#d97706",
} as const;

/** Un solo tono para las barras: el largo ya codifica la magnitud, y pintarlas
 *  de colores distintos sugeriría una identidad que no existe. */
const BARRA = "#3b82f6";

const EJE = "var(--border)";
const TINTA_TENUE = "var(--muted-foreground)";

// ---------------------------------------------------------------------------

export interface PuntoLinea {
  etiqueta: string;
  recibido: number;
  transportado: number;
}

/**
 * Recibido vs transportado a lo largo del tiempo.
 *
 * **Un solo eje.** Los dos valores son MMPCED y comparten escala; un segundo
 * eje haría que dos curvas se cruzaran donde los números no se cruzan.
 */
export function GraficaLinea({
  puntos,
  promedioRecibido,
  promedioTransportado,
}: {
  puntos: PuntoLinea[];
  promedioRecibido: number;
  promedioTransportado: number;
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const idTitulo = useId();

  const W = 640;
  const H = 240;
  const M = { top: 16, right: 16, bottom: 34, left: 56 };
  const ancho = W - M.left - M.right;
  const alto = H - M.top - M.bottom;

  const maximo = Math.max(
    1,
    ...puntos.flatMap((p) => [p.recibido, p.transportado]),
  );
  // Se redondea hacia arriba para que el eje termine en un número redondo y la
  // línea no toque el borde del área.
  const tope = Math.ceil((maximo * 1.1) / 100) * 100 || 100;

  const x = (i: number) =>
    M.left + (puntos.length === 1 ? ancho / 2 : (ancho * i) / (puntos.length - 1));
  const y = (v: number) => M.top + alto - (alto * v) / tope;

  const ruta = (leer: (p: PuntoLinea) => number): string =>
    puntos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(leer(p))}`).join(" ");

  const marcas = [0, tope / 2, tope];

  return (
    <figure className="m-0">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={idTitulo} className="text-sm font-medium">
          Recibido vs transportado
        </h3>
        {/* Leyenda siempre presente con dos series: la identidad nunca queda
            sólo en el color. */}
        <ul className="flex gap-4 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: SERIE.recibido }}
              aria-hidden
            />
            Recibido · prom. {formatearVolumen(promedioRecibido)}
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: SERIE.transportado }}
              aria-hidden
            />
            Transportado · prom. {formatearVolumen(promedioTransportado)}
          </li>
        </ul>
      </figcaption>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-labelledby={idTitulo}
          onPointerLeave={() => setActivo(null)}
        >
          {marcas.map((v) => (
            <g key={v}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={y(v)}
                y2={y(v)}
                stroke={EJE}
                strokeWidth={1}
              />
              <text
                x={M.left - 8}
                y={y(v) + 4}
                textAnchor="end"
                fontSize={11}
                fill={TINTA_TENUE}
              >
                {v}
              </text>
            </g>
          ))}

          {puntos.map((p, i) => (
            <text
              key={p.etiqueta}
              x={x(i)}
              y={H - 12}
              textAnchor="middle"
              fontSize={11}
              fill={TINTA_TENUE}
            >
              {p.etiqueta}
            </text>
          ))}

          {/* 2px de trazo, marcadores de 8px: las especificaciones de marca. */}
          <path d={ruta((p) => p.recibido)} fill="none" stroke={SERIE.recibido} strokeWidth={2} />
          <path
            d={ruta((p) => p.transportado)}
            fill="none"
            stroke={SERIE.transportado}
            strokeWidth={2}
          />

          {puntos.map((p, i) => (
            <g key={`m${p.etiqueta}`}>
              {/* Anillo del color de la superficie donde las marcas se pisan. */}
              <circle cx={x(i)} cy={y(p.recibido)} r={4} fill={SERIE.recibido} stroke="var(--card)" strokeWidth={2} />
              <circle
                cx={x(i)}
                cy={y(p.transportado)}
                r={4}
                fill={SERIE.transportado}
                stroke="var(--card)"
                strokeWidth={2}
              />
            </g>
          ))}

          {activo !== null ? (
            <line
              x1={x(activo)}
              x2={x(activo)}
              y1={M.top}
              y2={M.top + alto}
              stroke={EJE}
              strokeWidth={1}
            />
          ) : null}

          {/* Zonas de contacto más anchas que las marcas, para que apuntar no
              exija puntería. */}
          {puntos.map((p, i) => (
            <rect
              key={`z${p.etiqueta}`}
              x={x(i) - ancho / (puntos.length * 2)}
              y={M.top}
              width={ancho / puntos.length}
              height={alto}
              fill="transparent"
              onPointerEnter={() => setActivo(i)}
            />
          ))}
        </svg>

        {activo !== null ? (
          <div
            role="status"
            className="pointer-events-none absolute top-2 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: `${(x(activo) / W) * 100}%`,
              transform: `translateX(${activo > puntos.length / 2 ? "-105%" : "5%"})`,
            }}
          >
            <p className="font-medium">{puntos[activo].etiqueta}</p>
            <p style={{ color: SERIE.recibido }} className="font-mono tabular-nums">
              {formatearVolumen(puntos[activo].recibido)}
            </p>
            <p style={{ color: SERIE.transportado }} className="font-mono tabular-nums">
              {formatearVolumen(puntos[activo].transportado)}
            </p>
          </div>
        ) : null}
      </div>
    </figure>
  );
}

// ---------------------------------------------------------------------------

export interface BarraDato {
  etiqueta: string;
  valor: number;
}

/**
 * Barras horizontales ordenadas por magnitud.
 *
 * Horizontales y no verticales porque las etiquetas son largas ("Petroquímico",
 * "Centro-Occidente") y en vertical habría que inclinarlas. Ordenadas por valor
 * porque un ranking se lee por tamaño, no por el orden del catálogo.
 *
 * Reemplazan la dona y las barras 3D del workbook: en una dona hay que comparar
 * ángulos, y el 3D distorsiona la altura con la perspectiva. El dato es el
 * mismo; la forma es la que deja compararlo de un vistazo.
 */
export function GraficaBarras({
  titulo,
  datos,
  total,
}: {
  titulo: string;
  datos: BarraDato[];
  /** Para el porcentaje del rótulo. Si es 0, no se muestra participación. */
  total: number;
}) {
  const idTitulo = useId();
  const maximo = Math.max(1, ...datos.map((d) => d.valor));

  return (
    <figure className="m-0">
      <figcaption>
        <h3 id={idTitulo} className="text-sm font-medium">
          {titulo}
        </h3>
      </figcaption>

      {datos.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Sin datos ese día.</p>
      ) : (
        <ul className="mt-3 space-y-2" aria-labelledby={idTitulo}>
          {datos.map((d) => {
            const proporcion = (d.valor / maximo) * 100;
            const parte = total > 0 ? (d.valor / total) * 100 : null;
            return (
              <li key={d.etiqueta} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3">
                <span className="truncate text-xs text-muted-foreground" title={d.etiqueta}>
                  {d.etiqueta}
                </span>
                <span className="h-4 w-full overflow-hidden rounded-sm bg-muted">
                  {/* Extremo redondeado de 4px, anclado a la línea base. */}
                  <span
                    className="block h-full rounded-r-[4px]"
                    style={{ width: `${Math.max(proporcion, 1)}%`, background: BARRA }}
                  />
                </span>
                <span className="font-mono text-xs tabular-nums">
                  {formatearVolumen(d.valor)}
                  {parte !== null ? (
                    <span className="ml-2 text-muted-foreground">{parte.toFixed(1)}%</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}
