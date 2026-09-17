#!/usr/bin/env node
/**
 * Validador de paletas — el "script" que DESIGN.md manda usar.
 *
 * Existía como una herramienta suelta de una sesión anterior y nunca se
 * commiteó, así que la regla "validar cualquier paleta nueva con el script"
 * apuntaba a algo que no estaba. Ahora está.
 *
 * Comprueba dos cosas distintas:
 *
 *   1. **Contraste WCAG** de texto contra superficie. Umbral AA: 4.5 para texto
 *      normal, 3.0 para texto grande y para bordes de control.
 *   2. **Separación entre colores categóricos** en ΔE2000, a color pleno y bajo
 *      las tres dicromacías. Se comparan **todos los pares**, y con `--anillo`
 *      además el par que cierra (el último toca al primero), que una lista
 *      lineal no mira.
 *
 * Uso:
 *   node scripts/validar-paleta.mjs contraste <fondo> <color>...
 *   node scripts/validar-paleta.mjs categorica <superficie> <color>... [--anillo]
 */

// --- sRGB → Lab ------------------------------------------------------------

const hexARgb = (hex) => {
  const h = hex.replace("#", "").trim();
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};

const aLineal = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminancia = (hex) => {
  const [r, g, b] = hexARgb(hex).map(aLineal);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Razón de contraste WCAG 2.1. */
const contraste = (a, b) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const rgbAXyz = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map(aLineal);
  return [
    R * 0.4124564 + G * 0.3575761 + B * 0.1804375,
    R * 0.2126729 + G * 0.7151522 + B * 0.072175,
    R * 0.0193339 + G * 0.119192 + B * 0.9503041,
  ];
};

const xyzALab = ([x, y, z]) => {
  // Blanco D65.
  const ref = [0.95047, 1.0, 1.08883];
  const f = ([x, y, z] = [x, y, z].map((v, i) => v / ref[i])).map((t) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116,
  );
  return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])];
};

const aLab = (rgb) => xyzALab(rgbAXyz(rgb));

// --- ΔE2000 ----------------------------------------------------------------

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const A1 = (1 + G) * a1;
  const A2 = (1 + G) * a2;
  const Cp1 = Math.hypot(A1, b1);
  const Cp2 = Math.hypot(A2, b2);
  const h = (a, b) => (a === 0 && b === 0 ? 0 : (deg(Math.atan2(b, a)) + 360) % 360);
  const hp1 = h(A1, b1);
  const hp2 = h(A2, b2);

  const dL = L2 - L1;
  const dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) {
    dh = hp2 - hp1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(rad(dh) / 2);

  const Lm = (L1 + L2) / 2;
  const Cpm = (Cp1 + Cp2) / 2;
  let hm = hp1 + hp2;
  if (Cp1 * Cp2 !== 0) {
    if (Math.abs(hp1 - hp2) > 180) hm += hp1 + hp2 < 360 ? 360 : -360;
    hm /= 2;
  }

  const T =
    1 -
    0.17 * Math.cos(rad(hm - 30)) +
    0.24 * Math.cos(rad(2 * hm)) +
    0.32 * Math.cos(rad(3 * hm + 6)) -
    0.2 * Math.cos(rad(4 * hm - 63));

  const Sl = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2);
  const Sc = 1 + 0.045 * Cpm;
  const Sh = 1 + 0.015 * Cpm * T;
  const Rt =
    -2 *
    Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7)) *
    Math.sin(rad(60 * Math.exp(-(((hm - 275) / 25) ** 2))));

  return Math.sqrt(
    (dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh),
  );
}

// --- Dicromacías (Viénot, Brettel & Mollon 1999) ---------------------------

const MATRICES = {
  protanopía: [0.11238, 0.88762, 0, 0.11238, 0.88762, 0, 0.004, -0.004, 1],
  deuteranopía: [0.29275, 0.70725, 0, 0.29275, 0.70725, 0, -0.02234, 0.02234, 1],
  tritanopía: [1, 0.14461, -0.14461, 0, 1, 0, 0, 0.85924, 0.14076],
};

const aSrgb = (v) => {
  const c = Math.min(1, Math.max(0, v));
  return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
};

function simular(hex, tipo) {
  if (tipo === "pleno") return hexARgb(hex);
  const m = MATRICES[tipo];
  const [r, g, b] = hexARgb(hex).map(aLineal);
  return [
    aSrgb(m[0] * r + m[1] * g + m[2] * b),
    aSrgb(m[3] * r + m[4] * g + m[5] * b),
    aSrgb(m[6] * r + m[7] * g + m[8] * b),
  ];
}

const VISIONES = ["pleno", "protanopía", "deuteranopía", "tritanopía"];

// --- Informes --------------------------------------------------------------

function informeContraste(fondo, colores) {
  console.log(`\nContraste WCAG contra ${fondo}\n`);
  let fallos = 0;
  for (const c of colores) {
    const r = contraste(fondo, c);
    const aa = r >= 4.5;
    const grande = r >= 3;
    if (!aa) fallos++;
    console.log(
      `  ${c}  ${r.toFixed(2).padStart(6)}:1   ` +
        `${aa ? "AA texto normal" : grande ? "sólo texto grande / bordes" : "NO PASA"}`,
    );
  }
  console.log(
    `\n  ${fallos === 0 ? "Todos pasan AA para texto normal." : `${fallos} por debajo de 4.5:1.`}`,
  );
  return fallos;
}

function informeCategorica(superficie, colores, anillo) {
  console.log(`\nPaleta categórica sobre ${superficie} — ${colores.length} tonos\n`);

  console.log("  Contraste de cada tono contra la superficie:");
  for (const c of colores) {
    const r = contraste(superficie, c);
    console.log(
      `    ${c}  ${r.toFixed(2).padStart(6)}:1  ${r >= 3 ? "ok como marca" : "DÉBIL como marca"}`,
    );
  }

  const pares = [];
  for (let i = 0; i < colores.length; i++) {
    for (let j = i + 1; j < colores.length; j++) pares.push([i, j, false]);
  }
  if (anillo && colores.length > 2) {
    // El par que cierra el anillo ya está en la lista; lo que se marca es la
    // adyacencia, que es la comparación que la vista hace sin querer.
    for (let i = 0; i < colores.length; i++) {
      const j = (i + 1) % colores.length;
      const p = pares.find(([a, b]) => (a === i && b === j) || (a === j && b === i));
      if (p) p[2] = true;
    }
  }

  let peor = { de: Infinity };
  let peorAdyacente = { de: Infinity };
  const debiles = [];

  for (const [i, j, adyacente] of pares) {
    let minimo = Infinity;
    let dondeMin = "";
    for (const v of VISIONES) {
      const de = deltaE2000(aLab(simular(colores[i], v)), aLab(simular(colores[j], v)));
      if (de < minimo) {
        minimo = de;
        dondeMin = v;
      }
    }
    const registro = { de: minimo, vision: dondeMin, a: colores[i], b: colores[j], adyacente };
    if (minimo < peor.de) peor = registro;
    if (adyacente && minimo < peorAdyacente.de) peorAdyacente = registro;
    if (minimo < 8) debiles.push(registro);
  }

  console.log("\n  Separación mínima entre pares (ΔE2000, peor visión):");
  console.log(
    `    Peor par global:     ${peor.a} vs ${peor.b}  ΔE ${peor.de.toFixed(1)} (${peor.vision})`,
  );
  if (anillo) {
    console.log(
      `    Peor par adyacente:  ${peorAdyacente.a} vs ${peorAdyacente.b}  ` +
        `ΔE ${peorAdyacente.de.toFixed(1)} (${peorAdyacente.vision})`,
    );
  }

  if (debiles.length > 0) {
    console.log(`\n  ${debiles.length} pares por debajo de ΔE 8 — necesitan codificación`);
    console.log("  secundaria (nombre y cifra en la leyenda) y no pueden quedar adyacentes:");
    for (const d of debiles.sort((x, y) => x.de - y.de)) {
      console.log(
        `    ${d.a} vs ${d.b}  ΔE ${d.de.toFixed(1)} (${d.vision})${d.adyacente ? "  ← ADYACENTE" : ""}`,
      );
    }
  } else {
    console.log("\n  Ningún par cae por debajo de ΔE 8 en ninguna visión.");
  }

  return debiles.filter((d) => d.adyacente).length;
}

// --- Entrada ---------------------------------------------------------------

const [, , modo, ...resto] = process.argv;
const anillo = resto.includes("--anillo");
const args = resto.filter((a) => a !== "--anillo");

if (modo === "contraste" && args.length >= 2) {
  process.exitCode = informeContraste(args[0], args.slice(1)) > 0 ? 1 : 0;
} else if (modo === "categorica" && args.length >= 3) {
  process.exitCode = informeCategorica(args[0], args.slice(1), anillo) > 0 ? 1 : 0;
} else {
  console.error(
    "Uso:\n" +
      "  node scripts/validar-paleta.mjs contraste  <fondo> <color>...\n" +
      "  node scripts/validar-paleta.mjs categorica <superficie> <color>... [--anillo]",
  );
  process.exitCode = 2;
}
