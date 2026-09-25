import { z } from "zod";
import { busquedaSchema, fechaSchema, paginationQuerySchema } from "./common.js";

const alMenosUnCampo = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.refine((v) => Object.keys(v).length > 0, {
    message: "Debe enviar al menos un campo a modificar",
  });

const nombreCatalogo = z.string().trim().min(1).max(200);

// ===========================================================================
// Inventario de estaciones
// ===========================================================================

/**
 * Catálogo cerrado real, confirmado leyendo las 251 filas de
 * "INVENTARIO ESTACIONES.xls": no aparece ni un cuarto valor. El ERD lo declara
 * `string` y no enum de base de datos porque es una lista de negocio, no un
 * campo por el que el sistema ramifique lógica (decisión #32); la lista cerrada
 * se hace cumplir acá.
 */
export const tipoEnlaceComSchema = z.enum(["IP PDVSA", "SATELITAL", "SERIAL PDVSA"]);

/**
 * `null` es un valor legítimo, no un dato faltante por descuido: 3 de las 247
 * estaciones del inventario no están marcadas ni como transporte ni como
 * distribución, y las tres cuentan en el total de la disponibilidad semanal.
 * Clasificarlas a dedo movería un indicador que el área publica.
 */
export const tipoRedSchema = z.enum(["TRANSPORTE", "DISTRIBUCION"]);

/** El nodo es la clave con la que el área nombra a la estación en todos sus
 *  reportes. Se normaliza a mayúsculas porque el archivo mezcla ambas. */
const nodoSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^[A-Za-z0-9-]+$/, "El nodo admite sólo letras, números y guiones")
  .transform((v) => v.toUpperCase());



export const updateEstacionSchema = alMenosUnCampo(
  z.object({
    nombre: nombreCatalogo.optional(),
    areaId: z.number().int().positive().optional(),
    tipoEnlaceCom: tipoEnlaceComSchema.optional(),
    tipoRed: tipoRedSchema.nullable().optional(),
  }),
);

/** Estado operativo derivado, no almacenado: sale de si la estación tiene o no
 *  una falla abierta a la fecha. */
export const estadoEstacionSchema = z.enum(["OPERATIVA", "EN_FALLA"]);

export const listEstacionesQuerySchema = paginationQuerySchema
  .extend({
    regionId: z.coerce.number().int().positive().optional(),
    areaId: z.coerce.number().int().positive().optional(),
    tipoRed: tipoRedSchema.optional(),
    tipoEnlaceCom: tipoEnlaceComSchema.optional(),
    estado: estadoEstacionSchema.optional(),
    causaFallaId: z.coerce.number().int().positive().optional(),
    /**
     * Filtran por **solapamiento**, no por cuándo empezó la falla: una estación
     * caída desde hace meses o años que siguió (o sigue) así durante el período
     * pedido entra, igual que en la bitácora. Una estación operativa no tiene
     * fecha que comparar, así que usar el rango implica pedir las que están en
     * falla.
     */
    desde: fechaSchema.optional(),
    hasta: fechaSchema.optional(),
    q: busquedaSchema.optional(),
  })
  .refine((v) => !v.desde || !v.hasta || v.desde <= v.hasta, {
    message: "La fecha inicial no puede ser posterior a la final",
    path: ["hasta"],
  });

/** Reemplaza el juego completo de instrumentos de una estación. Es un PUT y no
 *  un PATCH por instrumento porque en el inventario real la fila se revisa
 *  entera cuando alguien va a la estación. */
export const putInstrumentosSchema = z.object({
  instrumentos: z
    .array(
      z.object({
        tipoInstrumentoId: z.number().int().positive(),
        cantidad: z.number().int().positive().max(999),
      }),
    )
    .max(50)
    .refine(
      (items) => new Set(items.map((i) => i.tipoInstrumentoId)).size === items.length,
      { message: "No se puede repetir el mismo tipo de instrumento" },
    ),
});

/**
 * El alta trae su inventario de instrumentos, como la fila del
 * `INVENTARIO ESTACIONES.xls`: una cantidad por tipo. Va en el mismo POST y no
 * en un PUT aparte para que una estación nunca quede creada sin él porque falló
 * el segundo pedido. Sin instrumentos también se puede: hay estaciones así en
 * el inventario real.
 */
export const createEstacionSchema = z.object({
  nodo: nodoSchema,
  nombre: nombreCatalogo,
  areaId: z.number().int().positive(),
  tipoEnlaceCom: tipoEnlaceComSchema,
  tipoRed: tipoRedSchema.nullable().default(null),
  instrumentos: putInstrumentosSchema.shape.instrumentos.default([]),
});

export const listAreasQuerySchema = z.object({
  regionId: z.coerce.number().int().positive().optional(),
});

// ===========================================================================
// Catálogo de causas de falla (Supervisor+ de Mantenimiento, decisión #31)
// ===========================================================================

export const createCausaFallaSchema = z.object({ nombre: nombreCatalogo });

export const updateCausaFallaSchema = alMenosUnCampo(
  z.object({ nombre: nombreCatalogo.optional(), activo: z.boolean().optional() }),
);

// ===========================================================================
// Bitácora de fallas
// ===========================================================================

/**
 * Una falla se abre con la fecha en que empezó, que puede ser muy anterior a
 * hoy: en el reporte real hay interrupciones abiertas desde 2011. Por eso no se
 * acota por abajo. Por arriba sí: una falla no puede empezar en el futuro.
 */
export const createFallaSchema = z.object({
  estacionId: z.number().int().positive(),
  causaFallaId: z.number().int().positive(),
  desde: fechaSchema,
  observacion: z.string().trim().max(1000).nullable().default(null),
});

export const updateFallaSchema = alMenosUnCampo(
  z.object({
    causaFallaId: z.number().int().positive().optional(),
    desde: fechaSchema.optional(),
    observacion: z.string().trim().max(1000).nullable().optional(),
  }),
);

/** Cerrar la falla es lo que devuelve la estación al conteo de disponibles. */
export const resolverFallaSchema = z.object({
  resueltaEn: fechaSchema,
  observacion: z.string().trim().max(1000).nullable().optional(),
});

export const listFallasQuerySchema = paginationQuerySchema
  .extend({
    estacionId: z.coerce.number().int().positive().optional(),
    regionId: z.coerce.number().int().positive().optional(),
    areaId: z.coerce.number().int().positive().optional(),
    causaFallaId: z.coerce.number().int().positive().optional(),
    soloAbiertas: z.coerce.boolean().optional(),
    tipoRed: tipoRedSchema.optional(),
    desde: fechaSchema.optional(),
    hasta: fechaSchema.optional(),
    q: busquedaSchema.optional(),
  })
  .refine((v) => !v.desde || !v.hasta || v.desde <= v.hasta, {
    message: "La fecha inicial no puede ser posterior a la final",
    path: ["hasta"],
  });

// ===========================================================================
// Reportes
// ===========================================================================

/**
 * La disponibilidad de una fecha cualquiera: una estación está disponible si no
 * tiene ninguna falla que la cubra (`desde <= fecha` y `resuelta_en` nula o
 * posterior). Sin `fecha`, hoy.
 */
export const disponibilidadQuerySchema = z.object({
  fecha: fechaSchema.optional(),
});

/** La serie semanal contra la meta, que es como el área publica el indicador. */
export const serieDisponibilidadQuerySchema = z.object({
  anio: z.coerce.number().int().min(2000).max(2100),
});

export type TipoEnlaceCom = z.infer<typeof tipoEnlaceComSchema>;
export type TipoRedEstacion = z.infer<typeof tipoRedSchema>;
export type EstadoEstacion = z.infer<typeof estadoEstacionSchema>;
export type ListEstacionesQuery = z.infer<typeof listEstacionesQuerySchema>;
export type ListFallasQuery = z.infer<typeof listFallasQuerySchema>;
