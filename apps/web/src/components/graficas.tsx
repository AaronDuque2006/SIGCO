"use client";

import { useId, useState } from "react";
import { formatearVolumen } from "@/lib/despacho";

/**
 * Gráficas del reporte de Despacho, en SVG a mano y sin librería.
 *
 * Son formas simples —barras horizontales, dona— y meter un paquete de
 * gráficos costaría más megabytes y más memoria que escribirlas, en una
 * máquina que ya viene justa. Además el SVG hereda los tokens del tema sin
 * puente de configuración.
 */

/** Un solo tono para las barras: el largo ya codifica la magnitud, y pintarlas
 *  de colores distintos sugeriría una identidad que no existe. */
const BARRA = "var(--barra)";

const EJE = "var(--border)";
const TINTA_TENUE = "var(--muted-foreground)";

// ---------------------------------------------------------------------------

export interface BarraDato {
  etiqueta: string;
  valor: number;
  /** Texto secundario bajo la etiqueta — por ejemplo, de qué sistema es una
   *  rama. Opcional: las barras que no lo necesitan no lo muestran. */
  detalle?: string;
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
  formatear = formatearVolumen,
  vacio = "Sin datos ese día.",
}: {
  titulo: string;
  datos: BarraDato[];
  /** Para el porcentaje del rótulo. Si es 0, no se muestra participación. */
  total: number;
  /** Cómo se escribe el valor del rótulo. Por omisión, volúmenes con dos
   *  decimales, que es lo que pide Despacho. Telemetría cuenta estaciones, que
   *  son enteras: un "139,00" ahí diría que el número tiene una precisión que
   *  no tiene. */
  formatear?: (valor: number) => string;
  /** Qué decir cuando no hay ni una barra. Depende de qué se esté graficando. */
  vacio?: string;
}) {
  const idTitulo = useId();
  // La escala se mide en valor absoluto: desde que una agrupación puede incluir
  // una transferencia bidireccional (decisión #79), un total puede dar
  // negativo, y medir contra el máximo con signo distorsionaría el resto.
  const maximo = Math.max(1, ...datos.map((d) => Math.abs(d.valor)));

  return (
    <figure className="m-0">
      <figcaption>
        <h3 id={idTitulo} className="text-sm font-medium">
          {titulo}
        </h3>
      </figcaption>

      {datos.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="mt-3 space-y-2" aria-labelledby={idTitulo}>
          {datos.map((d) => {
            // Un valor negativo no dibuja barra. Aplastarlo a un 1% diría
            // "casi nada entregado" cuando lo que hubo fue entrada neta; el
            // número con su signo lo cuenta bien y la barra se calla.
            const proporcion = d.valor <= 0 ? 0 : (d.valor / maximo) * 100;
            const parte = total > 0 ? (d.valor / total) * 100 : null;
            return (
              <li key={d.etiqueta} className="grid grid-cols-[11rem_1fr_auto] items-center gap-3">
                <span className="min-w-0" title={d.detalle ? `${d.etiqueta} — ${d.detalle}` : d.etiqueta}>
                  <span className="block truncate text-xs text-foreground">{d.etiqueta}</span>
                  {d.detalle ? (
                    <span className="block truncate text-xs leading-tight text-muted-foreground">
                      {d.detalle}
                    </span>
                  ) : null}
                </span>
                <span className="h-4 w-full overflow-hidden rounded-sm bg-muted">
                  {/* Extremo redondeado de 4px, anclado a la línea base. */}
                  <span
                    className="block h-full rounded-r-[4px]"
                    style={{
                      width: `${d.valor > 0 ? Math.max(proporcion, 1) : 0}%`,
                      background: BARRA,
                    }}
                  />
                </span>
                <span className="font-mono text-xs tabular-nums">
                  {formatear(d.valor)}
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

// ---------------------------------------------------------------------------

/**
 * Paleta categórica de las porciones de la dona.
 *
 * Siete tonos, uno por sector del catálogo. Los valores viven en `globals.css`
 * porque **son dos paletas, una por tema**: una validación hecha contra
 * `#101828` no dice absolutamente nada sobre un fondo blanco, así que la clara
 * se revalidó entera con `scripts/validar-paleta.mjs`.
 *
 * Oscuro (`#101828`): peor par adyacente ΔE 11,5 en deuteranopía; el peor par
 * global es cian contra verde, ΔE 4,3 en tritanopía, y queda **no adyacente**
 * a propósito.
 * Claro (`#ffffff`): los siete pasan de 5:1 como marca —mejor que en oscuro,
 * donde el magenta se quedaba en 2,94— y el peor par adyacente separa ΔE 8,8.
 *
 * El orden **no es decorativo**: es el que se validó, y es el mismo en los dos
 * temas. Reordenar la lista invalida las dos comprobaciones.
 *
 * Siete tonos que sobrevivan la comparación de *todos* los pares no es
 * alcanzable en ninguno de los dos fondos; por eso las porciones llevan además
 * nombre y cifra en la leyenda, que es la codificación secundaria que la regla
 * exige cuando un par cae por debajo de ΔE 8.
 */
const PALETA_SECTORES = [
  "var(--sector-1)",
  "var(--sector-2)",
  "var(--sector-3)",
  "var(--sector-4)",
  "var(--sector-5)",
  "var(--sector-6)",
  "var(--sector-7)",
] as const;

export interface PorcionDato {
  /** Id del catálogo: **el color sigue a la entidad, nunca a su posición**, así
   *  que filtrar un día con menos sectores no repinta los que quedan. */
  id: number;
  etiqueta: string;
  valor: number;
}

const polar = (cx: number, cy: number, r: number, grados: number) => {
  const rad = ((grados - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
};

/**
 * Dona de participación, la forma que el área ya lee en el workbook.
 *
 * El centro lleva el total: en una dona el agujero es espacio desperdiciado, y
 * la cifra que todos buscan primero es justamente la suma.
 *
 * Las porciones van en el **orden del catálogo y no por tamaño**: así un sector
 * está siempre en el mismo lugar del anillo, y comparar dos días muestra
 * porciones que cambian de tamaño, no de posición.
 */
export function GraficaDona({
  titulo,
  datos,
  total,
  nota,
}: {
  titulo: string;
  datos: PorcionDato[];
  total: number;
  nota?: string;
}) {
  const idTitulo = useId();
  const [activo, setActivo] = useState<number | null>(null);

  const TAM = 200;
  const c = TAM / 2;
  const rExterno = 92;
  const rInterno = 58;

  const color = (id: number) => PALETA_SECTORES[(id - 1) % PALETA_SECTORES.length];

  // Los ángulos se derivan de la suma de lo que va antes, sin acumular en una
  // variable: el compilador de React no admite reasignar durante el render, y
  // recalcular es O(n²) sobre siete porciones como mucho.
  const porciones = datos.map((d, i) => {
    const previo = datos.slice(0, i).reduce((suma, x) => suma + x.valor, 0);
    const grados = (v: number) => (total > 0 ? (v / total) * 360 : 0);
    return {
      ...d,
      inicio: grados(previo),
      fin: grados(previo + d.valor),
      parte: total > 0 ? (d.valor / total) * 100 : 0,
    };
  });

  return (
    <figure className="m-0">
      <figcaption>
        <h3 id={idTitulo} className="text-sm font-medium">
          {titulo}
        </h3>
      </figcaption>

      {datos.length === 0 || total === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Sin datos ese día.</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <svg
            viewBox={`0 0 ${TAM} ${TAM}`}
            className="h-44 w-44 shrink-0"
            role="img"
            aria-labelledby={idTitulo}
            onPointerLeave={() => setActivo(null)}
          >
            {porciones.map((p) => {
              // Una sola porción sería un arco de 360°, que degenera: se dibuja
              // como anillo completo.
              if (porciones.length === 1) {
                return (
                  <g key={p.id}>
                    <circle
                      cx={c}
                      cy={c}
                      r={(rExterno + rInterno) / 2}
                      fill="none"
                      stroke={color(p.id)}
                      strokeWidth={rExterno - rInterno}
                    />
                  </g>
                );
              }
              const [x1, y1] = polar(c, c, rExterno, p.inicio);
              const [x2, y2] = polar(c, c, rExterno, p.fin);
              const [x3, y3] = polar(c, c, rInterno, p.fin);
              const [x4, y4] = polar(c, c, rInterno, p.inicio);
              const grande = p.fin - p.inicio > 180 ? 1 : 0;
              return (
                <path
                  key={p.id}
                  d={`M${x1},${y1} A${rExterno},${rExterno} 0 ${grande},1 ${x2},${y2} L${x3},${y3} A${rInterno},${rInterno} 0 ${grande},0 ${x4},${y4} Z`}
                  fill={color(p.id)}
                  /* 2px del color de la superficie entre porciones: el separador
                     que la skill pide entre rellenos contiguos. */
                  stroke="var(--card)"
                  strokeWidth={2}
                  opacity={activo === null || activo === p.id ? 1 : 0.45}
                  onPointerEnter={() => setActivo(p.id)}
                />
              );
            })}

            {/* El agujero no se desperdicia: lleva la cifra que se busca primero. */}
            <text
              x={c}
              y={c - 2}
              textAnchor="middle"
              className="fill-foreground font-mono"
              fontSize={20}
              fontWeight={600}
            >
              {formatearVolumen(total)}
            </text>
            <text x={c} y={c + 16} textAnchor="middle" fontSize={10} fill={TINTA_TENUE}>
              MMPCED
            </text>
          </svg>

          {/* Leyenda con nombre y cifra: la identidad nunca queda sólo en el
              color, que es lo que hace legible una dona de seis porciones. */}
          <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
            {porciones.map((p) => (
              <li
                key={p.id}
                className="flex items-baseline gap-2"
                onPointerEnter={() => setActivo(p.id)}
                onPointerLeave={() => setActivo(null)}
              >
                <span
                  className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color(p.id) }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{p.etiqueta}</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatearVolumen(p.valor)}
                </span>
                <span className="w-12 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {p.parte.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nota ? <p className="mt-3 text-xs text-muted-foreground">{nota}</p> : null}
    </figure>
  );
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------

/**
 * La curva de una serie corta, dentro de la tarjeta que muestra su cifra de hoy.
 *
 * Va acá adentro y no como una banda aparte porque el alto de la pantalla le
 * pertenece a la grilla: una franja propia se llevaba filas de digitación, que
 * es el trabajo real. Como vive pegada a su número, no necesita ejes, rótulos
 * ni leyenda — el número ya dice cuánto, y la curva sólo dice **de dónde
 * viene**.
 *
 * Un solo tono, por lo mismo que el resto del sistema: el rojo y el verde
 * significan Desempacado y Empacado en esta misma fila de tarjetas.
 */
export function Chispa({
  valores,
  etiqueta,
}: {
  valores: number[];
  /** Qué serie es, para quien no ve la curva. */
  etiqueta: string;
}) {
  if (valores.length < 2) return null;

  const W = 220;
  const H = 22;
  const P = 3;

  // Escala simétrica alrededor del cero: la serie tiene signo, y el cruce por
  // cero es lo que se quiere leer.
  const tope = Math.max(1, ...valores.map(Math.abs));
  const x = (i: number) => P + ((W - P * 2) * i) / (valores.length - 1);
  const y = (v: number) => H / 2 - ((H / 2 - P) * v) / tope;

  const ruta = valores.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const ultimo = valores.length - 1;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-1.5 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={etiqueta}
    >
      <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke={EJE} strokeWidth={1} />
      <path
        d={ruta}
        fill="none"
        stroke={BARRA}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.75}
      />
      {/* El último punto marcado: es el día que se está digitando. */}
      <circle cx={x(ultimo)} cy={y(valores[ultimo])} r={2.5} fill={BARRA} />
    </svg>
  );
}
