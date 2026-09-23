import { z } from "zod";
import {
  busquedaSchema,
  fechaSchema,
  horaLecturaSchema,
  paginationQuerySchema,
  tipoCorteSchema,
  volumenMmpcedSchema,
} from "./common.js";

const alMenosUnCampo = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.refine((v) => Object.keys(v).length > 0, {
    message: "Debe enviar al menos un campo a modificar",
  });

// ===== Catálogo SECTOR_CLIENTE (editable por Supervisor+ de Despacho, decisión #31) =====
// Sin DELETE: soft-delete vía `activo`, para no romper reportes históricos.

export const createSectorClienteSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
});

export const updateSectorClienteSchema = alMenosUnCampo(
  z.object({
    nombre: z.string().trim().min(1).max(120).optional(),
    activo: z.boolean().optional(),
  }),
);

// ===== CLIENTE =====

export const createClienteSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  regionId: z.number().int().positive(),
  sistemaId: z.number().int().positive(),
  sectorId: z.number().int().positive(),
});

export const updateClienteSchema = alMenosUnCampo(createClienteSchema.partial());

export const listClientesQuerySchema = paginationQuerySchema.extend({
  sistemaId: z.coerce.number().int().positive().optional(),
  regionId: z.coerce.number().int().positive().optional(),
  sectorId: z.coerce.number().int().positive().optional(),
  q: busquedaSchema.optional(),
});

// ===== FUENTE =====

export const createFuenteSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  sistemaId: z.number().int().positive(),
});

export const updateFuenteSchema = alMenosUnCampo(createFuenteSchema.partial());

export const listFuentesQuerySchema = paginationQuerySchema.extend({
  sistemaId: z.coerce.number().int().positive().optional(),
  q: busquedaSchema.optional(),
});

// ===== LECTURA_BALANCE =====
// El create no acepta `tipoCorte`: por la API sólo se digitan lecturas PUNTUAL.
// Las filas CIERRE_PROMEDIO las genera el job de cierre (decisiones #34 y #42),
// nunca un analista a mano.

// Paginación opcional y sin default: la grilla completa de un filtro es el modo
// normal de trabajo (digitar el día). `pageSize` llega a 200 para que quepan de
// una sola vez los 117 clientes si alguien pide la grilla nacional paginada.
const gridPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
});

export const listLecturasBalanceQuerySchema = gridPaginationSchema.extend({
  fecha: fechaSchema,
  tipoCorte: tipoCorteSchema.default("PUNTUAL"),
  sistemaId: z.coerce.number().int().positive().optional(),
  regionId: z.coerce.number().int().positive().optional(),
});

export const createLecturaBalanceSchema = z.object({
  clienteId: z.number().int().positive(),
  fecha: fechaSchema,
  volumenMmpced: volumenMmpcedSchema,
  horaLectura: horaLecturaSchema,
});

// Cambia el volumen y/o la hora: mover una lectura a otro cliente o fecha
// sería otro registro, no una corrección. Cada PATCH genera una fila de
// historial.
export const updateLecturaBalanceSchema = z.object({
  volumenMmpced: volumenMmpcedSchema,
  horaLectura: horaLecturaSchema,
});

// Corrige un valor ya guardado en el historial (decisión pendiente de
// numerar, amplía la #3). Pisa el número original y dispara el recálculo del
// CIERRE_PROMEDIO de ese día, que lo tenía contado en su media (decisión #34).
export const editarHistorialSchema = z.object({
  valorAnterior: volumenMmpcedSchema,
});

// Corrige el valor **vigente** en el lugar, desde la misma cuadrícula: pisa el
// número sin bajar el viejo al historial, que es lo que lo distingue del
// `PATCH` normal de la lectura (ese sí registra la corrección).
export const editarValorVigenteSchema = z.object({
  valor: volumenMmpcedSchema,
});

// ===== LECTURA_FUENTE =====
// Sin `tipoCorte`: el schema tiene @@unique(fuenteId, fecha), una lectura por
// día. La mecánica puntual/cierre de la decisión #34 no aplica acá.

export const listLecturasFuenteQuerySchema = gridPaginationSchema.extend({
  fecha: fechaSchema,
  sistemaId: z.coerce.number().int().positive().optional(),
});

// Informativo, no entra en el balance (decisiones #62/#74): se acepta en
// cualquier fuente, sin mirar `procesaGas` acá — es la pantalla la que decide
// si ofrece el campo, y mandar de más no rompe nada del lado del servidor.
const procesadoSchema = volumenMmpcedSchema.nullish();

export const createLecturaFuenteSchema = z.object({
  fuenteId: z.number().int().positive(),
  fecha: fechaSchema,
  volumenMmpced: volumenMmpcedSchema,
  horaLectura: horaLecturaSchema,
  procesado: procesadoSchema,
});

export const updateLecturaFuenteSchema = z.object({
  volumenMmpced: volumenMmpcedSchema,
  horaLectura: horaLecturaSchema,
  procesado: procesadoSchema,
});

// ===== QUEMA_NACIONAL =====

export const getQuemaNacionalQuerySchema = z.object({
  fecha: fechaSchema,
  tipoCorte: tipoCorteSchema.default("PUNTUAL"),
});

export const createQuemaNacionalSchema = z.object({
  fecha: fechaSchema,
  mmpced: volumenMmpcedSchema,
  horaLectura: horaLecturaSchema,
});

export const updateQuemaNacionalSchema = z.object({
  mmpced: volumenMmpcedSchema,
  horaLectura: horaLecturaSchema,
});

// ===== TRANSFERENCIAS (decisión #79) =====

/**
 * A diferencia de `volumenMmpcedSchema`, **admite negativos**.
 *
 * Un punto bidireccional codifica la dirección en el signo, igual que el
 * workbook con `FUENTES!Q31`. Que un punto de una sola dirección acepte un
 * negativo lo decide el Service, que es quien sabe si el punto lo es.
 */
export const volumenTransferenciaSchema = z
  .number()
  .finite()
  .min(-9_999_999_999)
  .max(9_999_999_999);

export const listTransferenciasQuerySchema = gridPaginationSchema.extend({
  fecha: fechaSchema,
  tipoCorte: tipoCorteSchema.default("PUNTUAL"),
});

// Sólo crea `PUNTUAL`, igual que las demás lecturas: el `CIERRE_PROMEDIO` lo
// escribe el job de medianoche (decisiones #34 y #42).
export const createTransferenciaSchema = z.object({
  puntoId: z.number().int().positive(),
  fecha: fechaSchema,
  mmpced: volumenTransferenciaSchema,
});

export const updateTransferenciaSchema = z.object({
  mmpced: volumenTransferenciaSchema,
});

// ===== NOVEDAD_OPERATIVA =====
// El "exactamente uno de cliente/fuente" refleja en el borde el CHECK que
// existe en la BD (migración 20260910150000), para fallar con un mensaje útil
// en vez de con un error de constraint.

const exactamenteUnoOrigen = <T extends { clienteId?: number | null; fuenteId?: number | null }>(
  v: T,
) => (v.clienteId == null) !== (v.fuenteId == null);

const origenMsg = { message: "Debe indicar exactamente uno: clienteId o fuenteId" };

const novedadCampos = z.object({
  clienteId: z.number().int().positive().nullish(),
  fuenteId: z.number().int().positive().nullish(),
  tipo: z.string().trim().min(1).max(120),
  impacto: z.string().trim().min(1),
  inicio: z.string().datetime(),
  fin: z.string().datetime().nullish(),
  causa: z.string().trim().min(1),
  mmpcedAfectados: volumenMmpcedSchema,
});

const rangoValido = (v: { inicio: string; fin?: string | null }) =>
  v.fin == null || Date.parse(v.fin) >= Date.parse(v.inicio);

const rangoMsg = { message: "`fin` no puede ser anterior a `inicio`" };

export const createNovedadSchema = novedadCampos
  .refine(exactamenteUnoOrigen, origenMsg)
  .refine(rangoValido, rangoMsg);

export const updateNovedadSchema = alMenosUnCampo(
  novedadCampos.omit({ clienteId: true, fuenteId: true }).partial(),
);

export const listNovedadesQuerySchema = paginationQuerySchema.extend({
  desde: fechaSchema.optional(),
  hasta: fechaSchema.optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  fuenteId: z.coerce.number().int().positive().optional(),
});

// ===== CONTACTO =====

const contactoCampos = z.object({
  clienteId: z.number().int().positive().nullish(),
  fuenteId: z.number().int().positive().nullish(),
  nombreOperador: z.string().trim().min(1).max(200),
  telefono: z.string().trim().min(1).max(80),
});

export const createContactoSchema = contactoCampos.refine(exactamenteUnoOrigen, origenMsg);

export const updateContactoSchema = alMenosUnCampo(
  contactoCampos.omit({ clienteId: true, fuenteId: true }).partial(),
);

export const listContactosQuerySchema = paginationQuerySchema.extend({
  clienteId: z.coerce.number().int().positive().optional(),
  fuenteId: z.coerce.number().int().positive().optional(),
  // Un directorio telefónico se busca, no se recorre. `q` mira el nombre del
  // operador, el teléfono —para la búsqueda inversa: "¿de quién es este
  // número?"— y el nombre del cliente o la fuente, que es como se lo piensa:
  // se busca "el teléfono de PEQUIVEN", no el de un operador por su nombre.
  q: busquedaSchema.optional(),
});

// ===== Reportes (decisiones #15 y #37) =====

export const reporteQuerySchema = z.object({
  fecha: fechaSchema,
  tipoCorte: tipoCorteSchema.default("PUNTUAL"),
});

// La serie del gráfico de línea. `dias` por defecto 7, que es la ventana del
// workbook; el tope de 90 evita que una petición barra el histórico entero.
export const serieBalanceQuerySchema = z.object({
  hasta: fechaSchema,
  dias: z.coerce.number().int().min(2).max(90).default(7),
  tipoCorte: tipoCorteSchema.default("PUNTUAL"),
});

export type CreateSectorClienteInput = z.infer<typeof createSectorClienteSchema>;
export type UpdateSectorClienteInput = z.infer<typeof updateSectorClienteSchema>;
export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
export type CreateFuenteInput = z.infer<typeof createFuenteSchema>;
export type UpdateFuenteInput = z.infer<typeof updateFuenteSchema>;
export type CreateLecturaBalanceInput = z.infer<typeof createLecturaBalanceSchema>;
export type UpdateLecturaBalanceInput = z.infer<typeof updateLecturaBalanceSchema>;
export type EditarHistorialInput = z.infer<typeof editarHistorialSchema>;
export type EditarValorVigenteInput = z.infer<typeof editarValorVigenteSchema>;
export type CreateLecturaFuenteInput = z.infer<typeof createLecturaFuenteSchema>;
export type UpdateLecturaFuenteInput = z.infer<typeof updateLecturaFuenteSchema>;
export type CreateQuemaNacionalInput = z.infer<typeof createQuemaNacionalSchema>;
export type UpdateQuemaNacionalInput = z.infer<typeof updateQuemaNacionalSchema>;
export type CreateNovedadInput = z.infer<typeof createNovedadSchema>;
export type UpdateNovedadInput = z.infer<typeof updateNovedadSchema>;
export type CreateContactoInput = z.infer<typeof createContactoSchema>;
export type UpdateContactoInput = z.infer<typeof updateContactoSchema>;
export type ListLecturasBalanceQuery = z.infer<typeof listLecturasBalanceQuerySchema>;
export type ListLecturasFuenteQuery = z.infer<typeof listLecturasFuenteQuerySchema>;
export type ListClientesQuery = z.infer<typeof listClientesQuerySchema>;
export type ListFuentesQuery = z.infer<typeof listFuentesQuerySchema>;
export type ListTransferenciasQuery = z.infer<typeof listTransferenciasQuerySchema>;
export type CreateTransferenciaInput = z.infer<typeof createTransferenciaSchema>;
export type UpdateTransferenciaInput = z.infer<typeof updateTransferenciaSchema>;
export type ListNovedadesQuery = z.infer<typeof listNovedadesQuerySchema>;
export type ListContactosQuery = z.infer<typeof listContactosQuerySchema>;
export type ReporteQuery = z.infer<typeof reporteQuerySchema>;
export type SerieBalanceQuery = z.infer<typeof serieBalanceQuerySchema>;
