/**
 * Siembra una semana de datos de **demostración** del módulo Despacho.
 *
 *   pnpm --filter api run sembrar-demo            # siembra
 *   pnpm --filter api run sembrar-demo -- --limpiar   # borra sólo lo sembrado
 *
 * Las cifras son **plausibles, no reales**: el orden de magnitud es el del
 * negocio —clientes grandes grandes, chicos chicos, un total nacional del orden
 * de los 1.800 MMPCED— pero ningún número sale del workbook de PDVSA. Decisión
 * del owner el 2026-09-18, para poder mostrar el sistema sin exponer datos
 * operativos reales.
 *
 * Es **determinista**: el generador va con semilla fija, así que sembrar dos
 * veces da exactamente lo mismo y la demostración no cambia entre ensayo y
 * función.
 *
 * Los `CIERRE_PROMEDIO` **no se escriben a mano**: se corre el job de cierre
 * real sobre los días pasados, que es el único que puede escribirlos
 * (decisión #42). Así lo que se muestra en pantalla es lo que el sistema
 * calcula, no algo puesto para la foto.
 */
import { cierreDiarioService, sumarDias } from "../modules/despacho/services/cierre-diario.service.js";
import { prisma } from "../shared/prisma-client.js";

const DIAS = 7;
const ZONA = "America/Caracas";

/** Generador con semilla: mismo resultado en cada corrida (mulberry32). */
const generador = (semilla: number) => {
  let a = semilla;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hoyEnZona = (): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, dateStyle: "short" }).format(new Date());

const aFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);
const redondear = (v: number): number => Math.round(v * 100) / 100;

/**
 * Cuánto consume un cliente, por sector.
 *
 * El reparto no es plano a propósito: el reporte de Consumo por Sectores tiene
 * que mostrar una dona con proporciones distinguibles, y en la operación real
 * el petrolero y el eléctrico pesan mucho más que el resto.
 *
 * **Los rangos están calibrados contra el reparto real de los 111 clientes**
 * (36 Otros, 31 Eléctrico, 20 Petrolero, 13 Siderúrgico, 6 Petroquímico, 5
 * Cemento) para que el total nacional quede en el orden de los 1.800 MMPCED que
 * `PRODUCT.md` declara. Un total fuera de escala lo nota en la primera mirada
 * cualquiera que conozca la operación, y ahí se pierde la demostración.
 */
const BASE_POR_SECTOR: Record<string, [number, number]> = {
  Petrolero: [14, 52],
  Eléctrico: [10, 40],
  Siderúrgico: [4, 17],
  Petroquímico: [3, 13],
  Cemento: [1, 5],
  Otros: [0.4, 6],
};

async function limpiar(): Promise<void> {
  // El orden importa: primero lo que cuelga, después lo colgado.
  await prisma.lecturaBalanceHistorial.deleteMany();
  await prisma.lecturaFuenteHistorial.deleteMany();
  await prisma.lecturaTransferenciaHistorial.deleteMany();
  await prisma.quemaNacionalHistorial.deleteMany();
  await prisma.lecturaBalance.deleteMany();
  await prisma.lecturaFuente.deleteMany();
  await prisma.lecturaTransferencia.deleteMany();
  await prisma.quemaNacional.deleteMany();
  await prisma.novedadOperativa.deleteMany();
  await prisma.contacto.deleteMany();
  console.log("  Datos operativos de Despacho borrados.");
}

async function main(): Promise<void> {
  const soloLimpiar = process.argv.includes("--limpiar");

  const usuario = await prisma.usuario.findFirst({
    where: { bloqueado: false },
    orderBy: { id: "asc" },
    select: { id: true, nombre: true },
  });
  if (!usuario) throw new Error("No hay usuarios: cree el superadmin antes de sembrar.");

  await limpiar();
  if (soloLimpiar) return;

  const hoy = hoyEnZona();
  const fechas = Array.from({ length: DIAS }, (_, i) => sumarDias(hoy, -(DIAS - 1 - i)));
  console.log(`  Semana: ${fechas[0]} .. ${fechas[fechas.length - 1]}`);

  const [clientes, fuentes, puntos] = await Promise.all([
    prisma.cliente.findMany({ select: { id: true, sector: { select: { nombre: true } } } }),
    prisma.fuente.findMany({ select: { id: true } }),
    prisma.puntoTransferencia.findMany({ select: { id: true, bidireccional: true } }),
  ]);

  const azar = generador(20260918);

  // --- Clientes: una base por cliente, y variación diaria alrededor de ella.
  const baseCliente = new Map<number, number>();
  for (const c of clientes) {
    const [min, max] = BASE_POR_SECTOR[c.sector.nombre] ?? [1, 12];
    baseCliente.set(c.id, min + azar() * (max - min));
  }

  const lecturas: { clienteId: number; fecha: Date; volumen: number }[] = [];
  for (const fecha of fechas) {
    for (const c of clientes) {
      const base = baseCliente.get(c.id)!;
      // ±8% día a día: suficiente para que la serie tenga forma y el empaque
      // cambie de signo, sin que parezca ruido.
      lecturas.push({
        clienteId: c.id,
        fecha: aFecha(fecha),
        volumen: redondear(Math.max(0, base * (0.92 + azar() * 0.16))),
      });
    }
  }

  await prisma.lecturaBalance.createMany({
    data: lecturas.map((l) => ({
      clienteId: l.clienteId,
      fecha: l.fecha,
      tipoCorte: "PUNTUAL" as const,
      volumenMmpced: l.volumen,
      usuarioId: usuario.id,
    })),
  });
  console.log(`  ${lecturas.length} lecturas de clientes (PUNTUAL).`);

  // --- Correcciones: sin ellas el historial por fila queda vacío y no se
  //     puede mostrar la trazabilidad, que es de lo mejor que tiene el sistema.
  const guardadas = await prisma.lecturaBalance.findMany({
    where: { tipoCorte: "PUNTUAL" },
    select: { id: true, volumenMmpced: true },
    orderBy: { id: "asc" },
  });
  const aCorregir = guardadas.filter(() => azar() < 0.04);
  for (const l of aCorregir) {
    const anterior = Number(l.volumenMmpced);
    const nuevo = redondear(anterior * (0.9 + azar() * 0.2));
    await prisma.$transaction([
      prisma.lecturaBalanceHistorial.create({
        data: { lecturaId: l.id, volumenMmpcedAnt: anterior, usuarioId: usuario.id },
      }),
      prisma.lecturaBalance.update({
        where: { id: l.id },
        data: { volumenMmpced: nuevo, usuarioId: usuario.id },
      }),
    ]);
  }
  console.log(`  ${aCorregir.length} correcciones, con su historial.`);

  // --- Quema y transferencias van **antes** que las fuentes, porque el recibido
  //     tiene que apuntar al transportado **completo**. El transportado es
  //     clientes + quema + transferencias (decisiones #74 y #79): apuntar sólo
  //     a los clientes dejaba el recibido corto por construcción, y salían seis
  //     días desempacados de siete.
  const quemaPorDia = new Map<string, number>();
  for (const fecha of fechas) quemaPorDia.set(fecha, redondear(18 + azar() * 14));

  await prisma.quemaNacional.createMany({
    data: fechas.map((fecha) => ({
      fecha: aFecha(fecha),
      tipoCorte: "PUNTUAL" as const,
      mmpced: quemaPorDia.get(fecha)!,
      usuarioId: usuario.id,
    })),
  });
  console.log(`  ${fechas.length} registros de quema nacional.`);

  // El punto bidireccional alterna de signo, que es justamente lo que la
  // decisión #79 modeló y conviene mostrar.
  const transferencias = fechas.flatMap((fecha) =>
    puntos.map((p) => ({
      puntoId: p.id,
      fecha: aFecha(fecha),
      tipoCorte: "PUNTUAL" as const,
      mmpced: redondear(p.bidireccional ? (azar() < 0.4 ? -1 : 1) * (2 + azar() * 9) : 3 + azar() * 9),
      usuarioId: usuario.id,
    })),
  );
  await prisma.lecturaTransferencia.createMany({ data: transferencias });
  console.log(`  ${transferencias.length} lecturas de transferencias.`);

  const transferenciasPorDia = new Map<string, number>();
  for (const tr of transferencias) {
    const f = tr.fecha.toISOString().slice(0, 10);
    transferenciasPorDia.set(f, (transferenciasPorDia.get(f) ?? 0) + tr.mmpced);
  }

  // --- Fuentes: el recibido ronda el **transportado** ±2%, para que la
  //     variación sea chica y el empaque cambie de signo entre días.
  const porDia = new Map<string, number>();
  for (const l of lecturas) {
    const f = l.fecha.toISOString().slice(0, 10);
    porDia.set(f, (porDia.get(f) ?? 0) + l.volumen);
  }

  const lecturasFuente: { fuenteId: number; fecha: Date; volumen: number }[] = [];
  for (const fecha of fechas) {
    const transportado =
      (porDia.get(fecha) ?? 0) + (quemaPorDia.get(fecha) ?? 0) + (transferenciasPorDia.get(fecha) ?? 0);
    const objetivo = transportado * (0.98 + azar() * 0.04);
    const pesos = fuentes.map(() => 0.5 + azar());
    const suma = pesos.reduce((t, p) => t + p, 0);
    fuentes.forEach((f, i) => {
      lecturasFuente.push({
        fuenteId: f.id,
        fecha: aFecha(fecha),
        volumen: redondear((objetivo * pesos[i]) / suma),
      });
    });
  }
  await prisma.lecturaFuente.createMany({
    data: lecturasFuente.map((l) => ({
      fuenteId: l.fuenteId,
      fecha: l.fecha,
      volumenMmpced: l.volumen,
      usuarioId: usuario.id,
    })),
  });
  console.log(`  ${lecturasFuente.length} lecturas de fuentes.`);

  // --- Novedades y contactos: sin ellos esas dos pantallas se ven vacías.
  const TIPOS = ["Corrida de Pig", "Mantenimiento programado", "Falla de compresión", "Restricción operativa"];
  const CAUSAS = [
    "Mantenimiento preventivo del tramo.",
    "Baja presión en la estación de entrega.",
    "Parada programada de planta.",
    "Falla eléctrica en la estación.",
  ];
  const novedades = fechas.slice(0, 5).flatMap((fecha, i) => {
    const cliente = clientes[Math.floor(azar() * clientes.length)];
    const inicio = new Date(`${fecha}T${String(6 + i * 3).padStart(2, "0")}:15:00.000-04:00`);
    return [
      {
        clienteId: cliente.id,
        fuenteId: null,
        tipo: TIPOS[i % TIPOS.length],
        impacto: "Reducción parcial del suministro durante la ventana indicada.",
        inicio,
        fin: i % 2 === 0 ? new Date(inicio.getTime() + 5 * 3600 * 1000) : null,
        causa: CAUSAS[i % CAUSAS.length],
        mmpcedAfectados: redondear(2 + azar() * 20),
        usuarioId: usuario.id,
      },
    ];
  });
  await prisma.novedadOperativa.createMany({ data: novedades });

  const contactos = clientes.slice(0, 8).map((c, i) => ({
    clienteId: c.id,
    fuenteId: null,
    nombreOperador: ["J. Rivas", "M. Álvarez", "C. Peña", "L. Guerra", "A. Molina", "R. Ortiz", "S. Duarte", "N. Fajardo"][i],
    telefono: `0414-${String(1000000 + Math.floor(azar() * 8999999)).slice(0, 7)}`,
  }));
  await prisma.contacto.createMany({ data: contactos });
  console.log(`  ${novedades.length} novedades y ${contactos.length} contactos.`);

  // --- El cierre lo calcula el job real, no este script (decisión #42).
  const resumen = await cierreDiarioService.ejecutarPendientes(hoy);
  console.log(
    `  Job de cierre: ${resumen.diasCerrados.length} día(s) cerrado(s), ${resumen.cierresCreados} cierres calculados.`,
  );
  console.log(`\n  Listo. Usuario de las cargas: ${usuario.nombre}.`);
}

main()
  .catch((e: unknown) => {
    console.error("No se pudo sembrar la demostración:", e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
