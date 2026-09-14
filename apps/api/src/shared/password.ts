import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";

// §3 del contexto del proyecto: bcrypt con costo 12.
export const COSTO_BCRYPT = 12;

// 72 horas (decisión #54). La entrega de la temporal es en persona —el modelo
// de usuario no tiene correo—, así que la ventana cubre un fin de semana y un
// cambio de guardia sin dejar la cuenta abierta indefinidamente.
export const PASSWORD_TEMPORAL_TTL_MS = 72 * 60 * 60 * 1000;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password.normalize("NFKC"), COSTO_BCRYPT);

export const verificarPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password.normalize("NFKC"), hash);

// Alfabeto sin caracteres que se confunden al dictarla o copiarla a mano
// (0/O/o, 1/l/I): la temporal se entrega hablada o en papel, no por correo.
const ALFABETO = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LARGO = 15;
const TAMANO_GRUPO = 5;

/**
 * Contraseña temporal generada por el sistema (decisión #54). No la elige el
 * superadmin a propósito: si la eligiera a mano, en la práctica todos los
 * usuarios arrancarían con la misma cadena y esa se volvería la llave maestra
 * del sistema.
 *
 * 15 caracteres sobre un alfabeto de 56 ≈ 87 bits de entropía. Se agrupa con
 * guiones sólo para poder dictarla sin equivocarse.
 */
export function generarPasswordTemporal(): string {
  // randomInt del módulo crypto: aleatoriedad criptográfica y sin el sesgo
  // que introduce un `% ALFABETO.length` sobre bytes crudos.
  const chars = Array.from({ length: LARGO }, () => ALFABETO[randomInt(0, ALFABETO.length)]);
  const grupos: string[] = [];
  for (let i = 0; i < chars.length; i += TAMANO_GRUPO) {
    grupos.push(chars.slice(i, i + TAMANO_GRUPO).join(""));
  }
  return grupos.join("-");
}
