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

// Palabras cortas, sin acentos ni eñe, y evitando las que se confunden al
// dictarlas (vaca/baca, casa/caza, vaso/bazo): la temporal se entrega hablada
// o en papel, porque el modelo de usuario no tiene correo.
const PALABRAS = [
  "mesa", "silla", "libro", "papel", "campo", "cielo", "tierra", "fuego",
  "agua", "viento", "playa", "monte", "valle", "lago", "nube", "lluvia",
  "hoja", "flor", "fruta", "trigo", "leche", "queso", "carne", "arroz",
  "sopa", "plato", "taza", "olla", "horno", "techo", "puerta", "patio",
  "muro", "piso", "calle", "plaza", "parque", "puente", "camino", "barco",
  "tren", "carro", "rueda", "motor", "llave", "reloj", "mapa", "carta",
  "tinta", "marco", "cuadro", "banco", "mueble", "cama", "manta", "ropa",
  "gorra", "bolso", "perro", "gato", "pato", "ganso", "toro", "cabra",
  "oveja", "cerdo", "mono", "tigre", "lobo", "zorro", "ciervo", "conejo",
  "abeja", "mosca", "grillo", "pluma", "nido", "huevo", "miel", "harina",
  "verde", "azul", "rojo", "negro", "blanco", "gris", "largo", "corto",
  "alto", "bajo", "fuerte", "lento", "quieto", "tibio", "limpio", "nuevo",
];
const DIGITOS = 4;

/**
 * Contraseña temporal generada por el sistema (decisión #54, formato ajustado
 * por la #58). No la elige el superadmin a propósito: elegida a mano, en la
 * práctica todos los usuarios arrancarían con la misma cadena y esa sería la
 * llave maestra del sistema. Por el mismo motivo **no** se deriva del nombre
 * de usuario: sería deducible por cualquiera que lo conozca, y las cuentas se
 * crean días antes de que su dueño entre por primera vez.
 *
 * Formato `palabra-1234`: se dicta en dos segundos y se teclea en cinco, que
 * era el problema con los 15 caracteres aleatorios que había antes.
 *
 * 96 palabras x 10.000 = 960.000 combinaciones (~20 bits). Es mucho menos que
 * antes, y alcanza por tres razones que se sostienen juntas: la temporal vence
 * a las 72 h, hay que cambiarla en el primer ingreso, y el login admite 5
 * intentos fallidos cada 15 minutos (§12.2) — unos 1.400 intentos en toda la
 * ventana de vigencia, o sea una posibilidad en 700 de acertar una cuenta
 * concreta. Si alguna vez se quita el rate limiting, este número deja de
 * alcanzar.
 */
export function generarPasswordTemporal(): string {
  const palabra = PALABRAS[randomInt(0, PALABRAS.length)];
  // randomInt del módulo crypto: aleatoriedad criptográfica y sin el sesgo que
  // introduce un `% n` sobre bytes crudos.
  const numero = String(randomInt(0, 10 ** DIGITOS)).padStart(DIGITOS, "0");
  return `${palabra}-${numero}`;
}
