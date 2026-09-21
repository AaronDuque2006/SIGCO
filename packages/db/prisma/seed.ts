import { PrismaClient } from "@prisma/client";
import { CLIENTES_SEED } from "./clientes.seed.js";
import { AREAS_SEED, ESTACIONES_SEED, TIPOS_INSTRUMENTO_SEED } from "./estaciones.seed.js";

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

// Las 5 causas de falla del reporte semanal real (DISPON_SISUGAS_Semana_35.xls,
// hoja "OBSERVACION"). Las cantidades de la semana 35 -hurto 139, eléctrico 27,
// comunicación 20, esperando reporte 10, control local 5- suman exactamente las
// 201 estaciones en falla que publica la hoja "DATOS Y GRAFICAS".
async function seedCausaFalla() {
  const nombres = [
    "Afectación por hurto",
    "Suministro eléctrico",
    "Enlace de comunicación",
    "Sistema de control local",
    "Esperando reporte",
  ];
  await insertarFaltantes(
    nombres,
    (n) => n,
    async () => (await prisma.causaFalla.findMany({ select: { nombre: true } })).map((c) => c.nombre),
    (nuevas) => prisma.causaFalla.createMany({ data: nuevas.map((nombre) => ({ nombre })) }),
  );
}

// Inventario real de Mantenimiento: 20 áreas operacionales, 16 tipos de
// instrumento y 247 estaciones con sus cantidades, generado desde
// "INVENTARIO ESTACIONES.xls" por tools/generar-estaciones.js.
async function seedAreasEstacionesEInstrumentos() {
  const regiones = new Map(
    (await prisma.regionMtto.findMany({ select: { id: true, nombre: true } })).map((r) => [r.nombre, r.id]),
  );

  await insertarFaltantes(
    AREAS_SEED,
    (a) => `${a.region}|${a.nombre}`,
    async () =>
      (await prisma.areaMtto.findMany({ select: { nombre: true, region: { select: { nombre: true } } } })).map(
        (a) => `${a.region.nombre}|${a.nombre}`,
      ),
    (nuevas) =>
      prisma.areaMtto.createMany({
        data: nuevas.map((a) => {
          const regionId = regiones.get(a.region);
          if (!regionId) throw new Error(`falta la región de mantenimiento "${a.region}"`);
          return { nombre: a.nombre, regionId };
        }),
      }),
  );

  await insertarFaltantes(
    TIPOS_INSTRUMENTO_SEED,
    (n) => n,
    async () => (await prisma.tipoInstrumento.findMany({ select: { nombre: true } })).map((t) => t.nombre),
    (nuevos) => prisma.tipoInstrumento.createMany({ data: nuevos.map((nombre) => ({ nombre })) }),
  );

  const areas = new Map(
    (
      await prisma.areaMtto.findMany({ select: { id: true, nombre: true, region: { select: { nombre: true } } } })
    ).map((a) => [`${a.region.nombre}|${a.nombre}`, a.id]),
  );

  await insertarFaltantes(
    ESTACIONES_SEED,
    (e) => e.nodo,
    async () => (await prisma.estacion.findMany({ select: { nodo: true } })).map((e) => e.nodo),
    (nuevas) =>
      prisma.estacion.createMany({
        data: nuevas.map((e) => {
          const areaId = areas.get(`${e.region}|${e.area}`);
          if (!areaId) throw new Error(`falta el área "${e.area}" de ${e.region}`);
          return {
            nodo: e.nodo,
            nombre: e.nombre,
            areaId,
            tipoEnlaceCom: e.tipoEnlaceCom,
            tipoRed: e.tipoRed,
          };
        }),
      }),
  );

  const estaciones = new Map(
    (await prisma.estacion.findMany({ select: { id: true, nodo: true } })).map((e) => [e.nodo, e.id]),
  );
  const tipos = new Map(
    (await prisma.tipoInstrumento.findMany({ select: { id: true, nombre: true } })).map((t) => [t.nombre, t.id]),
  );
  const deseados = ESTACIONES_SEED.flatMap((e) =>
    Object.entries(e.instrumentos).map(([tipo, cantidad]) => ({ nodo: e.nodo, tipo, cantidad })),
  );

  await insertarFaltantes(
    deseados,
    (i) => `${i.nodo}|${i.tipo}`,
    async () =>
      (
        await prisma.estacionInstrumento.findMany({
          select: { estacion: { select: { nodo: true } }, tipoInstrumento: { select: { nombre: true } } },
        })
      ).map((i) => `${i.estacion.nodo}|${i.tipoInstrumento.nombre}`),
    (nuevos) =>
      prisma.estacionInstrumento.createMany({
        data: nuevos.map((i) => {
          const estacionId = estaciones.get(i.nodo);
          const tipoInstrumentoId = tipos.get(i.tipo);
          if (!estacionId || !tipoInstrumentoId) throw new Error(`no resuelve ${i.nodo}|${i.tipo}`);
          return { estacionId, tipoInstrumentoId, cantidad: i.cantidad };
        }),
      }),
  );
}

// INSUMO/PRODUCTO_SERVICIO de Mantenimiento, de ACTIVIDADES MDC FINAL V4.xls
// (hoja "GENERAL MDC 2025", tabla condensada filas 52-70). Se corrigieron 2
// typos reales del archivo ("SITEMA" -> "Sistema", "SYSTEMA" -> "Sistema").
async function seedInsumoProductoServicio() {
  const mantenimiento = await prisma.departamento.findFirstOrThrow({ where: { nombre: "Mantenimiento" } });

  const catalogo: { insumo: string; descripcionActividad: string; productos: string[] }[] = [
    {
      insumo: "Base de Datos Operacional",
      descripcionActividad:
        "Ejerce custodia, mantenimiento y atención de fallas de la base de datos operacional de PDVSA Gas",
      productos: [
        "Respaldo data / históricos - Infoplus 21",
        "Actualización, mantenimiento, gestión de requerimientos base de datos Infoplus21 / Aspentech",
        "Actualización - solicitud de requerimientos - soporte técnico base de datos operacional Infoplus21 y Aspentech",
        "Mantenimiento preventivo / correctivo servidor Infoplus 21",
      ],
    },
    {
      insumo: "SCADA Nacional de PDVSA Gas",
      descripcionActividad: "Ejerce custodia de los equipos pertenecientes al sistema SCADA de PDVSA Gas",
      productos: [
        "Respaldo data / históricos servidores SCADA",
        "Respaldo data / históricos servidores SCADA y consolas de supervisión y control",
        "Actualización y gestión de requerimientos SISUGAS (base de datos, despliegues, tendencias, netview, cargas)",
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
      insumo: "Estaciones de Transporte y Distribución T&D Gas Metano",
      descripcionActividad: "Soporte técnico a personal de Operaciones y gerencias de apoyo PDVSA Gas",
      productos: [
        "Asesoría, soporte técnico, actualización de tecnologías, atención de requerimientos",
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
      productos: ["Gestión administrativa", "Otras actividades"],
    },
    // Insumo que faltaba por completo: la primera lectura tomó la tabla
    // condensada y no la hoja de plan, donde sí está.
    {
      insumo: "Sistemas de Apoyo",
      descripcionActividad:
        "Custodia, mantenimiento, actualización sistemas tecnológicos de apoyo para el Despacho Central de Gas",
      productos: [
        "Mantenimiento, actualización y gestión de solicitudes equipos tecnológicos de apoyo (sistema grabación de llamadas, video wall, consola WebGas)",
      ],
    },
  ];

  // Aditivo, como el resto del seed. Antes cortaba temprano si ya había un
  // insumo, y por eso el catálogo se quedó corto cuando la segunda auditoría
  // encontró productos que la primera lectura no había visto: re-correr el
  // seed no los traía.
  //
  // "Informe" y "Estaciones T&D" aparecen más de una vez en el catálogo real
  // (actividades con descripción distinta bajo el mismo insumo), así que el
  // insumo se busca antes de crearlo.
  const insumosPorNombre = new Map<string, number>(
    (
      await prisma.insumo.findMany({
        where: { departamentoId: mantenimiento.id },
        select: { id: true, nombre: true },
      })
    ).map((i) => [i.nombre, i.id]),
  );

  for (const grupo of catalogo) {
    let insumoId = insumosPorNombre.get(grupo.insumo);
    if (insumoId === undefined) {
      const creado = await prisma.insumo.create({
        data: { nombre: grupo.insumo, departamentoId: mantenimiento.id },
      });
      insumoId = creado.id;
      insumosPorNombre.set(grupo.insumo, insumoId);
    }

    const id = insumoId;
    await insertarFaltantes(
      grupo.productos.map((nombre) => ({
        insumoId: id,
        nombre,
        descripcionActividad: grupo.descripcionActividad,
      })),
      (p) => `${p.nombre}|${p.insumoId}`,
      async () =>
        (
          await prisma.productoServicio.findMany({ select: { nombre: true, insumoId: true } })
        ).map((p) => `${p.nombre}|${p.insumoId}`),
      (nuevas) => prisma.productoServicio.createMany({ data: nuevas }),
    );
  }
}

// GERENCIA_REQUIRIENTE de Mantenimiento, de la lista de validación del
// workbook (columna Y de "ACTIVIDADES MENSUAL"). Se siembran las 16 de la
// lista y no las 6 que el trimestre auditado usó: es la lista que el área
// mantiene, así que representa su universo real.
//
// Erratas del archivo corregidas, mismo criterio que el resto del seed:
// "GENRENCIA GENERAL" -> "Gerencia General", y el acento grave de "DIRECCIÒN".
async function seedGerenciasRequirientes() {
  const mantenimiento = await prisma.departamento.findFirstOrThrow({
    where: { nombre: "Mantenimiento" },
  });

  const nombres = [
    "AIT",
    "Planificación",
    "DSI",
    "Comercialización",
    "Control Operacional",
    "Control y Gestión",
    "Gasificación",
    "Gerencia General",
    "GIO",
    "Manejo de Gas",
    "Mantenimiento Mayor",
    "Operaciones",
    "Otros",
    "Dirección",
    "Vice-Presidencia",
    "Calidad de Vida",
  ];

  await insertarFaltantes(
    nombres.map((nombre) => ({ nombre, departamentoId: mantenimiento.id })),
    (g) => `${g.nombre}|${g.departamentoId}`,
    async () =>
      (await prisma.gerenciaRequiriente.findMany({
        select: { nombre: true, departamentoId: true },
      })).map((g) => `${g.nombre}|${g.departamentoId}`),
    (nuevas) => prisma.gerenciaRequiriente.createMany({ data: nuevas }),
  );
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

/**
 * Sub-sistemas: las ramas de un sistema que el área reporta por separado.
 *
 * Son las tres que el gráfico "SISTEMAS" del balance abre como barra propia
 * (`EJECUTIVO PUNTUAL!A36:A44`); el resto de los bloques de `CEN-ORI` el propio
 * gráfico los suma de vuelta a su sistema, así que no necesitan existir acá.
 * Ver decisión #78.
 *
 * Los clientes salen de los bloques de `CEN-ORI`. Las filas `APORTE A EYP …`
 * del bloque COSTA ESTE no están: la decisión #46 las sacó del catálogo
 * `CLIENTE` por ser transferencias entre sistemas, no consumo.
 */
const SUBSISTEMAS: { sistema: string; nombre: string; clientes: string[] }[] = [
  {
    sistema: "Anaco - José - Puerto La Cruz - Sinorgas",
    nombre: "Nor Oriente / Sinorgas",
    clientes: [
      "P.E. JUAN BAUTISTA ARISMENDI",
      "P.E. ANTONIO JOSÉ DE SUCRE",
      "P.E. LUISA CACERES DE ARISMENDI",
      "P.E. JUAN MANUEL VALDEZ",
      "P.E. ALBERTO LOVERA",
    ],
  },
  {
    sistema: "Ulé - Amuay",
    nombre: "Costa Oeste",
    clientes: [
      "P.E. ENELVEN R.L. VIEJA",
      "P.E. ENELVEN R.L. NUEVA",
      "P.E. TERMOZULIA",
      "CONSUMO RAMAL SUR",
      "CONSUMO RAMAL NORTE (PTO. CABALLO / LA PAZ)",
      "CONSUMO RAMAL CENTRO",
      "P.E. ENELVEN RAFAEL URDANETA",
    ],
  },
  {
    sistema: "Ulé - Amuay",
    nombre: "Costa Este",
    clientes: [
      "CAMC COMBUSTIBLE INTERNO",
      "CAMC FERTILIZANTES",
      "CLIENTES INDUSTRIALES K00 (CABIGAS Y OTROS)",
      "PETROZAMORA K04+600",
      "P.E. PUNTA GORDA K00",
      "COSTA ESTE OTROS (LAGUNIGAS) K04+600",
      "SIZUCA (SIDERURGICA)",
    ],
  },
];

async function seedSubSistemas() {
  const sistemas = new Map(
    (await prisma.sistema.findMany({ select: { id: true, nombre: true } })).map((s) => [s.nombre, s.id]),
  );

  for (const sub of SUBSISTEMAS) {
    const sistemaId = sistemas.get(sub.sistema);
    if (sistemaId === undefined) {
      console.warn(`[seed] No existe el sistema "${sub.sistema}"; se omite el sub-sistema "${sub.nombre}".`);
      continue;
    }

    // Aditivo e idempotente, como el resto del seed: si ya está, se reusa.
    const fila =
      (await prisma.subSistema.findUnique({
        where: { sistemaId_nombre: { sistemaId, nombre: sub.nombre } },
        select: { id: true },
      })) ?? (await prisma.subSistema.create({ data: { sistemaId, nombre: sub.nombre }, select: { id: true } }));

    // Sólo se asignan los clientes que todavía no apuntan a ningún sub-sistema:
    // así volver a correr el seed no pisa una reasignación hecha a mano.
    const { count } = await prisma.cliente.updateMany({
      where: { nombre: { in: sub.clientes }, sistemaId, subSistemaId: null },
      data: { subSistemaId: fila.id },
    });

    const encontrados = await prisma.cliente.count({ where: { nombre: { in: sub.clientes }, sistemaId } });
    if (encontrados !== sub.clientes.length) {
      console.warn(
        `[seed] "${sub.nombre}": ${encontrados} de ${sub.clientes.length} clientes encontrados en el catálogo.`,
      );
    }
    console.log(`[seed] Sub-sistema "${sub.nombre}": ${count} cliente(s) asignado(s).`);
  }
}

/**
 * Puntos de transferencia: las cinco filas del workbook que salen del sistema
 * sin ser consumo de un cliente (decisión #79).
 *
 * Los cuatro `APORTE A EYP` viven en el bloque COSTA ESTE de `CEN-ORI` y la
 * transferencia ICO-NURGAS en el de ULÉ-AMUAY; los dos bloques los cuentan en
 * su TOTAL VENTAS, y de ahí viajan al transportado del Balance Nación.
 */
const PUNTOS_TRANSFERENCIA: {
  sistema: string;
  subSistema: string | null;
  nombre: string;
  destino: string;
  bidireccional: boolean;
}[] = [
  { sistema: "Ulé - Amuay", subSistema: "Costa Este", nombre: "Aporte a EYP K04+600 (La Pica)", destino: "EYP", bidireccional: false },
  { sistema: "Ulé - Amuay", subSistema: "Costa Este", nombre: "Aporte a EYP K00", destino: "EYP", bidireccional: false },
  { sistema: "Ulé - Amuay", subSistema: "Costa Este", nombre: "Aporte a EYP K00 (fugas hacia PEPG)", destino: "EYP", bidireccional: false },
  { sistema: "Ulé - Amuay", subSistema: "Costa Este", nombre: "Aporte a EYP K04+600 (Tablazo)", destino: "EYP", bidireccional: false },
  // La única bidireccional: positivo es ICO→NURGAS, negativo NURGAS→ICO, tal
  // como el workbook lo resuelve con el signo de FUENTES!Q31.
  { sistema: "Ulé - Amuay", subSistema: null, nombre: "Transferencia ICO-NURGAS", destino: "NURGAS", bidireccional: true },
];

async function seedPuntosTransferencia() {
  const sistemas = new Map(
    (await prisma.sistema.findMany({ select: { id: true, nombre: true } })).map((x) => [x.nombre, x.id]),
  );

  for (const punto of PUNTOS_TRANSFERENCIA) {
    const sistemaId = sistemas.get(punto.sistema);
    if (sistemaId === undefined) {
      console.warn(`[seed] No existe el sistema "${punto.sistema}"; se omite el punto "${punto.nombre}".`);
      continue;
    }
    const subSistemaId =
      punto.subSistema === null
        ? null
        : ((await prisma.subSistema.findUnique({
            where: { sistemaId_nombre: { sistemaId, nombre: punto.subSistema } },
            select: { id: true },
          }))?.id ?? null);

    // Aditivo e idempotente, como el resto del seed.
    const existe = await prisma.puntoTransferencia.findUnique({
      where: { sistemaId_nombre: { sistemaId, nombre: punto.nombre } },
      select: { id: true },
    });
    if (existe) continue;

    await prisma.puntoTransferencia.create({
      data: {
        sistemaId,
        subSistemaId,
        nombre: punto.nombre,
        destino: punto.destino,
        bidireccional: punto.bidireccional,
      },
    });
    console.log(`[seed] Punto de transferencia "${punto.nombre}" creado.`);
  }
}

async function main() {
  await seedSistemaYFuente();
  await seedRegionOperativa();
  await seedRegionMtto();
  await seedSectorCliente();
  await seedDepartamentoYPuesto();
  await seedCausaFalla();
  await seedAreasEstacionesEInstrumentos();
  await seedInsumoProductoServicio();
  await seedGerenciasRequirientes();
  await seedClientes();
  // Después de los clientes: les asigna su rama.
  await seedSubSistemas();
  // Después de los sub-sistemas: los puntos cuelgan de ellos.
  await seedPuntosTransferencia();
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
