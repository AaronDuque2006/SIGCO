import { Router } from "express";
import {
  requireAuth,
  requireDepartamento,
  requirePasswordVigente,
  requireSupervisor,
} from "../../shared/auth.middleware.js";
import { asyncHandler } from "../../shared/http.js";
import * as catalogos from "./controllers/catalogos.controller.js";
import * as cliente from "./controllers/cliente.controller.js";
import * as contacto from "./controllers/contacto.controller.js";
import * as fuente from "./controllers/fuente.controller.js";
import * as lecturaBalance from "./controllers/lectura-balance.controller.js";
import * as balanceNacion from "./controllers/balance-nacion.controller.js";
import * as lecturaFuente from "./controllers/lectura-fuente.controller.js";
import * as novedad from "./controllers/novedad.controller.js";
import * as quemaNacional from "./controllers/quema-nacional.controller.js";

// Anotación explícita por TS2742: los symlinks de pnpm impiden que TS nombre
// el tipo inferido (mismo caso que shared/prisma-client.ts).
const router: Router = Router();

// Decisión #22: cualquier usuario autenticado consulta; sólo Despacho escribe.
// `requirePasswordVigente` corta el paso a quien siga con la contraseña
// temporal: hasta cambiarla no puede ni consultar (decisión #54).
router.use(asyncHandler(requireAuth), asyncHandler(requirePasswordVigente));
const soloDespacho = asyncHandler(requireDepartamento("Despacho"));

// "Supervisor+ de Despacho" (decisión #31) son las dos condiciones juntas, no
// una en lugar de la otra: sin `soloDespacho` delante, un supervisor de
// Mantenimiento podría editar el catálogo de este dominio.
const soloSupervisorDespacho = [soloDespacho, asyncHandler(requireSupervisor)];

// ── Catálogos ────────────────────────────────────────────────────────────────
// `SISTEMA` y `REGION_OPERATIVA` son de sólo lectura por la API: se siembran y
// se corrigen con el seed, que es aditivo e idempotente. El único catálogo con
// escritura es `SECTOR_CLIENTE`, y sin DELETE (decisión #31).
router.get("/sistemas", asyncHandler(catalogos.listarSistemas));
router.get("/regiones", asyncHandler(catalogos.listarRegiones));
router.get("/sectores-cliente", asyncHandler(catalogos.listarSectores));
router.post("/sectores-cliente", soloSupervisorDespacho, asyncHandler(catalogos.crearSector));
router.patch(
  "/sectores-cliente/:id",
  soloSupervisorDespacho,
  asyncHandler(catalogos.actualizarSector),
);

// ── Clientes y fuentes ───────────────────────────────────────────────────────
// Sin DELETE en ninguno de los dos: un cliente tiene lecturas, novedades y
// contactos colgando, y borrarlo dejaría huérfano el histórico del balance.
router.get("/clientes", asyncHandler(cliente.listar));
router.post("/clientes", soloDespacho, asyncHandler(cliente.crear));
router.get("/clientes/:id", asyncHandler(cliente.obtener));
router.patch("/clientes/:id", soloDespacho, asyncHandler(cliente.actualizar));

router.get("/fuentes", asyncHandler(fuente.listar));
router.post("/fuentes", soloDespacho, asyncHandler(fuente.crear));
router.get("/fuentes/:id", asyncHandler(fuente.obtener));
router.patch("/fuentes/:id", soloDespacho, asyncHandler(fuente.actualizar));

// ── Lecturas ─────────────────────────────────────────────────────────────────

router.get("/lecturas-balance", asyncHandler(lecturaBalance.listarGrilla));
router.post("/lecturas-balance", soloDespacho, asyncHandler(lecturaBalance.registrar));
router.patch("/lecturas-balance/:id", soloDespacho, asyncHandler(lecturaBalance.corregir));
router.get("/lecturas-balance/:id/historial", asyncHandler(lecturaBalance.listarHistorial));

router.get("/lecturas-fuente", asyncHandler(lecturaFuente.listarGrilla));
router.post("/lecturas-fuente", soloDespacho, asyncHandler(lecturaFuente.registrar));
router.patch("/lecturas-fuente/:id", soloDespacho, asyncHandler(lecturaFuente.corregir));
router.get("/lecturas-fuente/:id/historial", asyncHandler(lecturaFuente.listarHistorial));

// Una sola cifra por fecha y corte, no una grilla: por eso el GET va sin
// paginar y devuelve `quema: null` cuando el día todavía no se digitó.
router.get("/quema-nacional", asyncHandler(quemaNacional.obtenerDelDia));
router.post("/quema-nacional", soloDespacho, asyncHandler(quemaNacional.registrar));
router.patch("/quema-nacional/:id", soloDespacho, asyncHandler(quemaNacional.corregir));
router.get("/quema-nacional/:id/historial", asyncHandler(quemaNacional.listarHistorial));

// ── Novedades operativas ─────────────────────────────────────────────────────
// `/tipos` va **antes** que `/:id`, que si no se la traga — el mismo tropiezo
// que documenta §13.1 con `/usuarios/catalogos`.
// Sin DELETE: el modelo no tiene `activo` y el dominio es auditable (§11.5).
router.get("/novedades", asyncHandler(novedad.listar));
router.get("/novedades/tipos", asyncHandler(novedad.listarTipos));
router.post("/novedades", soloDespacho, asyncHandler(novedad.crear));
router.get("/novedades/:id", asyncHandler(novedad.obtener));
router.patch("/novedades/:id", soloDespacho, asyncHandler(novedad.actualizar));

// ── Contactos ────────────────────────────────────────────────────────────────
// El único recurso del módulo **con DELETE**, y es borrado físico: un teléfono
// viejo no es un dato operativo histórico, es ruido en una lista que se
// consulta con apuro. El `id` es `Int`, no `BigInt`, así que va `idParamSchema`.
router.get("/contactos", asyncHandler(contacto.listar));
router.post("/contactos", soloDespacho, asyncHandler(contacto.crear));
router.get("/contactos/:id", asyncHandler(contacto.obtener));
router.patch("/contactos/:id", soloDespacho, asyncHandler(contacto.actualizar));
router.delete("/contactos/:id", soloDespacho, asyncHandler(contacto.eliminar));

// Query-calculado, no una tabla (decisión #15). Va sin `soloDespacho`: es de
// consulta, y la decisión #22 deja consultar a cualquiera.
router.get("/reportes/balance-nacion", asyncHandler(balanceNacion.balanceNacion));

export default router;
