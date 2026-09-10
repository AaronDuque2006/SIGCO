import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// NOTA: SISTEMA y FUENTE quedan fuera de este seed a propósito. La decisión
// #16 (9 sistemas) está en revisión — el owner del proyecto indicó que en
// realidad son 7, con un sistema nuevo ("Jusepín Criogénico") no contemplado
// antes, pendiente de confirmar contra el manual DAO. No se siembra un
// catálogo bajo disputa (CONTEXTO_PROYECTO.md, "ask before assuming").

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

async function main() {
  await seedRegionOperativa();
  await seedRegionMtto();
  await seedSectorCliente();
  await seedDepartamentoYPuesto();
  await seedEstadoTelemetria();
  await seedInsumoProductoServicio();
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
