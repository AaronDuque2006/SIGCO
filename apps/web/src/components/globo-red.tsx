/**
 * Venezuela sobre un globo inclinado, con la red de gas y pulsos de luz que
 * salen de Anaco por cada ruta: el mismo "gas fluyendo" del sello del login.
 * Pedido del owner el 2026-09-25 para la esquina inferior derecha del hub.
 *
 * **Es fondo, no dato.** El hub no tiene cifras ni digitación: es la entrada a
 * los departamentos, como el login es la puerta. Por eso se permite el
 * movimiento aquí (decisión #111, que extiende la #85) y **no se lleva a
 * ninguna pantalla operativa**. Con `prefers-reduced-motion` el globo queda
 * quieto y los pulsos desaparecen.
 *
 * El contorno es el del sello (`logo-sicog.tsx`, con la Guayana Esequiba),
 * pasado a longitud/latitud; los nodos son las plantas y terminales que
 * nombran los siete sistemas del seed. Ninguna de las dos cosas es
 * cartografía exacta: es una ilustración, y la red dibuja los tramos entre
 * nodos, no el trazado real de los gasoductos.
 *
 * El mapa va agrandado 1,6 veces sobre el globo (`ESCALA_MAPA`), a pedido del
 * owner: el globo a escala se veía bien, pero el país quedaba chico.
 *
 * La proyección es ortográfica y se calcula una sola vez al cargar el módulo;
 * nada se recalcula al renderizar. El globo no gira: se probó (primero todo
 * junto, después sólo los meridianos) y el owner prefirió que quede quieto;
 * lo único que se mueve son los pulsos.
 */

type Punto = readonly [lon: number, lat: number];

// Mirando desde el sur y bien arriba del ecuador: con el centro de la vista a
// 45° al sur, Venezuela cae cerca del borde de la esfera y se ve la curva.
const LON_CENTRO = -62;
const LAT_CENTRO = -45;
const RADIO = 1200;
const CX = 360;
const CY = 1210;
const ANCHO = 620;
const ALTO = 500;
/** La inclinación del eje, en grados, sobre el centro de la caja. */
const INCLINACION = -12;

const RAD = Math.PI / 180;

type Proyeccion = (punto: Punto) => { x: number; y: number; visible: boolean };

const proyectarDesde = (lonCentro: number): Proyeccion => ([lon, lat]) => {
  const l = (lon - lonCentro) * RAD;
  const p = lat * RAD;
  const p0 = LAT_CENTRO * RAD;
  return {
    x: CX + RADIO * Math.cos(p) * Math.sin(l),
    y: CY - RADIO * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)),
    visible: Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l) > 0,
  };
};

// El mapa va más grande que en escala real sobre el mismo globo: a tamaño
// real, Venezuela ocupaba un tercio del recuadro. Se agranda sobre la
// superficie antes de proyectar; la retícula no. El punto fijo está al oeste
// del país para que el agrandamiento lo empuje hacia el este, fuera del
// fundido del borde izquierdo.
const ESCALA_MAPA = 1.6;
const CENTRO_MAPA: Punto = [-70, 6.5];

const agrandar = ([lon, lat]: Punto): Punto => [
  CENTRO_MAPA[0] + (lon - CENTRO_MAPA[0]) * ESCALA_MAPA,
  CENTRO_MAPA[1] + (lat - CENTRO_MAPA[1]) * ESCALA_MAPA,
];

/** Los tramos del lado oculto de la esfera se cortan en vez de unirse. */
function trazo(puntos: readonly Punto[], proyeccion: Proyeccion, cerrar = false): string {
  let d = "";
  let lapiz = false;
  for (const punto of puntos) {
    const { x, y, visible } = proyeccion(punto);
    if (!visible) {
      lapiz = false;
      continue;
    }
    d += `${lapiz ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    lapiz = true;
  }
  return cerrar ? `${d}Z` : d;
}

const VENEZUELA: Punto[] = [
  [-72.05, 11.6], [-71.63, 11.25], [-71.38, 11.05], [-71.68, 10.9], [-71.18, 10.95], [-70.62, 11.25],
  [-70.27, 11.4], [-70.32, 11.75], [-70.07, 12.2], [-69.81, 11.75], [-69.66, 11.45], [-68.95, 11.4],
  [-68.45, 11.2], [-68.25, 10.69], [-67.44, 10.6], [-66.64, 10.6], [-66.12, 10.55], [-65.62, 10.19],
  [-65.12, 10.09], [-64.61, 10.29], [-64.21, 10.6], [-63.81, 10.64], [-63.0, 10.71], [-62.19, 10.71],
  [-61.86, 10.69], [-62.39, 10.45], [-62.69, 10.19], [-62.19, 9.99], [-61.58, 9.9], [-60.98, 9.54],
  [-60.77, 8.99], [-60.17, 8.59], [-59.76, 8.28], [-60.47, 7.58], [-60.57, 7.08], [-61.08, 6.68],
  [-61.13, 6.07], [-60.72, 5.17], [-61.48, 4.87], [-62.49, 4.16], [-63.5, 3.92], [-64.21, 4.06],
  [-64.71, 4.16], [-64.21, 2.96], [-64.01, 2.35], [-64.41, 1.45], [-65.22, 1.05], [-66.33, 0.7],
  [-66.93, 1.15], [-67.34, 1.96], [-67.84, 2.76], [-67.64, 3.56], [-67.89, 4.47], [-67.84, 5.47],
  [-67.44, 6.18], [-68.55, 6.18], [-69.46, 6.07], [-70.17, 6.93], [-71.18, 6.98], [-72.19, 7.03],
  [-72.49, 7.88], [-72.49, 8.38], [-72.85, 9.09], [-73.4, 9.19], [-73.0, 10.4], [-72.59, 11.1],
];

const GUAYANA_ESEQUIBA: Punto[] = [
  [-59.76, 8.28], [-59.26, 7.98], [-58.76, 7.48], [-58.4, 6.93], [-58.55, 6.38], [-58.5, 5.87],
  [-58.66, 5.27], [-58.8, 4.57], [-58.85, 3.97], [-58.66, 3.16], [-58.85, 2.35], [-58.9, 1.45],
  [-59.36, 1.65], [-59.71, 1.96], [-59.91, 2.56], [-59.66, 3.26], [-59.91, 3.97], [-60.12, 4.47],
  [-60.72, 5.17], [-61.13, 6.07], [-61.08, 6.68], [-60.57, 7.08], [-60.47, 7.58],
];

const MARGARITA: Punto[] = [[-64.4, 10.95], [-64.2, 11.1], [-63.8, 11.15], [-63.85, 10.95], [-64.2, 10.9]];

const NODOS = {
  anaco: [-64.47, 9.44],
  jose: [-64.83, 10.08],
  puertoLaCruz: [-64.63, 10.21],
  puertoOrdaz: [-62.72, 8.3],
  jusepin: [-63.52, 9.73],
  sanVicente: [-63.3, 9.3],
  caracas: [-66.9, 10.49],
  moron: [-68.1, 10.45],
  barquisimeto: [-69.32, 10.07],
  rioSeco: [-69.9, 11.25],
  amuay: [-70.22, 11.75],
  ule: [-71.38, 10.28],
  transcaribeno: [-71.9, 11.2],
} satisfies Record<string, Punto>;

type Nodo = keyof typeof NODOS;

// Todas salen de Anaco, así el pulso de cada una arranca en el mismo punto y,
// como van a la misma velocidad, las que comparten tramo viajan juntas hasta
// separarse (Barquisimeto → Río Seco / Ulé).
const RUTAS: Nodo[][] = [
  ["anaco", "jose", "puertoLaCruz"],
  ["anaco", "jusepin", "sanVicente"],
  ["anaco", "puertoOrdaz"],
  ["anaco", "caracas", "moron", "barquisimeto", "rioSeco", "amuay"],
  ["anaco", "caracas", "moron", "barquisimeto", "ule", "transcaribeno"],
];

/** Unidades del SVG por segundo. */
const VELOCIDAD = 70;

const globo = proyectarDesde(LON_CENTRO);
const mapa: Proyeccion = (punto) => globo(agrandar(punto));

const RETICULA = (() => {
  let d = "";
  for (let lon = -180; lon < 180; lon += 10) {
    const meridiano: Punto[] = [];
    for (let lat = -80; lat <= 80; lat += 2) meridiano.push([lon, lat]);
    d += trazo(meridiano, globo);
  }
  for (let lat = -80; lat <= 80; lat += 10) {
    const paralelo: Punto[] = [];
    for (let lon = -180; lon <= 180; lon += 2) paralelo.push([lon, lat]);
    d += trazo(paralelo, globo);
  }
  return d;
})();

const TIERRA = [VENEZUELA, GUAYANA_ESEQUIBA, MARGARITA].map((t) => trazo(t, mapa, true));
const TRAMOS = RUTAS.map((ruta) => trazo(ruta.map((n) => NODOS[n]), mapa));
const PUNTOS = (Object.keys(NODOS) as Nodo[]).map((n) => mapa(NODOS[n]));
const ANACO = mapa(NODOS.anaco);

// El ciclo dura el doble del viaje: la otra mitad es la pausa hasta el pulso
// siguiente (ver `.globo-pulso` en globals.css).
const DURACIONES = RUTAS.map((ruta) => {
  const puntos = ruta.map((n) => mapa(NODOS[n]));
  let largo = 0;
  for (let i = 1; i < puntos.length; i++) {
    largo += Math.hypot(puntos[i]!.x - puntos[i - 1]!.x, puntos[i]!.y - puntos[i - 1]!.y);
  }
  return (2 * largo) / VELOCIDAD;
});

export function GloboRed({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className={className} aria-hidden>
      <defs>
        <radialGradient id="globo-atmosfera" cx={CX} cy={CY} r={RADIO} gradientUnits="userSpaceOnUse">
          <stop offset="0.8" stopColor="var(--primary)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0.16" />
        </radialGradient>
      </defs>
      <g transform={`rotate(${INCLINACION} ${ANCHO / 2} ${ALTO / 2})`}>
        <circle cx={CX} cy={CY} r={RADIO} fill="var(--card)" stroke="var(--primary)" strokeOpacity="0.5" />
        <circle cx={CX} cy={CY} r={RADIO} fill="url(#globo-atmosfera)" />
        <path d={RETICULA} fill="none" stroke="var(--border)" strokeWidth="1" />
        <g fill="var(--primary)" fillOpacity="0.13" stroke="var(--primary)" strokeOpacity="0.75" strokeWidth="1.5" strokeLinejoin="round">
          {TIERRA.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {TRAMOS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g fill="none" stroke="var(--primary-foreground)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          {TRAMOS.map((d, i) => (
            <path
              key={d}
              d={d}
              pathLength={100}
              className="globo-pulso"
              style={{ animationDuration: `${DURACIONES[i]}s` }}
            />
          ))}
        </g>
        <g fill="var(--primary)">
          {PUNTOS.map(({ x, y }) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r={x === ANACO.x && y === ANACO.y ? 5.5 : 3.5} />
          ))}
        </g>
        <circle
          className="globo-latido"
          cx={ANACO.x}
          cy={ANACO.y}
          r="5.5"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
