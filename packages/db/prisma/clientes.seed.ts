// GENERADO desde "NUEVO BALANCE ACTUALIZADO.xlsm" (hoja CEN-ORI).
// region y sector NO están inferidos por el nombre: salen de las fórmulas de
// "Consumo por Sectores" de la hoja EJECUTIVO PUNTUAL, que referencian celda por
// celda a cada cliente. Las filas marcadas `derivado: true` son las que el
// Excel deja fuera de todo sector (autogeneración e industriales en cero) y que
// por decisión del owner van a "Otros".
// Ver decisión #46 en CONTEXTO_PROYECTO.md.

export interface ClienteSeed {
  nombre: string;
  sistema: string;
  region: string;
  sector: string;
  derivado: boolean;
}

export const CLIENTES_SEED: ClienteSeed[] = [
  {
    "nombre": "REF. PLC",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "AUTOGENERACION PLC",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "REF. EL CHAURE",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "P.E. CADAFE GUANTA",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "CEMENTO PERTIGALETE (CEMEX)",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Cemento",
    "derivado": false
  },
  {
    "nombre": "CRIOGENICO JOSE",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "PEQUIVEN ORIENTE (USI)",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petroquímico",
    "derivado": false
  },
  {
    "nombre": "PETRO RORAIMA / ANZOATEGUI",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "FERTINITRO",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petroquímico",
    "derivado": false
  },
  {
    "nombre": "PETRO CEDEÑO",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "PETRO PIAR",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "AUTOGENERACIÓN PETRO PIAR",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "PETROMONAGAS",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "SINOVENSA MORICHAL",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "SINOVENSA JOSE",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "METOR II",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Petroquímico",
    "derivado": false
  },
  {
    "nombre": "P.E  SAN JOAQUIN",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "P.E.FURRIAL",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "P.E. SANTA BARBARA",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "P.E. FRACCIONAMIENTO JOSE",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "OTROS",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "P.E. JUAN BAUTISTA ARISMENDI",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. ANTONIO JOSÉ DE SUCRE",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. LUISA CACERES DE ARISMENDI",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. JUAN MANUEL VALDEZ",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. ALBERTO LOVERA",
    "sistema": "Anaco - José - Puerto La Cruz - Sinorgas",
    "region": "Oriente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "NIEBLAS",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "HAMACA /GUARA/OCN",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "SIDOR",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "BAUXILUM",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "FMO BRIQUETAS (OPCO)",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "FMO PELLAS",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "COMSIGUA",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "ORINOCO IRON (BRIQUETERA DEL ORINOCO)",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "MATESI (ANTIGUO POSVEN) BRIQVEN",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "CEMENTOS CERRO AZUL",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Cemento",
    "derivado": false
  },
  {
    "nombre": "VENPRECAR (SIDETUR) BRIQUETERA DEL CARONI",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "P.E. SIDOR",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "P.E. MORICHAL",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "AUTOGENERACIÓN SOTO",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "P.E. SAN DIEGO DE CABRUTICA",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "OTROS",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "VENALUM",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "CARBONORCA",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "ALCASA",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "LA TOSCANA SAN VICENTE",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "RESTANTES",
    "sistema": "Anaco - Puerto Ordaz",
    "region": "Oriente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "CEMENTO OCUMARE",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Cemento",
    "derivado": false
  },
  {
    "nombre": "MINERA LOMAS DE NIQUEL",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "MONTE ELENA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "COCHECITO",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "MAMERA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "P.E. EZEQUIEL ZAMORA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. JOSE MARIA ESPAÑA ( OAM )",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. JOSEFA JOAQUINA SANCHEZ BASTIDAS (TACOA)",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. LA RAISA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. EL SITIO  (INDIA URQUIA)",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. LA MARIPOSA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. CADAFE ANACO",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "OTROS CARACAS",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "INVECEM (CONCECA) (HOLCIM)",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Cemento",
    "derivado": false
  },
  {
    "nombre": "PRODUVISA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "HDA. EL PALMAR",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "SUDAMTEX",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "TURBOVEN-CAGUA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "TURBOVEN-MARACAY",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "TURBOGENERACION MARACAY",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "MANPA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "PLANTA ALTAGRACIA NUEVA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "PLANTA ALTAGRACIA VIEJA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "PLANTA MORON",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "ALCASA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "OWENS ILLINOIS",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "P.E.ELEVAL 1 (PLANTA DEL ESTE, QUIZANDA)",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. PEDRO CAMEJO",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "CARTONES NACIONALES",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "ACETCO (MANTEX)",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "P.E.ELEVAL 2 (CASTILLITO)",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "REFINERIA  EL PALITO",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "P.E.PLANTA CENTRO",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "PEQUIVEN MORON",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Petroquímico",
    "derivado": false
  },
  {
    "nombre": "INVEPAL",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "CENTRAL MATILDE",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "P.E. ENELBAR 2",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. ENELBAR 3",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. ENELBAR 4 (ARGIMIRO GABALDÓN)",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. JOSE FELIX RIBAS (LA CABRERA)",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. TERMO CARABOBO",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. TERMO BARRANCA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "CENTRO OPERATIVO SAN JOAQUIN (COSJ)",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Oriente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "VENCEMOS LARA",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Cemento",
    "derivado": false
  },
  {
    "nombre": "TOTAL OTROS MORÓN - BARQUISIMETO",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "TOTAL OTROS CLIENTES",
    "sistema": "Anaco - Caracas - Barquisimeto - Río Seco",
    "region": "Centro-Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "P.E. ENELVEN R.L. VIEJA",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. ENELVEN R.L. NUEVA",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "P.E. TERMOZULIA",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "CONSUMO RAMAL SUR",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "CONSUMO RAMAL NORTE (PTO. CABALLO / LA PAZ)",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "CONSUMO RAMAL CENTRO",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "P.E. ENELVEN RAFAEL URDANETA",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "CAMC COMBUSTIBLE INTERNO",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Petroquímico",
    "derivado": false
  },
  {
    "nombre": "CAMC FERTILIZANTES",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Petroquímico",
    "derivado": false
  },
  {
    "nombre": "CLIENTES INDUSTRIALES K00 (CABIGAS Y OTROS)",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Otros",
    "derivado": true
  },
  {
    "nombre": "PETROZAMORA K04+600",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "P.E. PUNTA GORDA K00",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "COSTA ESTE OTROS (LAGUNIGAS) K04+600",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Otros",
    "derivado": false
  },
  {
    "nombre": "SIZUCA (SIDERURGICA)",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Siderúrgico",
    "derivado": false
  },
  {
    "nombre": "AMUAY",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "CARDON",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Petrolero",
    "derivado": false
  },
  {
    "nombre": "P.E. JOSEFA CAMEJO",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Eléctrico",
    "derivado": false
  },
  {
    "nombre": "OTROS OCCIDENTE",
    "sistema": "Ulé - Amuay",
    "region": "Occidente",
    "sector": "Otros",
    "derivado": false
  }
];
