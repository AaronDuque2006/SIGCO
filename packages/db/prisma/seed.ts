import { PrismaClient } from "@prisma/client";
import { CLIENTES_SEED } from "./clientes.seed.js";

const prisma = new PrismaClient();

// SISTEMA (7, decisión #16) y la asignación sistema_id de FUENTE (decisión
// #41) confirmados con Manual DAO.pptx ("Guía de Información Sistemas de
// Transporte de Gas 2023", en archivos-fuente/) - nomenclatura oficial de
// estaciones por sistema.
const SISTEMAS = [
  "Anaco - José - Puerto La Cruz - Sinorgas",
  "Anaco - Puerto Ordaz",
  "La Toscana - San Vicente",
  "Jusepín - Criogénico",
  "Anaco - Caracas - Barquisimeto - Río Seco",
  "Ulé - Amuay",
  "Transcaribeño",
] as const;

async function seedSistemaYFuente() {
  const sistemas = new Map<string, { id: number }>();
  for (const nombre of SISTEMAS) {
    const existente = await prisma.sistema.findFirst({ where: { nombre }, select: { id: true } });
    sistemas.set(nombre, existente ?? (await prisma.sistema.create({ data: { nombre } })));
  }

  const anacoJosePLC = sistemas.get("Anaco - José - Puerto La Cruz - Sinorgas")!.id;
  const anacoPuertoOrdaz = sistemas.get("Anaco - Puerto Ordaz")!.id;
  const anacoCaracas = sistemas.get("Anaco - Caracas - Barquisimeto - Río Seco")!.id;
  const jusepinCriogenico = sistemas.get("Jusepín - Criogénico")!.id;
  const uleAmuay = sistemas.get("Ulé - Amuay")!.id;

  const fuentes: { nombre: string; sistemaId: number }[] = [
    // Manual DAO: "Extracción San Joaquín" / "Criogénico San Joaquín" -> este sistema.
    { nombre: "San Joaquín Tren A y B", sistemaId: anacoJosePLC },
    { nombre: "San Joaquín Tren C", sistemaId: anacoJosePLC },
    // RECAT SJ / SJB FI FII: no aparecen con ese nombre exacto en el manual,
    // inferido por convención "SJ" = San Joaquín (decisión #41, sin confirmar al 100%).
    { nombre: "RECAT SJ", sistemaId: anacoJosePLC },
    { nombre: "SJB FI FII", sistemaId: anacoJosePLC },

    // Manual DAO: "Santa Bárbara STB", "Soto STO", "Aguasay Nueva AGN",
    // "Bajo Guanipa BJG", "Zapato Viejo ZPV", "Estación Terminal San Joaquín ETSJ".
    { nombre: "Santa Bárbara Tren A y B", sistemaId: jusepinCriogenico },
    { nombre: "Santa Bárbara Tren C", sistemaId: jusepinCriogenico },
    { nombre: "Jusepín", sistemaId: jusepinCriogenico },
    { nombre: "Soto", sistemaId: jusepinCriogenico },
    { nombre: "Aguasay 5A", sistemaId: jusepinCriogenico },
    { nombre: "Bajo Guanipa", sistemaId: jusepinCriogenico },
    { nombre: "ETSJ", sistemaId: jusepinCriogenico },
    { nombre: "Zapato Viejo", sistemaId: jusepinCriogenico },
    { nombre: "Corredor Jusepín-Criogénico", sistemaId: jusepinCriogenico },

    // Manual DAO: segmento de tubería "La Pica - El Tablazo" dentro de la
    // sección técnica de Ulé-Amuay.
    { nombre: "El Tablazo LGN1", sistemaId: uleAmuay },
    { nombre: "El Tablazo LGN2", sistemaId: uleAmuay },
    { nombre: "C. Petroquímico", sistemaId: uleAmuay },
    { nombre: "Planta Fertilizante", sistemaId: uleAmuay },
    { nombre: "Comb. Trans. a Pequiven", sistemaId: uleAmuay },
    { nombre: "Hacia La Paz Gas E&P", sistemaId: uleAmuay },
    { nombre: "Hacia Ramón Laguna", sistemaId: uleAmuay },
    { nombre: "Hacia La Pica-Ule Amuay", sistemaId: uleAmuay },
    { nombre: "Hacia La Pica-Retorno a Prod.", sistemaId: uleAmuay },

    // Empresas Mixtas/LIC (decisión #47). El Manual DAO las llama textualmente
    // "FUENTES QUE APORTAN GAS AL SISTEMA" (slide 27), y el bloque "APORTE" de
    // la hoja FUENTES lleva volúmenes distintos a los que estas mismas empresas
    // consumen como CLIENTE: son dos flujos, no uno.
    { nombre: "Petro Monagas", sistemaId: anacoPuertoOrdaz },
    { nombre: "Mavegas (Pesados)", sistemaId: anacoPuertoOrdaz },
    { nombre: "Bitor (Extrapesados)", sistemaId: anacoPuertoOrdaz },
    { nombre: "Petropiar", sistemaId: anacoPuertoOrdaz },
    { nombre: "Petro Delta", sistemaId: anacoPuertoOrdaz },
    { nombre: "Gas Guárico", sistemaId: anacoCaracas },
    { nombre: "Ypergas", sistemaId: anacoCaracas },
    { nombre: "Cardón IV", sistemaId: uleAmuay },
    { nombre: "PAGMI", sistemaId: anacoJosePLC },
  ];

  await insertarFaltantes(
    fuentes,
    (f) => `${f.nombre}|${f.sistemaId}`,
    async () =>
      (await prisma.fuente.findMany({ select: { nombre: true, sistemaId: true } })).map(
        (f) => `${f.nombre}|${f.sistemaId}`,
      ),
    (nuevas) => prisma.fuente.createMany({ data: nuevas }),
  );
}

// Inserta sólo lo que todavía no está. Permite ampliar un catálogo sin borrar
// la base ni duplicar filas al re-correr el seed.
//
// La clave no puede ser sólo el nombre: el Excel real trae clientes homónimos
// legítimos (ALCASA en dos regiones, y una bolsa "OTROS" por sistema), así que
// cada catálogo define qué combinación lo identifica.
async function insertarFaltantes<T>(
  deseadas: T[],
  clave: (item: T) => string,
  existentes: () => Promise<string[]>,
  crear: (nuevas: T[]) => Promise<unknown>,
): Promise<number> {
  const yaEstan = new Set(await existentes());
  const faltantes = deseadas.filter((d) => !yaEstan.has(clave(d)));
  if (faltantes.length > 0) await crear(faltantes);
  return faltantes.length;
}

async function seedRegionOperativa() {
  if ((await prisma.regionOperativa.count()) > 0) return;
  await prisma.regionOperativa.createMany({
    data: ["Oriente", "Centro", "Centro-Occidente", "Occidente"].map((nombre) => ({ nombre })),
  });
}

async function seedRegionMtto() {
  if ((await prisma.regionMtto.count()) > 0) return;
  await prisma.regionMtto.createMany({
    data: ["Nor-Oriente", "Este-Oriente", "Sur-Oriente", "Centro", "Centro-Occidente", "Occidente"].map(
      (nombre) => ({ nombre }),
    ),
  });
}

async function seedSectorCliente() {
  if ((await prisma.sectorCliente.count()) > 0) return;
  await prisma.sectorCliente.createMany({
    data: ["Empresa Mixta", "Petrolero", "Eléctrico", "Siderúrgico", "Petroquímico", "Cemento", "Otros"].map(
      (nombre) => ({ nombre }),
    ),
  });
}

async function seedDepartamentoYPuesto() {
  if ((await prisma.departamento.count()) === 0) {
    await prisma.departamento.createMany({
      data: ["Despacho", "Mantenimiento", "Análisis Operacional", "Calidad de Gas"].map((nombre) => ({ nombre })),
    });
  }
  if ((await prisma.puesto.count()) === 0) {
    await prisma.puesto.createMany({
      data: ["Gerente", "Superintendente", "Supervisor", "Ingeniero", "Analista"].map((nombre) => ({ nombre })),
    });
  }
}

// Valores reales confirmados en DISPON_SISUGAS_Semana_35.xls (hoja "REPORTE
// SEMANAL"), con typos corregidos (decisión de esta sesión: normalizar
// OPERATIVO/OPERATIVA y variantes descriptivas a un solo valor por estado).
// ACTIVO (comunicación) y "EN FALLA" (eléctrico/instrumentación) no aparecen
// literalmente en el archivo (que solo lista estaciones CON problemas), se
// infirieron por simetría con las demás dimensiones - revisar con el
// Supervisor de Mantenimiento antes de dar por cerrado el catálogo.
async function seedEstadoTelemetria() {
  if ((await prisma.estadoTelemetria.count()) > 0) return;
  const valores: { dimension: "COMUNICACION" | "ELECTRICO" | "INSTRUMENTACION" | "CASETA"; nombre: string }[] = [
    { dimension: "COMUNICACION", nombre: "Activo" },
    { dimension: "COMUNICACION", nombre: "En falla" },
    { dimension: "COMUNICACION", nombre: "Fuera de servicio" },
    { dimension: "ELECTRICO", nombre: "Activo" },
    { dimension: "ELECTRICO", nombre: "En falla" },
    { dimension: "ELECTRICO", nombre: "Hurtado" },
    { dimension: "INSTRUMENTACION", nombre: "Activo" },
    { dimension: "INSTRUMENTACION", nombre: "En falla" },
    { dimension: "CASETA", nombre: "Operativo" },
    { dimension: "CASETA", nombre: "Necesita mantenimiento" },
  ];
  await prisma.estadoTelemetria.createMany({ data: valores });
}

// INSUMO/PRODUCTO_SERVICIO de Mantenimiento, de ACTIVIDADES MDC FINAL V4.xls
// (hoja "GENERAL MDC 2025", tabla condensada filas 52-70). Se corrigieron 2
// typos reales del archivo ("SITEMA" -> "Sistema", "SYSTEMA" -> "Sistema").
async function seedInsumoProductoServicio() {
  const mantenimiento = await prisma.departamento.findFirstOrThrow({ where: { nombre: "Mantenimiento" } });
  if ((await prisma.insumo.count({ where: { departamentoId: mantenimiento.id } })) > 0) return;

  const catalogo: { insumo: string; descripcionActividad: string; productos: string[] }[] = [
    {
      insumo: "Base de Datos Operacional",
      descripcionActividad:
        "Ejerce custodia, mantenimiento y atención de fallas de la base de datos operacional de PDVSA Gas",
      productos: [
        "Respaldo data / históricos - Infoplus 21",
        "Actualización - solicitud de requerimientos - soporte técnico base de datos operacional Infoplus21 y Aspentech",
        "Mantenimiento preventivo / correctivo servidor Infoplus 21",
      ],
    },
    {
      insumo: "SCADA Nacional de PDVSA Gas",
      descripcionActividad: "Ejerce custodia de los equipos pertenecientes al sistema SCADA de PDVSA Gas",
      productos: [
        "Respaldo data / históricos servidores SCADA",
        "Respaldo data consolas de supervisión y control",
        "Mantenimiento preventivo / correctivo servidores SCADA",
        "Mantenimiento preventivo - correctivo consolas de supervisión y control",
        "Actualización / solicitud de requerimientos (base de datos, despliegues, tendencias, netview, cargas)",
      ],
    },
    {
      insumo: "Sistema de Grabación de Llamadas",
      descripcionActividad: "Ejerce custodia, mantenimiento, actualización y atención de solicitudes",
      productos: [
        "Mantenimiento de equipos asociados, actualización de consolas de trabajo remotas, gestión de solicitudes",
      ],
    },
    {
      insumo: "Sistema de Video Wall",
      descripcionActividad:
        "Custodia, mantenimiento, instalación de nuevas pantallas, mantenimiento de equipos periféricos",
      productos: ["Mantenimiento / actualización de equipos asociados y gestión de solicitudes"],
    },
    {
      insumo: "Estaciones de Transporte y Distribución T&D Gas Metano",
      descripcionActividad: "Soporte técnico a personal de Operaciones / Ingeniería / AIT / T&D Metano PDVSA Gas",
      productos: [
        "Mantener alta disponibilidad en las señales que reportan al SCADA de PDVSA Gas / asesoría en solución de fallas, configuración de equipos, instalación de nuevas tecnologías, atención de requerimientos, reuniones",
        "Soporte técnico en sitio: mantener alta disponibilidad en las señales que reportan al SCADA de PDVSA Gas / asesoría en solución de fallas, configuración de equipos, instalación de nuevas tecnologías, inspecciones",
      ],
    },
    {
      insumo: "Plan de Formación",
      descripcionActividad: "Adiestramiento",
      productos: [
        "Capacitación y mejora continua del personal de Mantenimiento Despacho de Gas",
        "Impartir capacitación a personal de T&D Metano - PDVSA Gas (CEFOGAS: telemetría / regulación monitor - activo / PLC micro ControlWave)",
      ],
    },
    {
      insumo: "Informe",
      descripcionActividad: "Mantener alta disponibilidad en las señales que reportan al SCADA de PDVSA Gas",
      productos: ["Reporte disponibilidad telemetría - Operaciones"],
    },
    {
      insumo: "Informe",
      descripcionActividad: "Control y gestión",
      productos: ["Reporte de telemetría - Control y Gestión"],
    },
    {
      insumo: "Guardia",
      descripcionActividad: "Plan de guardias",
      productos: ["Guardia fin de semana - Mtto Despacho de Gas / Guardia semanal - Despacho de Gas"],
    },
    {
      insumo: "Administrativo",
      descripcionActividad: "Administrativo",
      productos: ["Otras actividades"],
    },
  ];

  // "Informe" aparece dos veces en el catálogo real (dos actividades
  // distintas bajo el mismo insumo) - se reutiliza la fila si ya se creó
  // en esta misma corrida, para no duplicar el Insumo.
  const insumosCreados = new Map<string, { id: number }>();

  for (const grupo of catalogo) {
    let insumo = insumosCreados.get(grupo.insumo);
    if (!insumo) {
      insumo = await prisma.insumo.create({ data: { nombre: grupo.insumo, departamentoId: mantenimiento.id } });
      insumosCreados.set(grupo.insumo, insumo);
    }

    await prisma.productoServicio.createMany({
      data: grupo.productos.map((nombre) => ({
        insumoId: insumo.id,
        nombre,
        descripcionActividad: grupo.descripcionActividad,
      })),
    });
  }
}

// Los 110 clientes reales de la hoja CEN-ORI (decisión #46). El sistema sale
// del mapeo etiqueta-del-Excel -> sistema oficial del Manual DAO; la región y
// el sector salen de las fórmulas de "Consumo por Sectores", no de inferir por
// el nombre.
async function seedClientes() {
  const [sistemas, regiones, sectores] = await Promise.all([
    prisma.sistema.findMany({ select: { id: true, nombre: true } }),
    prisma.regionOperativa.findMany({ select: { id: true, nombre: true } }),
    prisma.sectorCliente.findMany({ select: { id: true, nombre: true } }),
  ]);
  const idPor = (filas: { id: number; nombre: string }[], nombre: string, que: string) => {
    const fila = filas.find((f) => f.nombre === nombre);
    if (!fila) throw new Error(`Seed de clientes: no existe ${que} "${nombre}"`);
    return fila.id;
  };

  await insertarFaltantes(
    CLIENTES_SEED.map((c) => ({
      nombre: c.nombre,
      sistemaId: idPor(sistemas, c.sistema, "sistema"),
      regionId: idPor(regiones, c.region, "región"),
      sectorId: idPor(sectores, c.sector, "sector"),
    })),
    (c) => `${c.nombre}|${c.sistemaId}|${c.regionId}`,
    async () =>
      (await prisma.cliente.findMany({ select: { nombre: true, sistemaId: true, regionId: true } })).map(
        (c) => `${c.nombre}|${c.sistemaId}|${c.regionId}`,
      ),
    (nuevos) => prisma.cliente.createMany({ data: nuevos }),
  );
}

async function main() {
  await seedSistemaYFuente();
  await seedRegionOperativa();
  await seedRegionMtto();
  await seedSectorCliente();
  await seedDepartamentoYPuesto();
  await seedEstadoTelemetria();
  await seedInsumoProductoServicio();
  await seedClientes();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
