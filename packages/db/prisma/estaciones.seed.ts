// GENERADO por tools/generar-estaciones.js desde "INVENTARIO ESTACIONES.xls"
// (hoja Hoja1). No editar a mano: editar el generador y volver a correrlo.
//
// 247 estaciones, 20 áreas operacionales y 16 tipos de instrumento.
// Del archivo se descartaron 4 filas duplicadas (cuatro estaciones de
// Altagracia listadas dos veces, la segunda con el nodo repetido como nombre).
// Las abreviaturas de instrumento se expandieron y se corrigió el typo real
// "M ULTASONICO". `tipoRed` es null en las 3 estaciones que el inventario no
// clasifica ni como transporte ni como distribución.

export interface AreaSeed {
  nombre: string;
  region: string;
}

export interface EstacionSeed {
  nodo: string;
  nombre: string;
  area: string;
  region: string;
  tipoEnlaceCom: string;
  tipoRed: "TRANSPORTE" | "DISTRIBUCION" | null;
  instrumentos: Record<string, number>;
}

export const TIPOS_INSTRUMENTO_SEED: string[] = [
  "Presión",
  "Temperatura",
  "PDT",
  "Válvula principal",
  "Válvula de interconexión",
  "Válvula de trampa",
  "Válvula manual",
  "PIGSIG",
  "I/P",
  "Válvula reguladora eléctrica",
  "Válvula reguladora neumática",
  "Medidor de turbina",
  "Medidor ultrasónico",
  "Placa de orificio",
  "Vortex",
  "Separador"
];

export const AREAS_SEED: AreaSeed[] = [
  {
    "nombre": "Altagracia",
    "region": "Centro"
  },
  {
    "nombre": "Charallave",
    "region": "Centro"
  },
  {
    "nombre": "Dist. Metropolitana",
    "region": "Centro"
  },
  {
    "nombre": "El Cují",
    "region": "Centro"
  },
  {
    "nombre": "Aragua",
    "region": "Centro-Occidente"
  },
  {
    "nombre": "Carabobo",
    "region": "Centro-Occidente"
  },
  {
    "nombre": "Costa Centro Occidental",
    "region": "Centro-Occidente"
  },
  {
    "nombre": "Lara",
    "region": "Centro-Occidente"
  },
  {
    "nombre": "Maturín",
    "region": "Este-Oriente"
  },
  {
    "nombre": "Carúpano",
    "region": "Nor-Oriente"
  },
  {
    "nombre": "Cumaná",
    "region": "Nor-Oriente"
  },
  {
    "nombre": "Güiria",
    "region": "Nor-Oriente"
  },
  {
    "nombre": "Margarita",
    "region": "Nor-Oriente"
  },
  {
    "nombre": "Puerto La Cruz",
    "region": "Nor-Oriente"
  },
  {
    "nombre": "Coro",
    "region": "Occidente"
  },
  {
    "nombre": "Costa Este",
    "region": "Occidente"
  },
  {
    "nombre": "Costa Oeste",
    "region": "Occidente"
  },
  {
    "nombre": "Transcaribeño",
    "region": "Occidente"
  },
  {
    "nombre": "Anaco",
    "region": "Sur-Oriente"
  },
  {
    "nombre": "Puerto Ordaz",
    "region": "Sur-Oriente"
  }
];

export const ESTACIONES_SEED: EstacionSeed[] = [
  {
    "nodo": "ALT",
    "nombre": "ALTAGRACIA",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 13,
      "Temperatura": 9,
      "Válvula principal": 4,
      "Válvula de interconexión": 21,
      "Válvula de trampa": 6,
      "Válvula manual": 5,
      "PIGSIG": 14,
      "Válvula reguladora neumática": 4,
      "Separador": 7
    }
  },
  {
    "nodo": "GPO",
    "nombre": "GUATOPO",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 8,
      "Temperatura": 2,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "N31",
    "nombre": "LA ESTRELLA",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "N32",
    "nombre": "UVERAL",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "N33",
    "nombre": "LAS RAICES",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "N34",
    "nombre": "TAMANACO",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "N35",
    "nombre": "PASO REAL",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "N40",
    "nombre": "N40",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 12,
      "Temperatura": 9,
      "Válvula principal": 3,
      "Válvula de interconexión": 5,
      "Válvula de trampa": 6,
      "PIGSIG": 12,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 6
    }
  },
  {
    "nodo": "N45",
    "nombre": "IPARE",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "N51",
    "nombre": "TUIRA",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "N52",
    "nombre": "GUARESCO",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "N53",
    "nombre": "LA LOIRA",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "PEZ",
    "nombre": "PLANTA EZEQUIEL ZAMORA",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 3,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "YPE",
    "nombre": "YPERGAS",
    "area": "Altagracia",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 3,
      "PDT": 2,
      "Válvula de interconexión": 4,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Medidor ultrasónico": 1,
      "Placa de orificio": 2
    }
  },
  {
    "nodo": "ARI",
    "nombre": "ARICHUNA",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 14,
      "Temperatura": 5,
      "Válvula principal": 5,
      "Válvula de interconexión": 8,
      "Válvula de trampa": 9,
      "PIGSIG": 9,
      "I/P": 7,
      "Válvula reguladora eléctrica": 7,
      "Válvula reguladora neumática": 7,
      "Medidor ultrasónico": 2,
      "Placa de orificio": 1,
      "Vortex": 2,
      "Separador": 4
    }
  },
  {
    "nodo": "CAI",
    "nombre": "CAIZA",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 1,
      "Válvula manual": 2,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "FNC",
    "nombre": "FNC PIÑATE KM 289",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "LAD",
    "nombre": "LAS ADJUSTAS",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "LCM",
    "nombre": "LA CUMACA",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "LNI",
    "nombre": "LOSMA DE NIQUEL",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1,
      "Válvula reguladora neumática": 1,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "LVE",
    "nombre": "LA VERANIEGA",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "OCU",
    "nombre": "FNC OCUMARE",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "QUI",
    "nombre": "QUIRIPITAL",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "RAI",
    "nombre": "LA RAIZA",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "SIT",
    "nombre": "EL SITIO",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula de interconexión": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "STE",
    "nombre": "SANTA TERESA",
    "area": "Charallave",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "Válvula principal": 1,
      "Válvula de interconexión": 1,
      "PIGSIG": 1,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1
    }
  },
  {
    "nodo": "BMO",
    "nombre": "BELLO MONTE",
    "area": "Dist. Metropolitana",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "CLF",
    "nombre": "LA CALIFORNIA",
    "area": "Dist. Metropolitana",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "GNB",
    "nombre": "GENERAL B",
    "area": "Dist. Metropolitana",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "LME",
    "nombre": "LAS MERCEDES",
    "area": "Dist. Metropolitana",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "PDE",
    "nombre": "PRADOS DEL ESTE",
    "area": "Dist. Metropolitana",
    "region": "Centro",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "PVC",
    "nombre": "PUERTO VERACGUZ",
    "area": "Dist. Metropolitana",
    "region": "Centro",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Válvula de interconexión": 3
    }
  },
  {
    "nodo": "SFE",
    "nombre": "SANTA FE",
    "area": "Dist. Metropolitana",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "COC",
    "nombre": "COCHE",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "FIG",
    "nombre": "FIGUEROA",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 10,
      "Temperatura": 4,
      "PDT": 1,
      "Válvula de interconexión": 8,
      "Válvula de trampa": 3,
      "PIGSIG": 4,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Vortex": 3
    }
  },
  {
    "nodo": "FTI",
    "nombre": "FUERTE TIUNA",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "GUA",
    "nombre": "GUARENAS",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 1,
      "Válvula de trampa": 1,
      "Válvula manual": 3,
      "Medidor de turbina": 1,
      "Separador": 2
    }
  },
  {
    "nodo": "JJS",
    "nombre": "JOSEFA JOAQUINA S.R",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 9,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 7,
      "Válvula de trampa": 3,
      "PIGSIG": 4,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Medidor de turbina": 4
    }
  },
  {
    "nodo": "JME",
    "nombre": "JOSE MARIA ESPAÑA",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 1,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Medidor de turbina": 3,
      "Separador": 1
    }
  },
  {
    "nodo": "JNQ",
    "nombre": "EL JUNQUITO K22",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "K18",
    "nombre": "TACAGUA",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "K23",
    "nombre": "LOS AGUACATICO 5",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "K30",
    "nombre": "K30",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula manual": 2,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "MAM",
    "nombre": "MAMERA",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "Válvula de interconexión": 3,
      "PIGSIG": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 3,
      "Separador": 1
    }
  },
  {
    "nodo": "MAR",
    "nombre": "LA MARIPOSA",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "MCL",
    "nombre": "MONTE CLARO",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "MON",
    "nombre": "MONTE ELENA",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "PDT": 2,
      "Válvula de interconexión": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 2,
      "Vortex": 1,
      "Separador": 4
    }
  },
  {
    "nodo": "PAN",
    "nombre": "PANAMERICANA",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "PDA",
    "nombre": "PAN DE AZUCAR",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "PRC",
    "nombre": "LOS PROCERES",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "VBA",
    "nombre": "VICTOR BATISTA",
    "area": "El Cují",
    "region": "Centro",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "CCC",
    "nombre": "CONCECA",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 1,
      "PIGSIG": 1,
      "Medidor de turbina": 2,
      "Separador": 1
    }
  },
  {
    "nodo": "CLC",
    "nombre": "CADAFE LA CABRERA",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 1,
      "PDT": 1,
      "Válvula de interconexión": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "CTE",
    "nombre": "CERRO TEJERIAS",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "PDT": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 1,
      "PIGSIG": 1,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1,
      "Válvula reguladora neumática": 1
    }
  },
  {
    "nodo": "ENC",
    "nombre": "LA ENCRUCUJADA",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "PDT": 2,
      "Válvula principal": 1,
      "Válvula de interconexión": 2,
      "PIGSIG": 1,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3
    }
  },
  {
    "nodo": "IEM",
    "nombre": "ENCRUCIJADA LOS MORROS",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 1,
      "PDT": 3,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 1,
      "PIGSIG": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 2,
      "Placa de orificio": 1
    }
  },
  {
    "nodo": "LCA",
    "nombre": "LA CABRERA",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "PDT": 1,
      "Válvula principal": 1,
      "Válvula de interconexión": 5,
      "Válvula de trampa": 1,
      "PIGSIG": 2,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3
    }
  },
  {
    "nodo": "MPC",
    "nombre": "MANPA CLIENTE",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 9,
      "Temperatura": 4,
      "PDT": 1,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "MPS",
    "nombre": "MANPA SUR",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "PDT": 6,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1,
      "Válvula reguladora neumática": 1,
      "Medidor ultrasónico": 4
    }
  },
  {
    "nodo": "MUC",
    "nombre": "LA MUCURA",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "N54",
    "nombre": "N54",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "N60",
    "nombre": "N60",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 8,
      "Temperatura": 2,
      "PDT": 3,
      "Válvula principal": 1,
      "Válvula de interconexión": 7,
      "Válvula de trampa": 4,
      "Válvula manual": 3,
      "PIGSIG": 7,
      "Vortex": 2
    }
  },
  {
    "nodo": "N61",
    "nombre": "N61",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "PDV",
    "nombre": "PRODUVISA",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "PDT": 1,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "PLM",
    "nombre": "HACIENDA EL PALMAR",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "PDT": 3,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "PNG",
    "nombre": "PALO NEGRO",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "PDT": 4,
      "Válvula principal": 1,
      "Válvula de interconexión": 5,
      "Válvula de trampa": 1,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Vortex": 2
    }
  },
  {
    "nodo": "SJN",
    "nombre": "SAN JUAN",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "SMA",
    "nombre": "SISA MANPA",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "PDT": 3,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "PIGSIG": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Vortex": 1
    }
  },
  {
    "nodo": "SOL",
    "nombre": "SOCOLAZO",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "PDT": 2,
      "Válvula principal": 1,
      "Válvula de interconexión": 1,
      "PIGSIG": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "TEJ",
    "nombre": "TEJERIAS",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "PDT": 1,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 3,
      "Válvula manual": 3,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "VIL",
    "nombre": "LA VILLA",
    "area": "Aragua",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "CAT",
    "nombre": "CASTILLITO",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Válvula principal": 1,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 1,
      "Válvula manual": 2,
      "PIGSIG": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2
    }
  },
  {
    "nodo": "CNA",
    "nombre": "CARTONES NACIONALES",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "CPC",
    "nombre": "CADAFE PEDRO CAMEJO",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "PDT": 1,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 2,
      "Separador": 1
    }
  },
  {
    "nodo": "G12",
    "nombre": "GUAYOS12",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "G20",
    "nombre": "GUAYOS20",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "PDT": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "PIGSIG": 2,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1
    }
  },
  {
    "nodo": "LQZ",
    "nombre": "LA QUIZANDA",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 6,
      "Válvula de trampa": 2,
      "PIGSIG": 4,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Placa de orificio": 1,
      "Separador": 1
    }
  },
  {
    "nodo": "N62",
    "nombre": "N62",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "N63",
    "nombre": "N63",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "N64",
    "nombre": "N64",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "N65",
    "nombre": "N65",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 21,
      "Temperatura": 3,
      "PDT": 9,
      "Válvula principal": 2,
      "Válvula de interconexión": 20,
      "Válvula de trampa": 8,
      "Válvula manual": 6,
      "PIGSIG": 8,
      "I/P": 5,
      "Válvula reguladora eléctrica": 5,
      "Válvula reguladora neumática": 5,
      "Vortex": 5
    }
  },
  {
    "nodo": "N66",
    "nombre": "N66",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "PDT": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 4,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "N67",
    "nombre": "N67",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "N68",
    "nombre": "N68",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "OWI",
    "nombre": "OWEN ILINOIS",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "SAL",
    "nombre": "EL SALTO",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "PDT": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "SCL",
    "nombre": "SANTA CLARA",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "PDT": 2,
      "Válvula principal": 1,
      "Válvula de interconexión": 2,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "TCA",
    "nombre": "TIGRE CARIBE",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 3,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 2,
      "Placa de orificio": 1,
      "Separador": 2
    }
  },
  {
    "nodo": "VA2",
    "nombre": "ELECTRICIDAD VALENCIA II",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "PDT": 3,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "VAL",
    "nombre": "ELECTRICIDAD VALENCIA I",
    "area": "Carabobo",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 9,
      "Temperatura": 2,
      "PDT": 3,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 2,
      "Separador": 1
    }
  },
  {
    "nodo": "BDA",
    "nombre": "BOCA DE AROA",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "HOY",
    "nombre": "LA HOYA",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "PDT": 1,
      "Válvula principal": 1,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 1,
      "Válvula manual": 1,
      "PIGSIG": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2
    }
  },
  {
    "nodo": "JOB",
    "nombre": "EL JOBO",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "K08",
    "nombre": "LA GRANJA",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "PDT": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula manual": 2,
      "PIGSIG": 4
    }
  },
  {
    "nodo": "K38",
    "nombre": "K38",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 8,
      "PDT": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "LPV",
    "nombre": "LAS PAVAS",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "MIR",
    "nombre": "MIRIMIRE",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "N70",
    "nombre": "N70",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 23,
      "Temperatura": 2,
      "PDT": 10,
      "Válvula principal": 5,
      "Válvula de interconexión": 7,
      "Válvula de trampa": 6,
      "Válvula manual": 14,
      "PIGSIG": 6,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 4,
      "Medidor ultrasónico": 3
    }
  },
  {
    "nodo": "PA2",
    "nombre": "REF EL PALITO",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 10,
      "Temperatura": 4,
      "PDT": 3,
      "Válvula principal": 2,
      "Válvula de interconexión": 4,
      "Válvula de trampa": 4,
      "Válvula manual": 4,
      "PIGSIG": 8,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 2,
      "Separador": 1
    }
  },
  {
    "nodo": "PCE2",
    "nombre": "PLANTA CENTRO",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 7,
      "PDT": 3,
      "Válvula de interconexión": 2,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 4,
      "Medidor ultrasónico": 3
    }
  },
  {
    "nodo": "PEQ",
    "nombre": "PEQUIVEN",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "PDT": 3,
      "Válvula de interconexión": 2,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "RAY",
    "nombre": "LA RAYA",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "PDT": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 4,
      "Válvula de trampa": 1,
      "Válvula manual": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "RPE",
    "nombre": "ERP PEQUIVEN",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "PDT": 1,
      "Válvula de interconexión": 1,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3
    }
  },
  {
    "nodo": "RTY",
    "nombre": "RIO TOCUYO",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "SPC",
    "nombre": "SEGREGACION PCE",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 8,
      "Válvula de interconexión": 2,
      "I/P": 8,
      "Válvula reguladora eléctrica": 8,
      "Válvula reguladora neumática": 8,
      "Separador": 4
    }
  },
  {
    "nodo": "TCB",
    "nombre": "TERMO CARABOBO",
    "area": "Costa Centro Occidental",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "PDT": 1,
      "Válvula de interconexión": 2,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "CHI",
    "nombre": "CHIVACOA",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 8,
      "PDT": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "Válvula manual": 1,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "EN2",
    "nombre": "ENELBAR II",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "PDT": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 2
    }
  },
  {
    "nodo": "EN3",
    "nombre": "ENELBAR III",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "PDT": 1,
      "Válvula manual": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "EN4",
    "nombre": "ENELBAR IV",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "PDT": 1,
      "Válvula de interconexión": 1,
      "Medidor de turbina": 2
    }
  },
  {
    "nodo": "ETB",
    "nombre": "TERMINAL BARQUSIMETO",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 12,
      "Temperatura": 4,
      "PDT": 6,
      "Válvula de interconexión": 13,
      "Válvula de trampa": 2,
      "PIGSIG": 4,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Medidor de turbina": 3,
      "Separador": 2
    }
  },
  {
    "nodo": "K64",
    "nombre": "K64",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 8,
      "PDT": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "K88",
    "nombre": "K88",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": null,
    "instrumentos": {}
  },
  {
    "nodo": "LEN",
    "nombre": "LA ENSENADA",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "PDT": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 3,
      "Válvula manual": 2,
      "PIGSIG": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2
    }
  },
  {
    "nodo": "MAN",
    "nombre": "LOS MANGOS",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "PDT": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 4,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "PAY",
    "nombre": "PAYARE",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 8,
      "PDT": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "PFL",
    "nombre": "PUENTE FLORES",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 8,
      "PDT": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "RYA",
    "nombre": "RIO YARACUY",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 10,
      "PDT": 4,
      "Válvula principal": 3,
      "Válvula de interconexión": 7,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "VLA",
    "nombre": "VENCEMOS LARA",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "PDT": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 2
    }
  },
  {
    "nodo": "YAR",
    "nombre": "YARITAGUA",
    "area": "Lara",
    "region": "Centro-Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "PDT": 3,
      "Válvula principal": 2,
      "Válvula de interconexión": 5,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "CCA",
    "nombre": "CEMENTOS CERRO AZUL",
    "area": "Maturín",
    "region": "Este-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "Válvula de trampa": 1,
      "PIGSIG": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 2
    }
  },
  {
    "nodo": "LTO",
    "nombre": "LA TOSCANA",
    "area": "Maturín",
    "region": "Este-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "Válvula de trampa": 1,
      "PIGSIG": 1,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "RCA",
    "nombre": "RAMAL CERRO AZUL",
    "area": "Maturín",
    "region": "Este-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 12,
      "Temperatura": 5,
      "Válvula de interconexión": 3,
      "Válvula de trampa": 1,
      "Válvula manual": 1,
      "PIGSIG": 1,
      "I/P": 9,
      "Válvula reguladora eléctrica": 9,
      "Válvula reguladora neumática": 6,
      "Medidor de turbina": 2
    }
  },
  {
    "nodo": "SVI",
    "nombre": "SAN VICENTE",
    "area": "Maturín",
    "region": "Este-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "Válvula de trampa": 1,
      "PIGSIG": 1,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "TON",
    "nombre": "TONORO",
    "area": "Maturín",
    "region": "Este-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 2,
      "PDT": 1,
      "Válvula principal": 3,
      "Válvula de interconexión": 8,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 4,
      "Medidor ultrasónico": 1,
      "Placa de orificio": 1
    }
  },
  {
    "nodo": "GS14",
    "nombre": "LOS ROJAS",
    "area": "Carúpano",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "GS20",
    "nombre": "EL PILAR",
    "area": "Carúpano",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": null,
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 2,
      "PDT": 2,
      "Válvula principal": 1,
      "Válvula de trampa": 2,
      "Válvula manual": 1,
      "PIGSIG": 4,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "GS21",
    "nombre": "AGUA FRIA",
    "area": "Carúpano",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "GS22",
    "nombre": "CASANAY",
    "area": "Carúpano",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "BM13",
    "nombre": "MOCHIMA",
    "area": "Cumaná",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "BM14",
    "nombre": "CUMANA",
    "area": "Cumaná",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 9,
      "Temperatura": 3,
      "Válvula principal": 1,
      "Válvula de interconexión": 2,
      "Válvula manual": 6,
      "PIGSIG": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 2,
      "Separador": 4
    }
  },
  {
    "nodo": "BM15",
    "nombre": "TUNANTAL",
    "area": "Cumaná",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "BM16",
    "nombre": "SAN ANTONIO",
    "area": "Cumaná",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "BM20",
    "nombre": "GUACARAPO",
    "area": "Cumaná",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "BM21",
    "nombre": "ARAYA",
    "area": "Cumaná",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "GS30",
    "nombre": "MUELLE CARAICO",
    "area": "Cumaná",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": null,
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 3,
      "Válvula principal": 2,
      "Válvula de trampa": 3,
      "Válvula manual": 8,
      "PIGSIG": 5,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "GS10",
    "nombre": "GUIRIA",
    "area": "Güiria",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 2,
      "PDT": 1,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 2,
      "PIGSIG": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "GS11",
    "nombre": "MANACAL",
    "area": "Güiria",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "GS12",
    "nombre": "RIO GRANDE",
    "area": "Güiria",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "GS13",
    "nombre": "YAGUARAPARO",
    "area": "Güiria",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "BM22",
    "nombre": "COCHE",
    "area": "Margarita",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "BM30",
    "nombre": "MARGARITA",
    "area": "Margarita",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 11,
      "Temperatura": 5,
      "Válvula principal": 1,
      "Válvula de interconexión": 3,
      "Válvula de trampa": 2,
      "Válvula manual": 4,
      "PIGSIG": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 3,
      "Separador": 3
    }
  },
  {
    "nodo": "BM50",
    "nombre": "BM50",
    "area": "Margarita",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "Válvula de trampa": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "BA1",
    "nombre": "CRUCERO DE BARBACOAS",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 1,
      "Válvula principal": 3,
      "Válvula de interconexión": 4,
      "Válvula de trampa": 1,
      "Válvula manual": 2,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "BA2",
    "nombre": "BARBACOAS 2",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 10,
      "Temperatura": 5,
      "Válvula principal": 4,
      "Válvula de interconexión": 10,
      "Válvula de trampa": 1,
      "Válvula manual": 7,
      "PIGSIG": 5,
      "Válvula reguladora neumática": 1,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "BM12",
    "nombre": "SANTA FE BM12",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "BM40",
    "nombre": "REFINERIA PUERTO LA CRUZ 2",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 10,
      "Temperatura": 3,
      "PDT": 1,
      "Válvula de interconexión": 3,
      "Válvula de trampa": 1,
      "Válvula manual": 9,
      "PIGSIG": 2,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 4,
      "Medidor ultrasónico": 2,
      "Separador": 4
    }
  },
  {
    "nodo": "CGU",
    "nombre": "CADEFE GUANTA",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "CM2",
    "nombre": "CRUCERO MATURIN ll",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 1,
      "Válvula manual": 1,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "CMT",
    "nombre": "CRUCERO DE MATURIN",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 5,
      "Válvula de trampa": 3,
      "Válvula manual": 4,
      "PIGSIG": 5
    }
  },
  {
    "nodo": "CP1",
    "nombre": "CEMENTO PERTIGALETE",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 8,
      "Temperatura": 4,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 3
    }
  },
  {
    "nodo": "CRJ",
    "nombre": "CRIOGENICO JOSE",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 1,
      "Válvula de trampa": 2,
      "PIGSIG": 1,
      "Placa de orificio": 1
    }
  },
  {
    "nodo": "CUR",
    "nombre": "CURATAQUICHE",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula manual": 2,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "ETJ",
    "nombre": "TERMINAL JOSE",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 12,
      "Temperatura": 5,
      "Válvula de interconexión": 10,
      "Válvula de trampa": 2,
      "Válvula manual": 7,
      "PIGSIG": 4,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 4,
      "Medidor ultrasónico": 2,
      "Separador": 6
    }
  },
  {
    "nodo": "FER",
    "nombre": "FERTINITRO",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 2
    }
  },
  {
    "nodo": "MET",
    "nombre": "MOTOR II",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "Válvula de interconexión": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "NAR",
    "nombre": "NARICUAL",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 1,
      "PIGSIG": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2
    }
  },
  {
    "nodo": "POT",
    "nombre": "LOS POTOCOS",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula manual": 2,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "PTA",
    "nombre": "PETRO ANZOATEGUI",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "PTC",
    "nombre": "PETRO CEDENO",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "PTC2",
    "nombre": "AUTOGENERACION DE P.CEDENO",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula de interconexión": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "PTM",
    "nombre": "PETRO MONAGAS",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Medidor de turbina": 2
    }
  },
  {
    "nodo": "PTP",
    "nombre": "PETRO PIAR",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 2
    }
  },
  {
    "nodo": "PTP2",
    "nombre": "AUTOGENERACION DE P.PIAR",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula de interconexión": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "USI",
    "nombre": "REGULACION USI",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 1,
      "Válvula de interconexión": 3,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Medidor de turbina": 4
    }
  },
  {
    "nodo": "VCO",
    "nombre": "VALCOR",
    "area": "Puerto La Cruz",
    "region": "Nor-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 8,
      "Temperatura": 1,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 1,
      "Válvula manual": 1,
      "PIGSIG": 1,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 4,
      "Medidor de turbina": 2
    }
  },
  {
    "nodo": "AVI",
    "nombre": "AGUA VIVA",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "COR",
    "nombre": "CORO",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "K134",
    "nombre": "K134",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Válvula principal": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "K162",
    "nombre": "K162",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Válvula principal": 1,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "K179",
    "nombre": "K179",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "PDT": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 12,
      "Válvula de trampa": 4,
      "Válvula manual": 6,
      "PIGSIG": 4
    }
  },
  {
    "nodo": "K215",
    "nombre": "K215",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "PDT": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 4,
      "Válvula manual": 3,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "K217",
    "nombre": "K217",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 3,
      "Válvula de trampa": 1,
      "PIGSIG": 1,
      "Placa de orificio": 1
    }
  },
  {
    "nodo": "K230",
    "nombre": "K230",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 2,
      "PDT": 2,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 2,
      "PIGSIG": 4,
      "Placa de orificio": 2
    }
  },
  {
    "nodo": "MAG",
    "nombre": "EL MANGLAR",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "PJC",
    "nombre": "PLANTA JOSEFA CAMEJO",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "PDT": 3,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 3,
      "Medidor ultrasónico": 1,
      "Separador": 1
    }
  },
  {
    "nodo": "QUE",
    "nombre": "QUERO",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "Válvula de interconexión": 5,
      "Válvula de trampa": 2,
      "Válvula manual": 4,
      "PIGSIG": 4
    }
  },
  {
    "nodo": "RJC",
    "nombre": "REG JOSEFA CAMEJO",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Válvula de interconexión": 2,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 3,
      "Separador": 1
    }
  },
  {
    "nodo": "RSE",
    "nombre": "RIO SECO",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "PDT": 3,
      "Válvula principal": 1,
      "Válvula de interconexión": 5,
      "Válvula de trampa": 1,
      "Válvula manual": 4,
      "PIGSIG": 2,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "TUR",
    "nombre": "TURUPIA",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "VQT",
    "nombre": "LA VAQUITA",
    "area": "Coro",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "Válvula de interconexión": 4,
      "Válvula de trampa": 2,
      "Válvula manual": 4,
      "PIGSIG": 4
    }
  },
  {
    "nodo": "K00",
    "nombre": "K00",
    "area": "Costa Este",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 10,
      "Temperatura": 4,
      "PDT": 4,
      "Válvula principal": 1,
      "Válvula manual": 1,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1,
      "Placa de orificio": 4
    }
  },
  {
    "nodo": "K04",
    "nombre": "K04",
    "area": "Costa Este",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 2,
      "PDT": 1,
      "Válvula de interconexión": 3,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Placa de orificio": 2
    }
  },
  {
    "nodo": "K106",
    "nombre": "K106",
    "area": "Costa Este",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 4
    }
  },
  {
    "nodo": "K47",
    "nombre": "K47",
    "area": "Costa Este",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Válvula principal": 2,
      "Válvula de interconexión": 1
    }
  },
  {
    "nodo": "TBZ",
    "nombre": "EL TABLAZO",
    "area": "Costa Este",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 2,
      "PDT": 1,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1,
      "Placa de orificio": 2
    }
  },
  {
    "nodo": "ALV",
    "nombre": "ALTOS DE LA VANEGA",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 1,
      "PDT": 2,
      "Válvula de interconexión": 1,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1,
      "Placa de orificio": 1
    }
  },
  {
    "nodo": "CPO",
    "nombre": "CERVECERIA POLAR",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 2,
      "PDT": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Placa de orificio": 2
    }
  },
  {
    "nodo": "LOM",
    "nombre": "LOMITA I",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 2,
      "PDT": 1,
      "Válvula de interconexión": 4,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1,
      "Válvula reguladora neumática": 1,
      "Placa de orificio": 2
    }
  },
  {
    "nodo": "PBA",
    "nombre": "PLAZA LAS BANDERAS",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 3,
      "I/P": 1,
      "Válvula reguladora eléctrica": 1,
      "Placa de orificio": 1
    }
  },
  {
    "nodo": "PCA",
    "nombre": "PUERTO CABALLO",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 2,
      "PDT": 2,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Placa de orificio": 2,
      "Separador": 1
    }
  },
  {
    "nodo": "PRL",
    "nombre": "PLANTA RAMON LAGUNA",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 18,
      "Temperatura": 8,
      "PDT": 8,
      "Válvula de interconexión": 2,
      "I/P": 10,
      "Válvula reguladora eléctrica": 10,
      "Placa de orificio": 8
    }
  },
  {
    "nodo": "RU1",
    "nombre": "RAFAEL URDANETA I",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 1,
      "PDT": 1,
      "Válvula de interconexión": 7,
      "Válvula de trampa": 1,
      "Placa de orificio": 1
    }
  },
  {
    "nodo": "RU2",
    "nombre": "RAFAEL URDANETA II",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 2,
      "PDT": 2,
      "Válvula de interconexión": 4,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Placa de orificio": 2,
      "Separador": 3
    }
  },
  {
    "nodo": "SCM",
    "nombre": "SANTA CRUZ DE MARA",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 2,
      "PDT": 2,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Placa de orificio": 2
    }
  },
  {
    "nodo": "SIB",
    "nombre": "SIBUCARA",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 3,
      "PDT": 3,
      "Válvula de interconexión": 3,
      "PIGSIG": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Placa de orificio": 3
    }
  },
  {
    "nodo": "VMA",
    "nombre": "VENCEMOS MARA",
    "area": "Costa Oeste",
    "region": "Occidente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 2,
      "PDT": 2,
      "Válvula de interconexión": 3,
      "I/P": 6,
      "Válvula reguladora eléctrica": 6,
      "Placa de orificio": 2
    }
  },
  {
    "nodo": "BAG",
    "nombre": "BAJO GRANDE",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 17,
      "PDT": 6,
      "Válvula de interconexión": 5,
      "Válvula de trampa": 2,
      "Válvula manual": 2,
      "PIGSIG": 3,
      "I/P": 5,
      "Válvula reguladora eléctrica": 5,
      "Válvula reguladora neumática": 5,
      "Medidor ultrasónico": 5
    }
  },
  {
    "nodo": "BNA",
    "nombre": "BALLENAS",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "PDT": 3,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 1,
      "Válvula manual": 1,
      "PIGSIG": 1,
      "Medidor ultrasónico": 3
    }
  },
  {
    "nodo": "CAR",
    "nombre": "CARRAIPIA",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "CER",
    "nombre": "EL CERRO",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "CRT",
    "nombre": "LOS CORTIJOS",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "CTV",
    "nombre": "CUATRO VIAS",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "LCO",
    "nombre": "LA CONCEPCION",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "MAJ",
    "nombre": "MAJAYURA",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "PDT": 1,
      "Válvula principal": 1,
      "Válvula de interconexión": 3,
      "Válvula de trampa": 2,
      "Válvula manual": 1,
      "PIGSIG": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "MRA",
    "nombre": "MARAHUASHU",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "RLM",
    "nombre": "RIO EL LIMON",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "SIL",
    "nombre": "SILOE",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "TUL",
    "nombre": "TULE",
    "area": "Transcaribeño",
    "region": "Occidente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "PDT": 1,
      "Válvula principal": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "CAA",
    "nombre": "CADAFE ANACO",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 3,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor de turbina": 2,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "CRR",
    "nombre": "CARRIZAL",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula manual": 2,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "CSJ",
    "nombre": "CRIOGENICO SAN JOAQUIN",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 11,
      "Temperatura": 2,
      "PDT": 3,
      "Válvula de interconexión": 5,
      "Válvula de trampa": 5,
      "Válvula manual": 3,
      "PIGSIG": 5,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Medidor ultrasónico": 1,
      "Placa de orificio": 2
    }
  },
  {
    "nodo": "DAC",
    "nombre": "DACION",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Válvula principal": 3,
      "Válvula de interconexión": 7,
      "Válvula de trampa": 6,
      "Válvula manual": 9,
      "PIGSIG": 9
    }
  },
  {
    "nodo": "EPA",
    "nombre": "ESTACION PRINCIPAL DE ANACO",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 12,
      "Temperatura": 6,
      "Válvula de interconexión": 19,
      "Válvula de trampa": 6,
      "Válvula manual": 10,
      "PIGSIG": 6,
      "I/P": 10,
      "Válvula reguladora eléctrica": 10,
      "Válvula reguladora neumática": 10,
      "Medidor ultrasónico": 6
    }
  },
  {
    "nodo": "EPA4",
    "nombre": "EPA4",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 3,
      "Válvula de interconexión": 6,
      "Válvula de trampa": 3,
      "Válvula manual": 6,
      "PIGSIG": 6,
      "Medidor ultrasónico": 3
    }
  },
  {
    "nodo": "ESJ",
    "nombre": "ESTACION SAN JOAQUIN",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "Válvula de trampa": 1,
      "Válvula manual": 1,
      "PIGSIG": 1,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "GUI",
    "nombre": "GUICO",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 8,
      "Temperatura": 1,
      "Válvula principal": 3,
      "Válvula de interconexión": 7,
      "PIGSIG": 4
    }
  },
  {
    "nodo": "GUI2",
    "nombre": "AUTOGENERACION GUICO",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 1,
      "Válvula de interconexión": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "N11",
    "nombre": "N11",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Válvula principal": 4,
      "Válvula de interconexión": 8,
      "PIGSIG": 4
    }
  },
  {
    "nodo": "N12",
    "nombre": "N12",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Válvula principal": 4,
      "Válvula de interconexión": 8,
      "PIGSIG": 4
    }
  },
  {
    "nodo": "N13",
    "nombre": "N13",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Válvula principal": 4,
      "Válvula de interconexión": 8,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "N14",
    "nombre": "N14",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Válvula principal": 4,
      "Válvula de interconexión": 8,
      "PIGSIG": 4
    }
  },
  {
    "nodo": "N15",
    "nombre": "N15",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Válvula principal": 4,
      "Válvula de interconexión": 8,
      "PIGSIG": 4
    }
  },
  {
    "nodo": "N20",
    "nombre": "N20",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 2,
      "PDT": 3,
      "Válvula de interconexión": 2,
      "Válvula de trampa": 2,
      "Válvula manual": 2,
      "PIGSIG": 2,
      "Medidor ultrasónico": 2,
      "Placa de orificio": 3
    }
  },
  {
    "nodo": "N22",
    "nombre": "N22",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Válvula principal": 2,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "N30",
    "nombre": "N30",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SERIAL PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 4,
      "Válvula principal": 4,
      "Válvula de interconexión": 14,
      "Válvula de trampa": 10,
      "Válvula manual": 13,
      "PIGSIG": 19,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 4
    }
  },
  {
    "nodo": "RAN",
    "nombre": "RIO ANACO",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 4,
      "Temperatura": 2,
      "Válvula principal": 2,
      "Válvula de interconexión": 2,
      "Válvula manual": 2,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "RCAB",
    "nombre": "RECEPCION CABRUTICA",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "Válvula de trampa": 1,
      "PIGSIG": 1
    }
  },
  {
    "nodo": "RPSD",
    "nombre": "ERP SAN DIEGO DE CABRUTICA",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 9,
      "Temperatura": 3,
      "Válvula de interconexión": 3,
      "Válvula de trampa": 2,
      "PIGSIG": 2,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 4
    }
  },
  {
    "nodo": "SDC",
    "nombre": "SAN DIEGO CABRUTICA CLIENTE",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 2,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "SMT",
    "nombre": "SAN MATEO",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 2,
      "Temperatura": 1,
      "Válvula principal": 1,
      "PIGSIG": 2
    }
  },
  {
    "nodo": "SOS",
    "nombre": "SUMINISTRO SAN JOAQUIN",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "SOT",
    "nombre": "SOTO",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 10,
      "Temperatura": 6,
      "Válvula principal": 3,
      "Válvula de interconexión": 18,
      "Válvula de trampa": 1,
      "Válvula manual": 4,
      "PIGSIG": 4,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 4,
      "Medidor ultrasónico": 4,
      "Separador": 4
    }
  },
  {
    "nodo": "SOT2",
    "nombre": "AUTOGENERACION SOTO",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "Válvula de interconexión": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 1
    }
  },
  {
    "nodo": "WLE",
    "nombre": "WEST LEJOS",
    "area": "Anaco",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "AIL",
    "nombre": "BAUXILUM",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "CSG",
    "nombre": "CONSIGUA",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula de interconexión": 2,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "ETM",
    "nombre": "TERMINAL MATANZAS",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 17,
      "Temperatura": 4,
      "Válvula de interconexión": 43,
      "Válvula de trampa": 3,
      "Válvula manual": 3,
      "PIGSIG": 6,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Medidor de turbina": 7,
      "Separador": 8
    }
  },
  {
    "nodo": "FRM",
    "nombre": "FERROMINERA",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 3,
      "Temperatura": 1,
      "PDT": 1,
      "Medidor ultrasónico": 3,
      "Placa de orificio": 1
    }
  },
  {
    "nodo": "IRO",
    "nombre": "ORINOCO IRO",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula de interconexión": 1,
      "I/P": 3,
      "Válvula reguladora eléctrica": 3,
      "Válvula reguladora neumática": 3,
      "Medidor ultrasónico": 3
    }
  },
  {
    "nodo": "MAC",
    "nombre": "MACAPAIMA",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 6,
      "Válvula de trampa": 6,
      "PIGSIG": 9
    }
  },
  {
    "nodo": "MAT",
    "nombre": "MATESI",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 3,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 3,
      "Medidor ultrasónico": 2
    }
  },
  {
    "nodo": "MMO",
    "nombre": "MAMO",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 3,
      "Válvula principal": 3,
      "Válvula de interconexión": 7,
      "Válvula manual": 1,
      "PIGSIG": 3,
      "Medidor de turbina": 1
    }
  },
  {
    "nodo": "MOR",
    "nombre": "MORICHAL",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 5,
      "Temperatura": 2,
      "Válvula principal": 3,
      "Válvula de interconexión": 7,
      "PIGSIG": 3
    }
  },
  {
    "nodo": "PPE",
    "nombre": "PLANTA PELLAS",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 4,
      "Válvula de interconexión": 1,
      "I/P": 2,
      "Válvula reguladora eléctrica": 2,
      "Válvula reguladora neumática": 2,
      "Medidor ultrasónico": 3
    }
  },
  {
    "nodo": "SID",
    "nombre": "SIDOR",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "IP PDVSA",
    "tipoRed": "DISTRIBUCION",
    "instrumentos": {
      "Presión": 7,
      "Temperatura": 6,
      "Válvula de interconexión": 1,
      "Válvula reguladora neumática": 4,
      "Medidor ultrasónico": 5
    }
  },
  {
    "nodo": "SMO",
    "nombre": "SINOVESA MORICHAL",
    "area": "Puerto Ordaz",
    "region": "Sur-Oriente",
    "tipoEnlaceCom": "SATELITAL",
    "tipoRed": "TRANSPORTE",
    "instrumentos": {
      "Presión": 6,
      "Temperatura": 1,
      "Válvula de interconexión": 1,
      "I/P": 4,
      "Válvula reguladora eléctrica": 4,
      "Válvula reguladora neumática": 4,
      "Medidor de turbina": 2
    }
  }
];
