import { z } from "zod";
import { paginationQuerySchema } from "./common.js";

// ---------------------------------------------------------------------------
// Reglas de contraseña (decisión #52)
// ---------------------------------------------------------------------------
// Mínimo 6 caracteres, con al menos una letra y un número (decisión #58, que
// ajusta la #52). La regla anterior seguía NIST SP 800-63B —mínimo 12 y nada
// de reglas de composición— y se bajó a pedido del owner porque la longitud
// estaba fastidiando a la gente.
//
// El intercambio conviene tenerlo presente: a 6 caracteres la longitud ya no
// es la que defiende la cuenta. Lo que queda parando lo que un atacante prueba
// primero es la **lista de bloqueo**, y por eso acá se amplió en vez de
// recortarse. La otra defensa es el rate limiting del login (5 intentos
// fallidos cada 15 minutos, §12.2), que hace inviable recorrer el espacio de
// 6 alfanuméricos por fuerza bruta contra el servidor.

export const PASSWORD_MIN_LARGO = 6;

// Límite duro de bcrypt, no una decisión de política: bcrypt sólo mira los
// primeros 72 bytes y descarta el resto en silencio. Sin este tope, dos
// contraseñas que difieren después del byte 72 serían la misma contraseña.
export const PASSWORD_MAX_BYTES = 72;

// Términos que un atacante contra *este* sistema prueba primero.
const TERMINOS_INSTITUCIONALES = [
  "pdvsa",
  "sicog",
  "petroleosdevenezuela",
  "gasnatural",
  "controloperacional",
];

// Bases débiles conocidas. La comparación es contra el "esqueleto" de la
// contraseña (sólo letras, sin acentos ni mayúsculas), así que `Contraseña2026!`
// y `contrasena` colapsan al mismo valor y las dos caen acá.
const BASES_DEBILES = [
  "contrasena", "password", "clave", "qwerty", "asdfgh", "administrador",
  "admin", "superadmin", "bienvenido", "welcome", "iloveyou", "letmein",
  "abc", "monkey", "dragon", "futbol", "beisbol", "caracas", "venezuela",
  "maracaibo", "anaco", "secreto", "usuario", "sistema", "cambiame",
  "temporal", "prueba", "test", "root", "master", "analista", "supervisor",
  "gerente", "ingeniero", "superintendente",
  // Vocabulario del dominio. Antes quedaban afuera a propósito, porque con un
  // mínimo de 12 aparecían de forma natural dentro de frases largas y
  // legítimas. Con un mínimo de 6 eso ya no pasa —una contraseña de 6 no es
  // una frase— y en cambio son lo primero que alguien escribe: `gas123`,
  // `planta1`. La comparación es contra el esqueleto completo, así que
  // "el gas fluye por el sistema" (esqueleto `elgasfluyeporelsistema`) sigue
  // pasando sin problema.
  "gas", "despacho", "planta", "estacion", "operaciones", "control", "turno",
  "guardia", "nurgas", "anaco", "jusepin", "muscar", "tablazo",
];

const esqueleto = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z]/g, "");

// Se cuentan los bytes a mano en vez de usar Buffer (no existe en el
// navegador) o TextEncoder (no está tipado sin los tipos de Node ni el lib
// del DOM): este paquete lo importan la API y el frontend por igual, y no
// debería arrastrar la superficie de tipos de ninguno de los dos.
const largoEnBytes = (s: string): number => {
  let bytes = 0;
  for (const caracter of s) {
    const punto = caracter.codePointAt(0)!;
    bytes += punto < 0x80 ? 1 : punto < 0x800 ? 2 : punto < 0x10000 ? 3 : 4;
  }
  return bytes;
};

// Detecta `aaaaaa`, `123456`, `abcdef` y similares, que pasan la longitud
// mínima sin aportar entropía.
//
// El piso de caracteres distintos es 4 y no 5: con un mínimo de 6, exigir 5
// distintos rechazaría cosas razonables como `mama12` y la regla dejaría de
// atajar basura para pasar a estorbar.
const esSecuenciaORepeticion = (s: string): boolean => {
  if (new Set(s).size < 4) return true;
  let ascendente = true;
  let descendente = true;
  for (let i = 1; i < s.length; i++) {
    const salto = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (salto !== 1) ascendente = false;
    if (salto !== -1) descendente = false;
  }
  return ascendente || descendente;
};

/**
 * La contraseña no puede contener el nombre de usuario ni al revés. Vive como
 * función y no dentro del schema porque al cambiar la propia contraseña el
 * nombre no viene en el cuerpo (sale de la sesión): así la regla se define una
 * sola vez y la usan los dos caminos.
 */
export function passwordContieneNombre(password: string, nombre: string): boolean {
  const p = esqueleto(password);
  const n = esqueleto(nombre);
  return n.length >= 3 && p.includes(n);
}

export const passwordSchema = z
  .string()
  // NFKC antes de medir: dos formas Unicode del mismo carácter deben contar
  // igual, y es la forma que se guarda hasheada.
  .transform((s) => s.normalize("NFKC"))
  .refine((s) => s.length >= PASSWORD_MIN_LARGO, {
    message: `La contraseña debe tener al menos ${PASSWORD_MIN_LARGO} caracteres.`,
  })
  .refine((s) => largoEnBytes(s) <= PASSWORD_MAX_BYTES, {
    message: `La contraseña no puede superar los ${PASSWORD_MAX_BYTES} bytes.`,
  })
  .refine((s) => !TERMINOS_INSTITUCIONALES.some((t) => esqueleto(s).includes(t)), {
    message: "La contraseña no puede contener el nombre de la empresa ni del sistema.",
  })
  .refine((s) => !BASES_DEBILES.includes(esqueleto(s)), {
    message: "La contraseña es demasiado común. Elija una frase que no use.",
  })
  .refine((s) => !esSecuenciaORepeticion(s), {
    message: "La contraseña no puede ser una secuencia ni una repetición de caracteres.",
  })
  // Regla de composición pedida por el owner (decisión #58). No se exige
  // mayúscula ni símbolo: pedir los cuatro tipos empuja a `Gas2026!` y no
  // compra seguridad real. Los símbolos siguen permitidos, sólo que no
  // obligatorios.
  .refine((s) => /\p{L}/u.test(s) && /\p{Nd}/u.test(s), {
    message: "La contraseña debe tener al menos una letra y un número.",
  });

// ---------------------------------------------------------------------------
// Nombre de usuario
// ---------------------------------------------------------------------------
// Juego de caracteres acotado a propósito: sin espacios ni mayúsculas no hay
// dos nombres que se vean iguales y sean distintos al momento de iniciar
// sesión. `loginSchema` sigue aceptando cualquier cosa — validar la forma al
// entrar sólo le diría a un atacante qué nombres no vale la pena probar.
export const nombreUsuarioSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "El nombre de usuario debe tener al menos 3 caracteres.")
  .max(100)
  .regex(/^[a-z0-9._-]+$/, "Sólo se permiten letras, números, punto, guion y guion bajo.");

// ---------------------------------------------------------------------------
// Entradas de la API
// ---------------------------------------------------------------------------

export const crearUsuarioSchema = z.object({
  nombre: nombreUsuarioSchema,
  puestoId: z.number().int().positive(),
  // Nullable: por la decisión #21 sólo Gerente y superadmin pueden no
  // pertenecer a un departamento. El Service lo verifica contra el puesto real.
  departamentoId: z.number().int().positive().nullable().default(null),
  supervisorId: z.number().int().positive().nullable().default(null),
  esSuperadmin: z.boolean().default(false),
});

export const actualizarUsuarioSchema = z
  .object({
    puestoId: z.number().int().positive(),
    departamentoId: z.number().int().positive().nullable(),
    supervisorId: z.number().int().positive().nullable(),
    esSuperadmin: z.boolean(),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: "No hay nada que actualizar." });

export const bloqueoUsuarioSchema = z.object({
  bloqueado: z.boolean(),
});

export const cambiarPasswordSchema = z.object({
  // La actual no se valida contra las reglas: puede ser una temporal generada
  // por el sistema, o una anterior a un cambio de reglas.
  passwordActual: z.string().min(1).max(200),
  passwordNueva: passwordSchema,
});

export const listarUsuariosQuerySchema = paginationQuerySchema.extend({
  busqueda: z.string().trim().min(1).max(100).optional(),
  // NO se usa z.coerce.boolean(): los query params llegan como string y
  // Boolean("false") es true, así que `?soloBloqueados=false` filtraría
  // justo al revés de lo pedido.
  soloBloqueados: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
export type BloqueoUsuarioInput = z.infer<typeof bloqueoUsuarioSchema>;
export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>;
export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>;
