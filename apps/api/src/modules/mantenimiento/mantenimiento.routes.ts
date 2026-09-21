import { Router, type Router as RouterType } from "express";
import {
  requireAuth,
  requireDepartamento,
  requirePasswordVigente,
  requireSupervisor,
} from "../../shared/auth.middleware.js";
import { asyncHandler } from "../../shared/http.js";
import * as estacion from "./controllers/estacion.controller.js";
import * as falla from "./controllers/falla.controller.js";

const router: RouterType = Router();

// Las dos puertas comunes de todo el sistema: autenticado y con la contraseña
// ya cambiada (decisión #54). Consultar lo puede hacer cualquiera, de cualquier
// departamento (decisión #22).
router.use(asyncHandler(requireAuth), asyncHandler(requirePasswordVigente));

/** Anotar una falla es la operación del día a día del departamento, así que la
 *  puerta es la misma que Despacho pone sobre sus lecturas: pertenecer al
 *  departamento. No exige Supervisor. */
const soloMantenimiento = asyncHandler(requireDepartamento("Mantenimiento"));

/** El inventario y el catálogo de causas son otra cosa: cambian el universo
 *  sobre el que se calcula el indicador, así que van detrás de Supervisor+ del
 *  departamento, encadenado como en la decisión #67. */
const supervisorDeMantenimiento = [soloMantenimiento, asyncHandler(requireSupervisor)];

// ---------------------------------------------------------------------------
// Catálogos del inventario
// ---------------------------------------------------------------------------

router.get("/areas", asyncHandler(estacion.listarAreas));
router.get("/tipos-instrumento", asyncHandler(estacion.listarTiposInstrumento));
router.get("/causas-falla", asyncHandler(estacion.listarCausas));
router.post("/causas-falla", ...supervisorDeMantenimiento, asyncHandler(estacion.crearCausa));
router.patch("/causas-falla/:id", ...supervisorDeMantenimiento, asyncHandler(estacion.actualizarCausa));

// ---------------------------------------------------------------------------
// Reportes. Van antes de "/estaciones/:id" y "/fallas/:id" para que el router
// no se trague la ruta (mismo tropiezo que §13.1 con /usuarios/catalogos).
// ---------------------------------------------------------------------------

router.get("/reportes/disponibilidad", asyncHandler(falla.disponibilidad));
router.get("/reportes/serie-disponibilidad", asyncHandler(falla.serieDisponibilidad));

// ---------------------------------------------------------------------------
// Inventario de estaciones. Sin DELETE: una estación que sale de servicio es
// una falla, no una fila que se borra, y tiene bitácora colgando.
// ---------------------------------------------------------------------------

router.get("/estaciones", asyncHandler(estacion.listarEstaciones));
router.post("/estaciones", ...supervisorDeMantenimiento, asyncHandler(estacion.crearEstacion));
router.get("/estaciones/:id", asyncHandler(estacion.obtenerEstacion));
router.patch("/estaciones/:id", ...supervisorDeMantenimiento, asyncHandler(estacion.actualizarEstacion));
router.put(
  "/estaciones/:id/instrumentos",
  ...supervisorDeMantenimiento,
  asyncHandler(estacion.reemplazarInstrumentos),
);

// ---------------------------------------------------------------------------
// Bitácora de fallas. Sin DELETE tampoco: una falla que no va se corrige, y
// una que terminó se resuelve — borrarla perdería el historial de caída que es
// justamente el dato de gestión.
// ---------------------------------------------------------------------------

router.get("/fallas", asyncHandler(falla.listarFallas));
router.post("/fallas", soloMantenimiento, asyncHandler(falla.crearFalla));
router.get("/fallas/:id", asyncHandler(falla.obtenerFalla));
router.get("/fallas/:id/historial", asyncHandler(falla.listarHistorialFalla));
router.patch("/fallas/:id", soloMantenimiento, asyncHandler(falla.actualizarFalla));
router.put("/fallas/:id/resolver", soloMantenimiento, asyncHandler(falla.resolverFalla));

export default router;
