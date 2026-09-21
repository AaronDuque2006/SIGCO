/**
 * Carga la bitácora de fallas de Mantenimiento con el estado real del reporte
 * semanal.
 *
 *   pnpm --filter api run sembrar-fallas-mtto            # siembra
 *   pnpm --filter api run sembrar-fallas-mtto -- --limpiar
 *
 * A diferencia de `sembrar-demo`, que inventa cifras plausibles para Despacho
 * (decisión #86), acá los datos **son los reales**: son las 201 estaciones en
 * falla con las que cierra `DISPON_SISUGAS_Semana_35.xls`, con su causa, su
 * fecha de inicio y su observación. No hay nada que inventar porque el archivo
 * publica el estado, no una medición sensible.
 *
 * Es idempotente: una estación que ya tiene su falla abierta no recibe otra,
 * que además el índice único parcial impediría.
 */
import { FALLAS_SEED } from "@sicog/db";
import { prisma } from "../shared/prisma-client.js";

const limpiar = process.argv.includes("--limpiar");

async function main(): Promise<void> {
  if (limpiar) {
    const { count } = await prisma.fallaEstacion.deleteMany({});
    console.log(`Bitácora de fallas vaciada: ${count} fila(s).`);
    return;
  }

  // Las fallas quedan a nombre de quien las cargó. Se usa el superadmin más
  // antiguo porque es la única cuenta que existe con seguridad en cualquier
  // instalación; cuando el área use el sistema, cada quien carga las suyas.
  const usuario = await prisma.usuario.findFirst({
    where: { esSuperadmin: true, bloqueado: false },
    orderBy: { id: "asc" },
    select: { id: true, nombre: true },
  });
  if (!usuario) throw new Error("No hay superadmin: corra primero `crear-superadmin`.");

  const [estaciones, causas, yaAbiertas] = await Promise.all([
    prisma.estacion.findMany({ select: { id: true, nodo: true } }),
    prisma.causaFalla.findMany({ select: { id: true, nombre: true } }),
    prisma.fallaEstacion.findMany({ where: { resueltaEn: null }, select: { estacionId: true } }),
  ]);

  const porNodo = new Map(estaciones.map((e) => [e.nodo, e.id]));
  const porCausa = new Map(causas.map((c) => [c.nombre, c.id]));
  const conFallaAbierta = new Set(yaAbiertas.map((f) => f.estacionId));

  const nuevas = [];
  const sinEstacion: string[] = [];

  for (const f of FALLAS_SEED) {
    const estacionId = porNodo.get(f.nodo);
    if (!estacionId) {
      sinEstacion.push(f.nodo);
      continue;
    }
    if (conFallaAbierta.has(estacionId)) continue;
    const causaFallaId = porCausa.get(f.causa);
    if (!causaFallaId) throw new Error(`falta la causa "${f.causa}" en el catálogo`);

    nuevas.push({
      estacionId,
      causaFallaId,
      desde: new Date(`${f.desde}T00:00:00.000Z`),
      observacion: f.observacion,
      usuarioId: usuario.id,
    });
    conFallaAbierta.add(estacionId);
  }

  if (nuevas.length > 0) await prisma.fallaEstacion.createMany({ data: nuevas });

  const total = await prisma.estacion.count();
  const enFalla = await prisma.fallaEstacion.count({ where: { resueltaEn: null } });
  console.log(`Fallas nuevas: ${nuevas.length}  (a nombre de "${usuario.nombre}")`);
  if (sinEstacion.length > 0) {
    // El reporte semanal nombra unos pocos nodos que el inventario no tiene:
    // los dos archivos se mantienen por separado y derivaron.
    console.log(`Nodos del reporte que no están en el inventario (${sinEstacion.length}): ${sinEstacion.join(", ")}`);
  }
  console.log(`Estado: ${total - enFalla} operativas de ${total} (${((1 - enFalla / total) * 100).toFixed(1)}%).`);
}

void main().finally(() => prisma.$disconnect());
