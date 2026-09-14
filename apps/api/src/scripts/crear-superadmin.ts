/**
 * Arranque en frío (decisión #55): crea el primer superadmin del sistema.
 *
 * Existe porque la gestión de usuarios es exclusiva del superadmin y no hay
 * auto-registro (decisión #11): sin esto no habría forma de crear la primera
 * cuenta salvo escribiendo SQL y un hash bcrypt a mano contra la base de
 * producción.
 *
 *   pnpm --filter api run crear-superadmin <nombre>
 *
 * Imprime una contraseña temporal de 72 h **una sola vez**: no se guarda en
 * claro y no hay forma de volver a consultarla. Se niega a correr si ya existe
 * un superadmin — a partir de ahí las cuentas se crean por la API.
 */
import { nombreUsuarioSchema } from "@sicog/shared-validators";
import {
  generarPasswordTemporal,
  hashPassword,
  PASSWORD_TEMPORAL_TTL_MS,
} from "../shared/password.js";
import { prisma } from "../shared/prisma-client.js";

// El superadmin no pertenece a ningún departamento (decisión #21) ni tiene un
// cargo del organigrama que le corresponda por sí mismo; se le asigna el
// puesto más bajo y el rol de sistema aparte. Si además es una persona con
// cargo real, el superadmin lo corrige después por la API.
const PUESTO_POR_DEFECTO = "Analista";

async function main(): Promise<void> {
  const nombreCrudo = process.argv[2];
  if (!nombreCrudo) {
    console.error("Uso: pnpm --filter api run crear-superadmin <nombre>");
    process.exitCode = 1;
    return;
  }

  const parseo = nombreUsuarioSchema.safeParse(nombreCrudo);
  if (!parseo.success) {
    console.error(`Nombre inválido: ${parseo.error.issues.map((i) => i.message).join(" ")}`);
    process.exitCode = 1;
    return;
  }
  const nombre = parseo.data;

  // Se niega a correr dos veces: una vez que hay un superadmin, crear más es
  // una operación auditada de la API, no un comando suelto en el servidor.
  const yaHay = await prisma.usuario.count({ where: { esSuperadmin: true } });
  if (yaHay > 0) {
    console.error(
      `Ya existe ${yaHay} superadmin. Cree los demás desde la API (POST /api/usuarios).`,
    );
    process.exitCode = 1;
    return;
  }

  const puesto = await prisma.puesto.findFirst({ where: { nombre: PUESTO_POR_DEFECTO } });
  if (!puesto) {
    console.error(
      `No existe el puesto "${PUESTO_POR_DEFECTO}". Corra antes el seed: pnpm --filter @sicog/db run seed`,
    );
    process.exitCode = 1;
    return;
  }

  const passwordTemporal = generarPasswordTemporal();
  const passwordExpiraEn = new Date(Date.now() + PASSWORD_TEMPORAL_TTL_MS);

  await prisma.usuario.create({
    data: {
      nombre,
      passwordHash: await hashPassword(passwordTemporal),
      puestoId: puesto.id,
      departamentoId: null,
      esSuperadmin: true,
      debeCambiarPassword: true,
      passwordExpiraEn,
    },
  });

  console.log("");
  console.log("  Superadmin creado.");
  console.log(`  Usuario:            ${nombre}`);
  console.log(`  Contraseña temporal: ${passwordTemporal}`);
  console.log(`  Vence:              ${passwordExpiraEn.toISOString()}`);
  console.log("");
  console.log("  Anótela ahora: no se guarda en claro y no se puede volver a consultar.");
  console.log("  Al entrar, el sistema le va a exigir cambiarla antes de hacer nada más.");
  console.log("");
}

main()
  .catch((err: unknown) => {
    console.error("No se pudo crear el superadmin:", err);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
