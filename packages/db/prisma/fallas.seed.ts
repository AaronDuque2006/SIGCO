// GENERADO por tools/generar-fallas.js desde "DISPON_SISUGAS_Semana_35.xls"
// (hoja OBSERVACION). No editar a mano: editar el generador y volver a correrlo.
//
// Las 201 estaciones en falla de la semana 35, que es el número que la hoja
// "DATOS Y GRAFICAS" publica como indicador. Todas van SIN resolver: son el
// estado con el que cierra el reporte.
//
// Reparto por causa: Suministro eléctrico 27, Enlace de comunicación 20, Afectación por hurto 139, Esperando reporte 10, Sistema de control local 5.
// 0 fila(s) del archivo no traen fecha de inicio; se les puso la del reporte.

export interface FallaSeed {
  nodo: string;
  estacion: string;
  causa: string;
  desde: string;
  observacion: string | null;
}

export const FALLAS_SEED: FallaSeed[] = [
  {
    "nodo": "PTM",
    "estacion": "PETRO MONAGAS",
    "causa": "Suministro eléctrico",
    "desde": "2026-08-13",
    "observacion": "PROBLEMAS CON EL RADIO"
  },
  {
    "nodo": "VCO",
    "estacion": "VALCOR",
    "causa": "Suministro eléctrico",
    "desde": "2025-09-24",
    "observacion": "HURTO DE LA COMETIDA ELECTRICA"
  },
  {
    "nodo": "CP1",
    "estacion": "CEMENTO PERTIGALETE",
    "causa": "Enlace de comunicación",
    "desde": "2020-03-13",
    "observacion": "SIN SERVICIO SATELITAL / CASETA OPERATIVA"
  },
  {
    "nodo": "NAR",
    "estacion": "NARICUAL",
    "causa": "Afectación por hurto",
    "desde": "2020-03-13",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "BM30",
    "estacion": "MARGARITA",
    "causa": "Afectación por hurto",
    "desde": "2020-03-13",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "GS10",
    "estacion": "GUIRIA",
    "causa": "Afectación por hurto",
    "desde": "2019-09-17",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "PTC",
    "estacion": "PETRO CEDENO",
    "causa": "Suministro eléctrico",
    "desde": "2019-08-13",
    "observacion": "SIN SERVICIO SATELITAL / FALLA SUMINISTRO ELECTRICO"
  },
  {
    "nodo": "PTC2",
    "estacion": "AUTOGENERACION DE P.CEDENO",
    "causa": "Suministro eléctrico",
    "desde": "2019-08-13",
    "observacion": "SIN SERVICIO SATELITAL / FALLA SUMINISTRO ELECTRICO"
  },
  {
    "nodo": "BM22",
    "estacion": "ISLA DE COCHE",
    "causa": "Suministro eléctrico",
    "desde": "2019-06-28",
    "observacion": "TRANSFORMADOR AVERIADO"
  },
  {
    "nodo": "BM13",
    "estacion": "MOCHIMA",
    "causa": "Afectación por hurto",
    "desde": "2019-04-11",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "GS21",
    "estacion": "AGUA FRIA",
    "causa": "Suministro eléctrico",
    "desde": "2019-04-07",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "GS22",
    "estacion": "CASANAY",
    "causa": "Afectación por hurto",
    "desde": "2019-04-04",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "GS14",
    "estacion": "LOS ROJAS",
    "causa": "Suministro eléctrico",
    "desde": "2019-03-29",
    "observacion": "SIN SERVICIO SATELITAL / HURTO DE CABLEADO DE ALTA"
  },
  {
    "nodo": "GS20",
    "estacion": "EL PILAR",
    "causa": "Afectación por hurto",
    "desde": "2019-03-16",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "GS12",
    "estacion": "RIO GRANDE",
    "causa": "Suministro eléctrico",
    "desde": "2019-03-07",
    "observacion": "TRANSFORMADOR HURTADO"
  },
  {
    "nodo": "GS13",
    "estacion": "YAGUARAPARO",
    "causa": "Afectación por hurto",
    "desde": "2019-03-07",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "GS30",
    "estacion": "MUELLE CARAICO",
    "causa": "Afectación por hurto",
    "desde": "2018-10-23",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "CGU",
    "estacion": "CADEFE GUANTA",
    "causa": "Enlace de comunicación",
    "desde": "2018-07-05",
    "observacion": "SIN SERVICIO SATELITAL / CASETA OPERATIVA"
  },
  {
    "nodo": "BM20",
    "estacion": "GUACARAPO",
    "causa": "Afectación por hurto",
    "desde": "2018-06-03",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "BM21",
    "estacion": "ARAYA",
    "causa": "Afectación por hurto",
    "desde": "2018-05-12",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "BM15",
    "estacion": "TUNANTAL",
    "causa": "Afectación por hurto",
    "desde": "2017-12-29",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "GS11",
    "estacion": "MANACAL",
    "causa": "Afectación por hurto",
    "desde": "2017-10-18",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "BM16",
    "estacion": "SAN ANTONIO",
    "causa": "Afectación por hurto",
    "desde": "2017-01-08",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "POT",
    "estacion": "LOS POTOCOS",
    "causa": "Afectación por hurto",
    "desde": "2016-07-18",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "CMT",
    "estacion": "CRUCERO DE MATURIN",
    "causa": "Afectación por hurto",
    "desde": "2015-10-15",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "CM2",
    "estacion": "CRUCERO MATURIN ll",
    "causa": "Afectación por hurto",
    "desde": "2014-01-08",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "CUR",
    "estacion": "CURATAQUICHE",
    "causa": "Afectación por hurto",
    "desde": "2013-01-11",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "BA1",
    "estacion": "CRUCERO DE BARBACOAS",
    "causa": "Afectación por hurto",
    "desde": "2009-08-11",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "JMV",
    "estacion": "JUAN MANUEL VALDEZ",
    "causa": "Afectación por hurto",
    "desde": "2009-08-11",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "TON",
    "estacion": "TONORO",
    "causa": "Esperando reporte",
    "desde": "2026-05-29",
    "observacion": "ESPERANDO VISITA TECNICA"
  },
  {
    "nodo": "CCA",
    "estacion": "CEMENTOS CERRO AZUL",
    "causa": "Sistema de control local",
    "desde": "2025-05-06",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "RCA",
    "estacion": "RAMAL CERRO AZUL",
    "causa": "Afectación por hurto",
    "desde": "2018-11-09",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "SVI",
    "estacion": "SAN VICENTE",
    "causa": "Afectación por hurto",
    "desde": "2017-01-22",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "LTO",
    "estacion": "LA TOSCANA",
    "causa": "Afectación por hurto",
    "desde": "2016-02-14",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "IAL",
    "estacion": "BAUXILUM",
    "causa": "Enlace de comunicación",
    "desde": "2025-08-22",
    "observacion": "FALLA RADIO COMUNICACIONES"
  },
  {
    "nodo": "MAT",
    "estacion": "MATESI",
    "causa": "Enlace de comunicación",
    "desde": "2025-07-23",
    "observacion": "FALLA RADIO COMUNICACIONES"
  },
  {
    "nodo": "SOT",
    "estacion": "SOTO",
    "causa": "Afectación por hurto",
    "desde": "2020-06-02",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "MOR",
    "estacion": "MORICHAL",
    "causa": "Afectación por hurto",
    "desde": "2020-03-13",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N22",
    "estacion": "N22",
    "causa": "Afectación por hurto",
    "desde": "2019-08-20",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "MAC",
    "estacion": "MACAPAIMA",
    "causa": "Afectación por hurto",
    "desde": "2019-07-02",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "PPE",
    "estacion": "PLANTA PELLAS",
    "causa": "Afectación por hurto",
    "desde": "2019-04-11",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "FRM",
    "estacion": "FERROMINERA",
    "causa": "Suministro eléctrico",
    "desde": "2019-03-25",
    "observacion": "REVISAR CIRCUITO ELECTRO ALIMENTACION"
  },
  {
    "nodo": "N12",
    "estacion": "N12",
    "causa": "Afectación por hurto",
    "desde": "2018-10-23",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N11",
    "estacion": "N11",
    "causa": "Afectación por hurto",
    "desde": "2018-10-23",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N13",
    "estacion": "N13",
    "causa": "Afectación por hurto",
    "desde": "2018-10-23",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "MMO",
    "estacion": "MAMO",
    "causa": "Afectación por hurto",
    "desde": "2018-09-13",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N30",
    "estacion": "N30",
    "causa": "Afectación por hurto",
    "desde": "2018-09-05",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "RAN",
    "estacion": "RIO ANACO",
    "causa": "Afectación por hurto",
    "desde": "2018-08-06",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "SOT2",
    "estacion": "AUTOGENERACION SOTO",
    "causa": "Afectación por hurto",
    "desde": "2018-07-25",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "SDC",
    "estacion": "SAN DIEGO CABRUTICA CLIENTE",
    "causa": "Afectación por hurto",
    "desde": "2018-05-14",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "RPSD",
    "estacion": "ERP SAN DIEGO DE CABRUTICA",
    "causa": "Afectación por hurto",
    "desde": "2018-05-09",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "GUI",
    "estacion": "GUICO",
    "causa": "Afectación por hurto",
    "desde": "2018-04-09",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "GUI2",
    "estacion": "AUTOGENERACION GUICO",
    "causa": "Afectación por hurto",
    "desde": "2018-04-09",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N20",
    "estacion": "N20",
    "causa": "Afectación por hurto",
    "desde": "2018-01-17",
    "observacion": "HURTO COMETIDA ELECTRICA/PLC/RECTIFICADOR"
  },
  {
    "nodo": "SID",
    "estacion": "SIDOR",
    "causa": "Afectación por hurto",
    "desde": "2018-01-09",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N15",
    "estacion": "N15",
    "causa": "Afectación por hurto",
    "desde": "2017-01-11",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N14",
    "estacion": "N14",
    "causa": "Afectación por hurto",
    "desde": "2017-01-08",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "EPA4",
    "estacion": "TRAMPAS DE RECIBO",
    "causa": "Afectación por hurto",
    "desde": "2017-01-08",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "RCAB",
    "estacion": "RECEPCION CABRUTICA",
    "causa": "Afectación por hurto",
    "desde": "2016-04-20",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "SMT",
    "estacion": "SAN MATEO",
    "causa": "Afectación por hurto",
    "desde": "2015-11-25",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "DAC",
    "estacion": "DACION",
    "causa": "Afectación por hurto",
    "desde": "2014-01-10",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "CAA",
    "estacion": "CADAFE ANACO",
    "causa": "Afectación por hurto",
    "desde": "2014-01-05",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "CRR",
    "estacion": "CARRIZAL",
    "causa": "Afectación por hurto",
    "desde": "2013-01-01",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "WLE",
    "estacion": "WEST LEJOS",
    "causa": "Afectación por hurto",
    "desde": "2011-01-01",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "CSJ",
    "estacion": "CRIOGENICO SAN JOAQUIN",
    "causa": "Afectación por hurto",
    "desde": "2009-01-01",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "SOS",
    "estacion": "SUMINISTRO SAN JOAQUIN",
    "causa": "Afectación por hurto",
    "desde": "2009-01-01",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "GNB",
    "estacion": "GENERAL B",
    "causa": "Suministro eléctrico",
    "desde": "2026-08-17",
    "observacion": "FALLA EN EL RECTIFICADOR"
  },
  {
    "nodo": "CAI",
    "estacion": "CAIZA",
    "causa": "Enlace de comunicación",
    "desde": "2026-07-27",
    "observacion": "FALLA REPETIDOR EL AEREOPUERTO CARACAS"
  },
  {
    "nodo": "BMO",
    "estacion": "BELLO MONTE",
    "causa": "Enlace de comunicación",
    "desde": "2026-06-29",
    "observacion": "FALLA REPETIDOR EL AVILA"
  },
  {
    "nodo": "CLF",
    "estacion": "LA CALIFORNIA",
    "causa": "Enlace de comunicación",
    "desde": "2026-06-29",
    "observacion": "FALLA REPETIDOR EL AVILA"
  },
  {
    "nodo": "PVC",
    "estacion": "PUERTO VERACRUZ",
    "causa": "Enlace de comunicación",
    "desde": "2026-06-29",
    "observacion": "FALLA REPETIDOR EL AVILA"
  },
  {
    "nodo": "K23",
    "estacion": "LOS AGUACATICO 5",
    "causa": "Suministro eléctrico",
    "desde": "2024-09-10",
    "observacion": "FALLA EN EL RECTIFICADOR"
  },
  {
    "nodo": "QUI",
    "estacion": "QUIRIPITAL",
    "causa": "Afectación por hurto",
    "desde": "2024-03-20",
    "observacion": "FALTA COMETIDA ELECTRICA"
  },
  {
    "nodo": "JJS",
    "estacion": "JOSEFA JOAQUINA S.R",
    "causa": "Afectación por hurto",
    "desde": "2023-12-22",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "PDA",
    "estacion": "PAN DE AZUCAR",
    "causa": "Sistema de control local",
    "desde": "2023-11-10",
    "observacion": "FALLA RECTIFICADOR"
  },
  {
    "nodo": "PRC",
    "estacion": "LOS PROCERES",
    "causa": "Enlace de comunicación",
    "desde": "2023-09-08",
    "observacion": "RECTIFICADOR / RTU DAÑADO"
  },
  {
    "nodo": "MCL",
    "estacion": "MONTE CLARO",
    "causa": "Sistema de control local",
    "desde": "2021-05-08",
    "observacion": "FALLA RECTIFICADOR"
  },
  {
    "nodo": "YPE",
    "estacion": "YPERGAS",
    "causa": "Enlace de comunicación",
    "desde": "2021-01-04",
    "observacion": "AFECTACION por Vandalismo en Repetidor Comunicaciones PDVSA"
  },
  {
    "nodo": "N51",
    "estacion": "TUIRA",
    "causa": "Suministro eléctrico",
    "desde": "2021-01-04",
    "observacion": "COMETIDA ELECTRICA, TABACOS CAIDOS"
  },
  {
    "nodo": "K18",
    "estacion": "TACAGUA",
    "causa": "Suministro eléctrico",
    "desde": "2020-02-06",
    "observacion": "COMETIDA ELECTRICA"
  },
  {
    "nodo": "LCM",
    "estacion": "LA CUMACA",
    "causa": "Afectación por hurto",
    "desde": "2019-11-04",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "PAN",
    "estacion": "PANAMERICANA",
    "causa": "Suministro eléctrico",
    "desde": "2019-07-10",
    "observacion": "Hurto Cableado Electrico"
  },
  {
    "nodo": "VBA",
    "estacion": "VICTOR BATISTA",
    "causa": "Enlace de comunicación",
    "desde": "2019-04-07",
    "observacion": "NO HAY ANTENA, FALLA ENLACE DE COMUNICACIÓN"
  },
  {
    "nodo": "JME",
    "estacion": "JOSE MARIA ESPAÑA",
    "causa": "Afectación por hurto",
    "desde": "2019-02-23",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "MON",
    "estacion": "MONTE ELENA",
    "causa": "Suministro eléctrico",
    "desde": "2018-11-28",
    "observacion": "HURTO TRANSFORMADOR, COMETIDA ELECTRICA"
  },
  {
    "nodo": "MAM",
    "estacion": "MAMERA",
    "causa": "Afectación por hurto",
    "desde": "2018-09-18",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N40",
    "estacion": "N40",
    "causa": "Afectación por hurto",
    "desde": "2018-09-10",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "REZ",
    "estacion": "REGULACION PRIMARIA EZEQUIEL ZAMORA",
    "causa": "Afectación por hurto",
    "desde": "2018-09-10",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "SIT",
    "estacion": "EL SITIO",
    "causa": "Afectación por hurto",
    "desde": "2018-07-20",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "GUA",
    "estacion": "GUARENAS",
    "causa": "Afectación por hurto",
    "desde": "2018-02-05",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "RAI",
    "estacion": "LA RAIZA",
    "causa": "Afectación por hurto",
    "desde": "2017-08-29",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "MAR",
    "estacion": "LA MARIPOSA",
    "causa": "Afectación por hurto",
    "desde": "2017-06-17",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "PEZ",
    "estacion": "PLANTA EZEQUIEL ZAMORA",
    "causa": "Afectación por hurto",
    "desde": "2017-05-28",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "LVE",
    "estacion": "LA VERANIEGA",
    "causa": "Afectación por hurto",
    "desde": "2017-05-27",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "LAD",
    "estacion": "LAS ADJUSTAS",
    "causa": "Afectación por hurto",
    "desde": "2017-03-26",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N32",
    "estacion": "UVERAL",
    "causa": "Afectación por hurto",
    "desde": "2017-03-26",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N34",
    "estacion": "TAMANACO",
    "causa": "Afectación por hurto",
    "desde": "2017-03-26",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N53",
    "estacion": "LA LOIRA",
    "causa": "Afectación por hurto",
    "desde": "2017-03-26",
    "observacion": "PUERTA DE CASETA SOLDADA"
  },
  {
    "nodo": "STE",
    "estacion": "SANTA TERESA",
    "causa": "Afectación por hurto",
    "desde": "2017-03-22",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N33",
    "estacion": "LAS RAICES",
    "causa": "Afectación por hurto",
    "desde": "2017-01-26",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N35",
    "estacion": "PASO REAL",
    "causa": "Afectación por hurto",
    "desde": "2017-01-26",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N31",
    "estacion": "LA ESTRELLA",
    "causa": "Afectación por hurto",
    "desde": "2017-01-08",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N52",
    "estacion": "GUARESCO",
    "causa": "Enlace de comunicación",
    "desde": "2017-01-08",
    "observacion": "FALLA EN REPETIDOR CHORORE"
  },
  {
    "nodo": "GPO",
    "estacion": "GUATOPO",
    "causa": "Afectación por hurto",
    "desde": "2017-01-08",
    "observacion": "FALLA SUMINISTRO ELECTRICO / CAIDA LINEA DE ALTA"
  },
  {
    "nodo": "FNC",
    "estacion": "FNC PIÑATE KM 289",
    "causa": "Afectación por hurto",
    "desde": "2016-07-13",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "K30",
    "estacion": "K30",
    "causa": "Afectación por hurto",
    "desde": "2016-07-09",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "OCU",
    "estacion": "FNC OCUMARE",
    "causa": "Afectación por hurto",
    "desde": "2016-04-12",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "LNI",
    "estacion": "LOSMA DE NIQUEL",
    "causa": "Afectación por hurto",
    "desde": "2016-03-26",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "N45",
    "estacion": "IPARE",
    "causa": "Afectación por hurto",
    "desde": "2015-10-17",
    "observacion": "HURTO ESTACION"
  },
  {
    "nodo": "PDE",
    "estacion": "PRADOS DEL ESTE",
    "causa": "Suministro eléctrico",
    "desde": "2015-08-04",
    "observacion": "AFECTACION EN TODOS LOS EQUIPOS POR DESCARGA ATMOSFERICA"
  },
  {
    "nodo": "COC",
    "estacion": "COCHE",
    "causa": "Afectación por hurto",
    "desde": "2014-01-05",
    "observacion": "Reubicacion de la estación"
  },
  {
    "nodo": "LME",
    "estacion": "LAS MERCEDES",
    "causa": "Afectación por hurto",
    "desde": "2012-08-28",
    "observacion": null
  },
  {
    "nodo": "N60",
    "estacion": "N60",
    "causa": "Esperando reporte",
    "desde": "2026-08-13",
    "observacion": "ESPERANDO VISITA TECNICA"
  },
  {
    "nodo": "RPE",
    "estacion": "ERP PEQUIVEN",
    "causa": "Enlace de comunicación",
    "desde": "2026-07-26",
    "observacion": "FALLA EN ENLACE DE COMUNICACIÓN"
  },
  {
    "nodo": "OWI",
    "estacion": "OWEN ILINOIS",
    "causa": "Esperando reporte",
    "desde": "2026-07-09",
    "observacion": "ESPERANDO VISITA TECNICA"
  },
  {
    "nodo": "MUC",
    "estacion": "LA MUCURA",
    "causa": "Esperando reporte",
    "desde": "2026-07-09",
    "observacion": "ESPERANDO VISITA TECNICA"
  },
  {
    "nodo": "G12",
    "estacion": "GUAYOS12",
    "causa": "Esperando reporte",
    "desde": "2026-06-01",
    "observacion": "ESPERANDO VISITA TECNICA"
  },
  {
    "nodo": "RTY",
    "estacion": "RIO TOCUYO",
    "causa": "Enlace de comunicación",
    "desde": "2026-04-28",
    "observacion": "ESPERANDO VISITA TECNICA"
  },
  {
    "nodo": "RAY",
    "estacion": "LA RAYA",
    "causa": "Enlace de comunicación",
    "desde": "2026-04-28",
    "observacion": "PROBLEMAS CON RADIO COMUNICACIONES"
  },
  {
    "nodo": "CPC",
    "estacion": "CADAFE PEDRO CAMEJO",
    "causa": "Esperando reporte",
    "desde": "2026-01-27",
    "observacion": "ESPERANDO VISITA TECNICA"
  },
  {
    "nodo": "PEQ",
    "estacion": "PEQUIVEN",
    "causa": "Enlace de comunicación",
    "desde": "2025-10-31",
    "observacion": "PROBLEMAS CON RADIO COMUNICACIONES"
  },
  {
    "nodo": "CNA",
    "estacion": "CARTONES NACIONALES",
    "causa": "Suministro eléctrico",
    "desde": "2025-09-16",
    "observacion": "CLIENTE FUERA DE SERVICIO"
  },
  {
    "nodo": "BDA",
    "estacion": "BOCA DE AROA",
    "causa": "Suministro eléctrico",
    "desde": "2025-01-19",
    "observacion": "FALLA LINEA DE SUMINISTRO ELECTRICO / FALLA REPETIDOR EL SILENCIO"
  },
  {
    "nodo": "N62",
    "estacion": "N62",
    "causa": "Sistema de control local",
    "desde": "2024-12-03",
    "observacion": "AFECTACION DE EQUIPOS POR DESCARGA ATMOSFERICAS"
  },
  {
    "nodo": "SOL",
    "estacion": "SOCOLAZO",
    "causa": "Afectación por hurto",
    "desde": "2024-07-26",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "VA2",
    "estacion": "ELECTRICIDAD VALENCIA II",
    "causa": "Enlace de comunicación",
    "desde": "2022-10-25",
    "observacion": "FALLA REPETIDOR COPETON"
  },
  {
    "nodo": "CLC",
    "estacion": "CADAFE LA CABRERA",
    "causa": "Suministro eléctrico",
    "desde": "2022-09-19",
    "observacion": "TENDIDO ELECTRICO HURTADO"
  },
  {
    "nodo": "N63",
    "estacion": "N63",
    "causa": "Suministro eléctrico",
    "desde": "2022-07-12",
    "observacion": "FALLA ELECTRICA"
  },
  {
    "nodo": "PCE2",
    "estacion": "PLANTA CENTRO 2",
    "causa": "Afectación por hurto",
    "desde": "2021-07-05",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "N68",
    "estacion": "N68",
    "causa": "Enlace de comunicación",
    "desde": "2021-06-03",
    "observacion": "TORRE COMUNICAION ANTENA AFECTADA POR CORROSION"
  },
  {
    "nodo": "TCB",
    "estacion": "TERMO CARABOBO",
    "causa": "Afectación por hurto",
    "desde": "2021-05-28",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "LEN",
    "estacion": "LA ENSENADA",
    "causa": "Suministro eléctrico",
    "desde": "2020-10-30",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "TEJ",
    "estacion": "TEJERIAS",
    "causa": "Afectación por hurto",
    "desde": "2020-10-13",
    "observacion": "AFECTACION POR HURTO"
  },
  {
    "nodo": "N54",
    "estacion": "N54",
    "causa": "Afectación por hurto",
    "desde": "2020-08-08",
    "observacion": "FALLA ELECTRICA"
  },
  {
    "nodo": "EN3",
    "estacion": "ENELBAR III",
    "causa": "Afectación por hurto",
    "desde": "2020-05-08",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "CHI",
    "estacion": "CHIVACOA",
    "causa": "Afectación por hurto",
    "desde": "2020-01-31",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "PAY",
    "estacion": "PAYARE",
    "causa": "Afectación por hurto",
    "desde": "2019-07-28",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "LPV",
    "estacion": "LAS PAVAS",
    "causa": "Afectación por hurto",
    "desde": "2019-07-14",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "K88",
    "estacion": "K88",
    "causa": "Afectación por hurto",
    "desde": "2019-07-08",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "TCA",
    "estacion": "TIGRE CARIBE",
    "causa": "Afectación por hurto",
    "desde": "2019-03-01",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "MIR",
    "estacion": "MIRIMIRE",
    "causa": "Enlace de comunicación",
    "desde": "2018-10-25",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "LCA",
    "estacion": "LA CABRERA",
    "causa": "Afectación por hurto",
    "desde": "2018-10-09",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "SJN",
    "estacion": "SAN JUAN",
    "causa": "Afectación por hurto",
    "desde": "2018-04-09",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "PNG",
    "estacion": "PALO NEGRO",
    "causa": "Afectación por hurto",
    "desde": "2018-03-26",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "ETB",
    "estacion": "TERMINAL BARQUSIMETO",
    "causa": "Afectación por hurto",
    "desde": "2018-02-05",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "PFL",
    "estacion": "PUENTE FLORES",
    "causa": "Afectación por hurto",
    "desde": "2018-01-26",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "G20",
    "estacion": "GUAYOS20",
    "causa": "Afectación por hurto",
    "desde": "2017-10-30",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "HOY",
    "estacion": "LA HOYA",
    "causa": "Afectación por hurto",
    "desde": "2017-10-07",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "SAL",
    "estacion": "EL SALTO",
    "causa": "Afectación por hurto",
    "desde": "2017-07-07",
    "observacion": "HURTO DE LA ESTACION"
  },
  {
    "nodo": "K38",
    "estacion": "K38",
    "causa": "Afectación por hurto",
    "desde": "2017-06-30",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "N66",
    "estacion": "N66",
    "causa": "Afectación por hurto",
    "desde": "2017-06-20",
    "observacion": "HURTO DE LA ESTACION"
  },
  {
    "nodo": "N67",
    "estacion": "N67",
    "causa": "Afectación por hurto",
    "desde": "2017-06-15",
    "observacion": null
  },
  {
    "nodo": "YAR",
    "estacion": "YARITAGUA",
    "causa": "Afectación por hurto",
    "desde": "2017-03-26",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "ENC",
    "estacion": "LA ENCRUCUJADA",
    "causa": "Afectación por hurto",
    "desde": "2017-03-26",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "EN4",
    "estacion": "ENELBAR IV",
    "causa": "Afectación por hurto",
    "desde": "2017-02-27",
    "observacion": "Hurto de 21 mts de cableado del transformador"
  },
  {
    "nodo": "K64",
    "estacion": "K64",
    "causa": "Afectación por hurto",
    "desde": "2017-02-12",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "VIL",
    "estacion": "LA VILLA",
    "causa": "Afectación por hurto",
    "desde": "2017-01-26",
    "observacion": "HURTO DE LA ESTACION"
  },
  {
    "nodo": "PA2",
    "estacion": "REF EL PALITO",
    "causa": "Afectación por hurto",
    "desde": "2017-01-08",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "RYA",
    "estacion": "RIO YARACUY",
    "causa": "Afectación por hurto",
    "desde": "2017-01-08",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "N61",
    "estacion": "N61",
    "causa": "Afectación por hurto",
    "desde": "2016-12-10",
    "observacion": "HURTO DE LA ESTACION"
  },
  {
    "nodo": "SCL",
    "estacion": "SANTA CLARA",
    "causa": "Afectación por hurto",
    "desde": "2016-10-25",
    "observacion": "Intento de Hurto en Estacion"
  },
  {
    "nodo": "MAN",
    "estacion": "LOS MANGOS",
    "causa": "Afectación por hurto",
    "desde": "2016-09-16",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "CTE",
    "estacion": "CERRO TEJERIAS",
    "causa": "Afectación por hurto",
    "desde": "2016-03-26",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "JOB",
    "estacion": "EL JOBO",
    "causa": "Afectación por hurto",
    "desde": "2016-02-05",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "K08",
    "estacion": "LA GRANJA",
    "causa": "Afectación por hurto",
    "desde": "2015-08-04",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "CCC",
    "estacion": "CONCECA",
    "causa": "Enlace de comunicación",
    "desde": "2015-02-11",
    "observacion": "SUSPENSIÓN DE SERVICIO SATELITAL"
  },
  {
    "nodo": "K134",
    "estacion": "K134",
    "causa": "Suministro eléctrico",
    "desde": "2025-10-01",
    "observacion": "PROTECTOR DE VOLTAJE DAÑADO"
  },
  {
    "nodo": "PJC",
    "estacion": "PLANTA JOSEFA CAMEJO",
    "causa": "Afectación por hurto",
    "desde": "2022-08-19",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "PRL",
    "estacion": "PLANTA RAMON LAGUNA",
    "causa": "Suministro eléctrico",
    "desde": "2022-08-16",
    "observacion": "Hurto de cableado"
  },
  {
    "nodo": "RJC",
    "estacion": "REG JOSEFA CAMEJO",
    "causa": "Suministro eléctrico",
    "desde": "2022-01-21",
    "observacion": "Hurto de cableado"
  },
  {
    "nodo": "AVI",
    "estacion": "AGUA VIVA",
    "causa": "Afectación por hurto",
    "desde": "2020-03-13",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "K215",
    "estacion": "K215",
    "causa": "Afectación por hurto",
    "desde": "2020-02-10",
    "observacion": "AFECTACION POR HURTO"
  },
  {
    "nodo": "K217",
    "estacion": "K217",
    "causa": "Afectación por hurto",
    "desde": "2020-01-12",
    "observacion": "Acometida electrica"
  },
  {
    "nodo": "TBZ",
    "estacion": "EL TABLAZO",
    "causa": "Afectación por hurto",
    "desde": "2019-08-30",
    "observacion": "AFECTACION POR HURTO"
  },
  {
    "nodo": "MAG",
    "estacion": "EL MANGLAR",
    "causa": "Afectación por hurto",
    "desde": "2019-04-11",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "LOM",
    "estacion": "LOMITA I",
    "causa": "Afectación por hurto",
    "desde": "2019-03-25",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "PCA",
    "estacion": "PUERTO CABALLO",
    "causa": "Esperando reporte",
    "desde": "2019-03-25",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "CAR",
    "estacion": "CARRAIPIA",
    "causa": "Esperando reporte",
    "desde": "2019-01-30",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "CTV",
    "estacion": "CUATRO VIAS",
    "causa": "Esperando reporte",
    "desde": "2019-01-30",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "K47",
    "estacion": "K47",
    "causa": "Afectación por hurto",
    "desde": "2018-09-10",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "RSE",
    "estacion": "RIO SECO",
    "causa": "Afectación por hurto",
    "desde": "2018-09-05",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "TUR",
    "estacion": "TURUPIA",
    "causa": "Afectación por hurto",
    "desde": "2018-08-16",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "BNA",
    "estacion": "BALLENAS",
    "causa": "Esperando reporte",
    "desde": "2018-02-05",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "RU2",
    "estacion": "RAFAEL URDANETA II",
    "causa": "Suministro eléctrico",
    "desde": "2017-12-28",
    "observacion": "TRANSFORMADOR HRTADO"
  },
  {
    "nodo": "MRA",
    "estacion": "MARAHUASHU",
    "causa": "Afectación por hurto",
    "desde": "2017-12-28",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "SIB",
    "estacion": "SIBUCARA",
    "causa": "Afectación por hurto",
    "desde": "2017-12-28",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "CPO",
    "estacion": "CERVECERIA POLAR",
    "causa": "Suministro eléctrico",
    "desde": "2017-09-11",
    "observacion": "SIN SERVICIO ELECTRICO"
  },
  {
    "nodo": "SCM",
    "estacion": "SANTA CRUZ DE MARA",
    "causa": "Afectación por hurto",
    "desde": "2017-09-11",
    "observacion": "HURTO DE EQUIPOS"
  },
  {
    "nodo": "K179",
    "estacion": "K179",
    "causa": "Suministro eléctrico",
    "desde": "2017-01-11",
    "observacion": "SIN SERVICIO SATELITAL"
  },
  {
    "nodo": "CRT",
    "estacion": "LOS CORTIJOS",
    "causa": "Afectación por hurto",
    "desde": "2017-01-11",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "MAJ",
    "estacion": "MAJAYURA",
    "causa": "Afectación por hurto",
    "desde": "2017-01-11",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "COR",
    "estacion": "CORO",
    "causa": "Afectación por hurto",
    "desde": "2017-01-11",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "LCO",
    "estacion": "LA CONCEPCION",
    "causa": "Afectación por hurto",
    "desde": "2016-12-19",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "VMA",
    "estacion": "VENCEMOS MARA",
    "causa": "Sistema de control local",
    "desde": "2016-11-08",
    "observacion": "SIN PLC Y CABLEADO INSTRUMENTACION"
  },
  {
    "nodo": "TUL",
    "estacion": "TULE",
    "causa": "Afectación por hurto",
    "desde": "2016-01-08",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "CER",
    "estacion": "EL CERRO",
    "causa": "Afectación por hurto",
    "desde": "2016-01-07",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "VQT",
    "estacion": "LA VAQUITA",
    "causa": "Afectación por hurto",
    "desde": "2016-01-06",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "K162",
    "estacion": "K162",
    "causa": "Afectación por hurto",
    "desde": "2015-11-04",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "K106",
    "estacion": "K106",
    "causa": "Afectación por hurto",
    "desde": "2015-04-08",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "SIL",
    "estacion": "SILOE",
    "causa": "Afectación por hurto",
    "desde": "2014-01-04",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  },
  {
    "nodo": "RLM",
    "estacion": "RIO EL LIMON",
    "causa": "Afectación por hurto",
    "desde": "2011-01-09",
    "observacion": "SIN SERVICIO SATELITAL / ESTACION AFECTADA POR HURTO"
  }
];
