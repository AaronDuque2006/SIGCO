"use client";

import { useEffect, useRef } from "react";

/**
 * Retícula que se enciende alrededor del cursor. Basada en `CursorGrid` de
 * React Bits, con tres cambios que el proyecto necesitaba.
 *
 * **1. Escucha en `window`, no en su propio contenedor.** El original pone los
 * listeners en el `div` que lo envuelve, lo que obliga a que ese `div` reciba
 * eventos — y acá vive **detrás del formulario**. Con los listeners en la
 * ventana, la capa entera puede ser `pointer-events: none`, el formulario
 * funciona normal, y la retícula sigue al cursor también por encima de él, que
 * además se ve mejor.
 *
 * **2. El color sale del tema, no de una constante.** Se lee `--primary` del
 * `<html>` y se vuelve a leer cuando cambia `data-theme`, así el fondo
 * acompaña al claro y al oscuro en vez de quedar pegado a un hex.
 *
 * **3. Respeta `prefers-reduced-motion`.** Quien pidió menos movimiento no
 * recibe ninguno: el componente no dibuja nada.
 *
 * **Va sólo en login y cambio de contraseña.** `DESIGN.md` fija que en este
 * sistema nada parpadea sin motivo y nada pide atención que no se ganó —es una
 * sala de control con la pantalla encendida doce horas—, así que esto **no se
 * lleva a ninguna pantalla operativa**. Son la puerta, no el instrumento.
 */

const SUAVIZADO = (t: number): number => t * t * (3 - 2 * t);

const aRgb = (hex: string): [number, number, number] => {
  const limpio = hex.trim().replace("#", "");
  const v =
    limpio.length === 3
      ? limpio
          .split("")
          .map((c) => c + c)
          .join("")
      : limpio;
  const n = Number.parseInt(v.slice(0, 6), 16);
  return Number.isNaN(n) ? [59, 130, 246] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

interface Ajustes {
  cellSize: number;
  radius: number;
  holdTime: number;
  fadeDuration: number;
  lineWidth: number;
  maxOpacity: number;
}

const AJUSTES: Ajustes = {
  cellSize: 72,
  radius: 150,
  holdTime: 350,
  fadeDuration: 900,
  lineWidth: 1.1,
  // Deliberadamente por debajo de 1: es un fondo, no un elemento. Tiene que
  // notarse al mover el cursor y desaparecer cuando alguien está leyendo el
  // formulario.
  maxOpacity: 0.5,
};

/**
 * Cuánto se extiende la penumbra alrededor de la tarjeta, en píxeles.
 *
 * La tarjeta es opaca y ya tapa lo que hay debajo, pero sin esto la retícula se
 * encendía hasta el filo y ahí se cortaba seco — un borde duro que delataba que
 * son dos capas. Con la penumbra el fondo se apaga *acercándose* a la tarjeta,
 * así que el corte deja de existir.
 */
const PENUMBRA = 110;

/** Distancia de un punto al rectángulo; 0 si cae adentro. */
const distanciaAlPanel = (x: number, y: number, r: DOMRect): number =>
  Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));

export function FondoCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Quien pidió menos movimiento no recibe ninguno.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let ancho = 0;
    let alto = 0;
    let columnas = 0;
    let filas = 0;
    let desfaseX = 0;
    let desfaseY = 0;
    let alfas = new Float32Array(0);
    let tocadas = new Float64Array(0);
    let raf = 0;
    let corriendo = false;
    let ultimoCuadro = 0;
    let rgb: [number, number, number] = [59, 130, 246];
    // El panel que la retícula tiene que respetar. Se busca perezosamente: el
    // canvas y la tarjeta montan en el mismo commit, pero depender del orden
    // sería frágil.
    let panel: HTMLElement | null = null;

    const leerColor = (): void => {
      const valor = getComputedStyle(document.documentElement).getPropertyValue("--primary");
      if (valor.trim() !== "") rgb = aRgb(valor);
    };

    const rehacer = (): void => {
      ancho = window.innerWidth;
      alto = window.innerHeight;
      canvas.width = Math.max(1, Math.round(ancho * dpr));
      canvas.height = Math.max(1, Math.round(alto * dpr));
      canvas.style.width = `${ancho}px`;
      canvas.style.height = `${alto}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columnas = Math.ceil(ancho / AJUSTES.cellSize) + 1;
      filas = Math.ceil(alto / AJUSTES.cellSize) + 1;
      desfaseX = (ancho - columnas * AJUSTES.cellSize) / 2;
      desfaseY = (alto - filas * AJUSTES.cellSize) / 2;
      alfas = new Float32Array(columnas * filas);
      tocadas = new Float64Array(columnas * filas);
    };

    const centro = (i: number): [number, number] => [
      desfaseX + (i % columnas) * AJUSTES.cellSize + AJUSTES.cellSize / 2,
      desfaseY + Math.floor(i / columnas) * AJUSTES.cellSize + AJUSTES.cellSize / 2,
    ];

    const encender = (x: number, y: number): void => {
      const r = AJUSTES.radius;
      const ahora = performance.now();
      const desdeCol = Math.max(0, Math.floor((x - r - desfaseX) / AJUSTES.cellSize));
      const hastaCol = Math.min(columnas - 1, Math.floor((x + r - desfaseX) / AJUSTES.cellSize));
      const desdeFila = Math.max(0, Math.floor((y - r - desfaseY) / AJUSTES.cellSize));
      const hastaFila = Math.min(filas - 1, Math.floor((y + r - desfaseY) / AJUSTES.cellSize));

      for (let f = desdeFila; f <= hastaFila; f++) {
        for (let c = desdeCol; c <= hastaCol; c++) {
          const i = f * columnas + c;
          const [cx, cy] = centro(i);
          const distancia = Math.hypot(cx - x, cy - y);
          if (distancia > r) continue;
          const nivel = SUAVIZADO(1 - distancia / r) * AJUSTES.maxOpacity;
          if (nivel > alfas[i]) alfas[i] = nivel;
          if (nivel > 0) tocadas[i] = ahora;
        }
      }
    };

    const dibujar = (ahora: number): void => {
      const dt = Math.min(ahora - ultimoCuadro, 50);
      ultimoCuadro = ahora;
      ctx.clearRect(0, 0, ancho, alto);
      const [cr, cg, cb] = rgb;
      const paso = dt / AJUSTES.fadeDuration;
      const medio = AJUSTES.cellSize / 2;
      let algoVisible = false;

      panel ??= document.querySelector<HTMLElement>("[data-panel-sobre-fondo]");
      const rectaPanel = panel?.getBoundingClientRect() ?? null;

      for (let i = 0; i < alfas.length; i++) {
        let a = alfas[i];
        if (a <= 0) continue;
        if (ahora - tocadas[i] > AJUSTES.holdTime) {
          a = Math.max(0, a - paso);
          alfas[i] = a;
          if (a <= 0) continue;
        }
        algoVisible = true;

        const [cx, cy] = centro(i);

        // La penumbra se aplica **al pintar** y no sobre `alfas`: si se
        // horneara en el estado, mover la ventana dejaría celdas apagadas
        // para siempre en donde antes estaba la tarjeta.
        let visible = a;
        if (rectaPanel !== null) {
          const d = distanciaAlPanel(cx, cy, rectaPanel);
          if (d <= 0) continue;
          if (d < PENUMBRA) visible = a * SUAVIZADO(d / PENUMBRA);
        }
        if (visible <= 0.002) continue;

        const degradado = ctx.createRadialGradient(cx, cy, medio * 0.1, cx, cy, AJUSTES.cellSize);
        degradado.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${visible})`);
        degradado.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);

        ctx.beginPath();
        ctx.rect(cx - medio + 0.5, cy - medio + 0.5, AJUSTES.cellSize - 1, AJUSTES.cellSize - 1);
        ctx.strokeStyle = degradado;
        ctx.lineWidth = AJUSTES.lineWidth;
        ctx.stroke();
      }

      // Se aparca solo cuando no queda nada encendido: sin esto, un `rAF` en
      // curso las veinticuatro horas gastaría batería y CPU dibujando nada.
      if (algoVisible) {
        raf = requestAnimationFrame(dibujar);
      } else {
        corriendo = false;
        ctx.clearRect(0, 0, ancho, alto);
      }
    };

    const despertar = (): void => {
      if (corriendo) return;
      corriendo = true;
      ultimoCuadro = performance.now();
      raf = requestAnimationFrame(dibujar);
    };

    const alMover = (e: PointerEvent): void => {
      encender(e.clientX, e.clientY);
      despertar();
    };

    leerColor();
    rehacer();

    // El tema se cambia poniendo `data-theme` en el `<html>`, así que el color
    // se vuelve a leer de ahí en vez de recargar la página.
    const observador = new MutationObserver(() => {
      leerColor();
      despertar();
    });
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("resize", rehacer);

    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("resize", rehacer);
    };
  }, []);

  return (
    // Decorativo: no aporta información, así que no se anuncia. Y no recibe
    // eventos, para que el formulario que está encima funcione normal.
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
