import { useId } from "react";

/**
 * El logo de SICOG, sobre el sello que trajo el owner el 2026-09-25 (el de
 * "Despacho Central de Gas"), con el nombre del sistema en el anillo: SICOG
 * cubre los cuatro departamentos, no sólo Despacho.
 *
 * Dos versiones, porque el sello tiene demasiado detalle para un tamaño chico:
 *
 * - `SelloSicog`: completo — aros, mapa de Venezuela, la llama sobre el nodo
 *   central de la red y los instrumentos de presión, temperatura y válvula.
 *   Va en el login.
 * - `MarcaSicog`: sólo el aro y la llama sobre el nodo. Va en el encabezado;
 *   la misma figura es el ícono de la pestaña (`app/icon.svg`).
 *
 * Con los colores de la aplicación, no con los del sello original (que era
 * naranja y azul): todo sale de los tokens del tema — `--primary` (el Azul
 * Señal; en el tema claro, el profundo), `--muted-foreground`, `--card` y la
 * tinta vía `currentColor` —, así que el logo cambia solo con el tema. Sólo la
 * llama conserva su degradado propio de azules.
 *
 * En el sello, las líneas de la red llevan pulsos que salen del nodo central
 * hacia afuera: el gas recorriendo la red (`.logo-flujo` en globals.css, que
 * se apaga con `prefers-reduced-motion`). La marca chica no se anima: vive en
 * el encabezado durante toda la guardia, y DESIGN.md pide que nada se mueva
 * sin motivo en la pantalla de trabajo.
 */

/** Los ids del degradado y de los arcos, únicos por instancia (`useId` trae ":"). */
function useIdSvg(): string {
  return `sicog-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function SelloSicog({ className }: { className?: string }) {
  const id = useIdSvg();
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="SICOG — Sistema de Control Operacional de Gas"
    >
      <defs>
        <linearGradient id={`${id}-llama`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
        {/* r=193: con 203, la parte alta de las letras quedaba pegada al aro. */}
        <path id={`${id}-sup`} d="M63,256 A193,193 0 0 1 449,256" />
        <path id={`${id}-inf`} d="M38,256 A218,218 0 0 0 474,256" />
      </defs>
      {/* Aros */}
      <circle cx="256" cy="256" r="244" fill="none" stroke="var(--primary)" strokeWidth="9" />
      <circle cx="256" cy="256" r="186" fill="none" stroke="var(--muted-foreground)" strokeWidth="2.5" />
      <circle
        cx="256"
        cy="256"
        r="175"
        fill="none"
        stroke="var(--primary)"
        strokeOpacity="0.5"
        strokeWidth="7"
        strokeDasharray="120 26"
        strokeLinecap="round"
        transform="rotate(-78 256 256)"
      />
      <circle cx="44" cy="256" r="7" fill="var(--primary)" />
      <circle cx="468" cy="256" r="7" fill="var(--primary)" />
      {/* Textos */}
      <text
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize="42"
        letterSpacing="15"
        fill="currentColor"
      >
        <textPath href={`#${id}-sup`} startOffset="50%" textAnchor="middle">
          SICOG
        </textPath>
      </text>
      <text
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="20.5"
        letterSpacing="1.4"
        fill="currentColor"
      >
        <textPath href={`#${id}-inf`} startOffset="50%" textAnchor="middle">
          SISTEMA DE CONTROL OPERACIONAL DE GAS
        </textPath>
      </text>
      {/* El centro va escalado un 15% sobre su propio punto medio: el mapa
          llena el espacio hasta los aros, como en el sello original. */}
      <g transform="translate(256 262) scale(1.15) translate(-256 -262)">
        {/* Mapa: el tamaño sale de que ningún punto del contorno pase de r=159
            del centro del sello (el borde interno del aro punteado está en
            171,5), ya contando la escala del grupo; centrado en (256,256). */}
        <path
          d="M156.6,162.8 L164.3,169.2 L168.9,172.8 L163.4,175.6 L172.5,174.7 L182.6,169.2 L189.0,166.4 L188.1,160.0 L192.7,151.7 L197.3,160.0 L200.0,165.5 L212.9,166.4 L222.1,170.1 L225.7,179.3 L240.4,181.1 L255.1,181.1 L264.3,182.0 L273.4,188.4 L282.6,190.3 L291.8,186.6 L299.1,181.1 L306.5,180.2 L321.1,178.9 L335.8,178.9 L341.9,179.3 L332.1,183.9 L326.6,188.4 L335.8,192.1 L346.8,193.9 L357.8,200.4 L361.5,210.5 L372.5,217.8 L379.8,223.3 L367.0,236.1 L365.2,245.3 L356.0,252.7 L355.1,263.7 L362.4,280.2 L348.6,285.7 L330.3,298.5 L312.0,303.1 L299.1,300.4 L289.9,298.5 L299.1,320.5 L302.8,331.5 L295.4,348.1 L280.8,355.4 L260.6,361.8 L249.6,353.6 L242.2,338.9 L233.1,324.2 L236.7,309.5 L232.1,293.0 L233.1,274.7 L240.4,261.8 L220.2,261.8 L203.7,263.7 L190.9,248.1 L172.5,247.2 L154.2,246.2 L148.7,230.6 L148.7,221.5 L142.3,208.6 L132.2,206.8 L139.5,184.8 L146.8,171.9Z"
          fill="var(--primary)"
          fillOpacity="0.13"
          stroke="var(--primary)"
          strokeOpacity="0.75"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M295.4,173.8 L299.1,171.0 L305.5,171.0 L306.5,174.7 L300.9,175.6 L295.4,174.7Z"
          fill="var(--primary)"
          fillOpacity="0.13"
          stroke="var(--primary)"
          strokeOpacity="0.75"
          strokeWidth="1.6"
        />
        {/* Red */}
        <g stroke="var(--primary)" strokeWidth="3" strokeLinecap="round">
          <path d="M256,252 L197,282 M256,252 L315,282 M256,252 L256,334 M256,252 L186,214 M256,252 L328,208 M186,214 L148,238 M328,208 L370,232 M328,208 L352,172 M148,238 L170,300" />
        </g>
        {/* El flujo: un pulso de luz sale del nodo central por cada línea, y al
            llegar al primer nodo sigue por el tramo exterior (el retardo de
            `.logo-pulso-2`). Cada tramo empieza en el nodo más cercano al
            centro, que es de donde parte el pulso. */}
        <g fill="none" stroke="var(--primary-foreground)" strokeWidth="10" strokeLinecap="round">
          <path
            className="logo-pulso"
            d="M256,252 L197,282 M256,252 L315,282 M256,252 L256,334 M256,252 L186,214 M256,252 L328,208"
          />
          <path
            className="logo-pulso logo-pulso-2"
            d="M186,214 L148,238 M328,208 L370,232 M328,208 L352,172 M148,238 L170,300"
          />
        </g>
        <g fill="var(--primary)">
          <circle cx="186" cy="214" r="6" />
          <circle cx="328" cy="208" r="6" />
          <circle cx="148" cy="238" r="5" />
          <circle cx="370" cy="232" r="5" />
          <circle cx="352" cy="172" r="5" />
          <circle cx="170" cy="300" r="5" />
        </g>
        {/* El latido del nodo central, a la par de cada pulso. */}
        <circle className="logo-latido" cx="256" cy="252" r="11" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
        <circle cx="256" cy="252" r="11" fill="var(--primary)" />
        <circle cx="256" cy="252" r="5" fill="#93c5fd" />
        {/* Llama: parpadea desde la base (`.logo-llama`); la interior va
            desfasada para que no se mueva en bloque. */}
        <path
          className="logo-llama"
          d="M256,150 C272,172 291,188 289,212 C288,230 274,242 256,242 C238,242 224,230 223,212 C222,195 235,183 240,168 C243,181 248,188 253,190 C251,177 252,163 256,150 Z"
          fill={`url(#${id}-llama)`}
        />
        <path
          className="logo-llama logo-llama-interior"
          d="M256,197 C265,207 271,215 270,224 C269,233 263,238 256,238 C249,238 243,233 242,225 C242,216 250,210 256,197 Z"
          fill="#dbeafe"
        />
        {/* Instrumentos: presión, temperatura, válvula */}
        <g fill="var(--card)" stroke="var(--primary)" strokeWidth="3">
          <circle cx="197" cy="282" r="25" />
          <circle cx="315" cy="282" r="25" />
          <circle cx="256" cy="334" r="25" />
        </g>
        <g fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round">
          <path d="M185,289 A13,13 0 1 1 209,289" />
          <path d="M197,283 L205,273" />
          <path d="M256,321 L256,338" />
          <circle cx="256" cy="343" r="4.5" fill="var(--primary)" />
          <path d="M315,282 L315,269 M309,268 L321,268" />
        </g>
        <path d="M302,274 L328,290 L328,274 L302,290 Z" fill="var(--primary)" />
        <g
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="800"
          fontSize="17"
          fill="currentColor"
          textAnchor="middle"
        >
          <text x="197" y="326">
            P
          </text>
          <text x="315" y="326">
            V
          </text>
          <text x="256" y="378">
            T
          </text>
        </g>
      </g>
    </svg>
  );
}

export function MarcaSicog({ className }: { className?: string }) {
  const id = useIdSvg();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-llama`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28.5" fill="none" stroke="var(--primary)" strokeWidth="5" />
      <g stroke="var(--primary)" strokeWidth="2.6" strokeLinecap="round">
        <path d="M32,46 L13,40 M32,46 L51,40 M32,46 L32,55" />
      </g>
      <circle cx="13" cy="40" r="3" fill="var(--primary)" />
      <circle cx="51" cy="40" r="3" fill="var(--primary)" />
      <circle cx="32" cy="55" r="3" fill="var(--primary)" />
      <path
        d="M32,9 C37.5,16 43,21 43,28.5 C43,35 38,39.5 32,39.5 C26,39.5 21,35 21,28.5 C21,23 24.5,19.5 26.5,15 C28,19 29.8,21.5 31.2,22 C30.7,17.5 31,13 32,9 Z"
        fill={`url(#${id}-llama)`}
      />
      <path
        d="M32,24.5 C34.8,27.8 37,30.5 37,33.2 C37,36.3 34.8,38.5 32,38.5 C29.2,38.5 27,36.3 27,33.4 C27,30.5 29.6,28.2 32,24.5 Z"
        fill="#dbeafe"
      />
      <circle cx="32" cy="46" r="4.5" fill="var(--primary)" />
    </svg>
  );
}
