import { z } from "zod";
import { busquedaSchema, fechaSchema, paginationQuerySchema } from "./common.js";

const alMenosUnCampo = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.refine((v) => Object.keys(v).length > 0, {
    message: "Debe enviar al menos un campo a modificar",
  });

const nombreCatalogo = z.string().trim().min(1).max(200);

// ===========================================================================
// Catálogos del módulo (editables por Supervisor+ de su propio departamento,
// decisión #31). Soft-delete vía `activo`: nunca DELETE, porque los reportes
// históricos nombran filas dadas de baja.
// ===========================================================================

export const createInsumoSchema = z.object({
  departamentoId: z.number().int().positive(),
  nombre: nombreCatalogo,
});

export const updateInsumoSchema = alMenosUnCampo(
  z.object({ nombre: nombreCatalogo.optional(), activo: z.boolean().optional() }),
);

export const createProductoServicioSchema = z.object({
  insumoId: z.number().int().positive(),
  nombre: nombreCatalogo,
  descripcionActividad: z.string().trim().max(2000).nullable().default(null),
});

export const updateProductoServicioSchema = alMenosUnCampo(
  z.object({
    nombre: nombreCatalogo.optional(),
    descripcionActividad: z.string().trim().max(2000).nullable().optional(),
    activo: z.boolean().optional(),
  }),
);

export const createGerenciaRequirienteSchema = z.object({
  departamentoId: z.number().int().positive(),
  nombre: nombreCatalogo,
});

export const updateGerenciaRequirienteSchema = alMenosUnCampo(
  z.object({ nombre: nombreCatalogo.optional(), activo: z.boolean().optional() }),
);

export const listCatalogoActividadesQuerySchema = z.object({
  departamentoId: z.coerce.number().int().positive().optional(),
  insumoId: z.coerce.number().int().positive().optional(),
});

// ===========================================================================
// ACTIVIDAD_REGISTRO
// ===========================================================================

/** Catálogo cerrado de 3 (decisión #29). El recorrido de una tarea asignada:
 *  el supervisor la crea en RECIBIDO, quien la ejecuta la mueve. */
export const estatusActividadSchema = z.enum(["RECIBIDO", "EN PROCESO", "FINALIZADO"]);

export type EstatusActividad = z.infer<typeof estatusActividadSchema>;

/**
 * `cantidad` son **repeticiones de la misma actividad**, no unidades del
 * producto. El encabezado del workbook lo dice con todas las letras: "colocar
 * más de 1 sólo en el caso de que se repita el detalle del requerimiento o
 * actividad". En el trimestre auditado va de 1 a 5, y 139 de 176 filas son 1.
 */
const cantidadSchema = z.number().int().positive().max(999);

/**
 * `hh` es el **total de horas-hombre de la fila**, no por persona ni por
 * unidad: en el workbook la razón hh/cantidad varía libremente (8, 2, 6, 60…)
 * y **no existe ninguna columna de cantidad de personas**, así que el dato ya
 * viene colapsado en origen.
 *
 * La columna es `Decimal(10,2)`; se acotan los decimales acá para que Postgres
 * no redondee en silencio, igual que en los volúmenes de Despacho.
 */
const hhSchema = z
  .number()
  .finite()
  .positive()
  .max(99_999_999)
  .refine((v) => Number.isInteger(v * 100), {
    message: "Máximo 2 decimales",
  });

export const createActividadRegistroSchema = z
  .object({
    productoServicioId: z.number().int().positive(),
    gerenciaRequirienteId: z.number().int().positive(),
    // Nulo = alcance nacional (decisión #19). En el workbook es el valor más
    // común: 128 de 176 filas dicen NACIONAL.
    regionId: z.number().int().positive().nullable().default(null),
    // Quién es el responsable. Si falta, es quien tiene la sesión. Un Analista
    // no puede crear, y quien crea a nombre de otro necesita ser Supervisor+
    // de su cadena — lo hace cumplir el Service, no este schema.
    usuarioId: z.number().int().positive().optional(),
    fechaDesde: fechaSchema,
    fechaHasta: fechaSchema,
    cantidad: cantidadSchema.default(1),
    // Una tarea recién asignada todavía no tiene horas. Por eso `hh` es
    // opcional al crear y el default es cero: el supervisor asigna, y quien
    // ejecuta carga las horas al completar.
    hh: hhSchema.nullable().default(null),
    estatus: estatusActividadSchema.default("RECIBIDO"),
    detalle: z.string().trim().max(4000).nullable().default(null),
  })
  .refine((v) => v.fechaDesde <= v.fechaHasta, {
    path: ["fechaHasta"],
    message: "La fecha de fin no puede ser anterior a la de inicio",
  });

/**
 * El `PATCH` es parcial, así que un `refine` sobre el par de fechas no correría
 * cuando llega una sola: el Service vuelve a verificar el rango **contra el
 * estado resultante**, igual que hace §13.2 con el departamento de un usuario y
 * §11 con el fin de una novedad.
 *
 * `usuarioId` no está: reasignar una actividad no es corregirla. Si la fila
 * quedó a nombre de quien no era, se corrige creando la correcta — y eso
 * además deja las dos visibles, que es lo que un registro de horas necesita.
 */
export const updateActividadRegistroSchema = alMenosUnCampo(
  z.object({
    productoServicioId: z.number().int().positive().optional(),
    gerenciaRequirienteId: z.number().int().positive().optional(),
    regionId: z.number().int().positive().nullable().optional(),
    fechaDesde: fechaSchema.optional(),
    fechaHasta: fechaSchema.optional(),
    cantidad: cantidadSchema.optional(),
    hh: hhSchema.nullable().optional(),
    estatus: estatusActividadSchema.optional(),
    detalle: z.string().trim().max(4000).nullable().optional(),
  }),
);

export const listActividadRegistrosQuerySchema = paginationQuerySchema.extend({
  departamentoId: z.coerce.number().int().positive().optional(),
  usuarioId: z.coerce.number().int().positive().optional(),
  /** Sólo con `usuarioId`: expande a **toda la cadena hacia abajo** de esa
   *  persona, no a un nivel (decisión #25). */
  cadena: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  desde: fechaSchema.optional(),
  hasta: fechaSchema.optional(),
  insumoId: z.coerce.number().int().positive().optional(),
  productoServicioId: z.coerce.number().int().positive().optional(),
  gerenciaRequirienteId: z.coerce.number().int().positive().optional(),
  regionId: z.coerce.number().int().positive().optional(),
  /** El alcance nacional es ausencia de región, así que no se puede pedir con
   *  `regionId`: hace falta una bandera propia. */
  soloNacional: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  estatus: estatusActividadSchema.optional(),
  q: busquedaSchema.optional(),
});

// ===========================================================================
// ACTIVIDAD_META — el plan anual (decisión #30)
// ===========================================================================

/** Coercionado: el año llega como query param o como segmento de ruta, nunca
 *  en un cuerpo JSON. */
const anioSchema = z.coerce.number().int().min(2000).max(2100);
const mesSchema = z.number().int().min(1).max(12);

/** Una meta en cero es legítima: significa "este mes no se planifica nada".
 *  Lo que no puede es faltar, porque el reporte necesita distinguir un mes
 *  planificado en cero de un mes sin plan. */
const metaCantidadSchema = z.number().int().min(0).max(999_999);
const metaHhSchema = z
  .number()
  .finite()
  .min(0)
  .max(99_999_999)
  .refine((v) => Number.isInteger(v * 100), { message: "Máximo 2 decimales" });

export const celdaMetaSchema = z.object({
  productoServicioId: z.number().int().positive(),
  mes: mesSchema,
  cantidadMeta: metaCantidadSchema,
  hhMeta: metaHhSchema,
});

/**
 * La carga del año entero, en una transacción.
 *
 * Va como reemplazo del año y no como parche incremental porque el plan es
 * una pieza: cargarlo de a celdas dejaría un año a medias si algo falla en el
 * medio, y el reporte de cumplimiento estaría comparando contra un plan que
 * nadie terminó de escribir.
 */
export const reemplazarMetasSchema = z.object({
  // El departamento viaja explícito y no se deduce de las celdas: es lo que
  // deja que la puerta de "Supervisor+ del departamento dueño" viva en el
  // middleware, donde hay contexto HTTP para dejar registro del 403. El
  // Service verifica después que todas las celdas le pertenezcan.
  departamentoId: z.number().int().positive(),
  celdas: z.array(celdaMetaSchema).min(1).max(1200),
});

export const listMetasQuerySchema = z.object({
  anio: anioSchema,
  departamentoId: z.coerce.number().int().positive().optional(),
});

export const updateMetaSchema = alMenosUnCampo(
  z.object({
    cantidadMeta: metaCantidadSchema.optional(),
    hhMeta: metaHhSchema.optional(),
  }),
);

export const anioParamSchema = z.object({ anio: anioSchema });

// ===========================================================================
// Reportes
// ===========================================================================

export const planVsRealQuerySchema = z.object({
  anio: anioSchema,
  departamentoId: z.coerce.number().int().positive().optional(),
});

export const participacionQuerySchema = z.object({
  anio: anioSchema,
  mes: z.coerce.number().int().min(1).max(12),
  departamentoId: z.coerce.number().int().positive().optional(),
});

export type CreateInsumoInput = z.infer<typeof createInsumoSchema>;
export type UpdateInsumoInput = z.infer<typeof updateInsumoSchema>;
export type CreateProductoServicioInput = z.infer<typeof createProductoServicioSchema>;
export type UpdateProductoServicioInput = z.infer<typeof updateProductoServicioSchema>;
export type CreateGerenciaRequirienteInput = z.infer<typeof createGerenciaRequirienteSchema>;
export type UpdateGerenciaRequirienteInput = z.infer<typeof updateGerenciaRequirienteSchema>;
export type CreateActividadRegistroInput = z.infer<typeof createActividadRegistroSchema>;
export type UpdateActividadRegistroInput = z.infer<typeof updateActividadRegistroSchema>;
export type ListActividadRegistrosQuery = z.infer<typeof listActividadRegistrosQuerySchema>;
export type CeldaMetaInput = z.infer<typeof celdaMetaSchema>;
export type ReemplazarMetasInput = z.infer<typeof reemplazarMetasSchema>;
export type UpdateMetaInput = z.infer<typeof updateMetaSchema>;
