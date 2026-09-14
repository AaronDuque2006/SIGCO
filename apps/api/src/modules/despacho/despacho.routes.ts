import { Router } from "express";
import {
  requireAuth,
  requireDepartamento,
  requirePasswordVigente,
} from "../../shared/auth.middleware.js";
import { asyncHandler } from "../../shared/http.js";
import * as lecturaBalance from "./controllers/lectura-balance.controller.js";
import * as balanceNacion from "./controllers/balance-nacion.controller.js";
import * as lecturaFuente from "./controllers/lectura-fuente.controller.js";

// Anotación explícita por TS2742: los symlinks de pnpm impiden que TS nombre
// el tipo inferido (mismo caso que shared/prisma-client.ts).
const router: Router = Router();

// Decisión #22: cualquier usuario autenticado consulta; sólo Despacho escribe.
// `requirePasswordVigente` corta el paso a quien siga con la contraseña
// temporal: hasta cambiarla no puede ni consultar (decisión #54).
router.use(asyncHandler(requireAuth), asyncHandler(requirePasswordVigente));
const soloDespacho = asyncHandler(requireDepartamento("Despacho"));

router.get("/lecturas-balance", asyncHandler(lecturaBalance.listarGrilla));
router.post("/lecturas-balance", soloDespacho, asyncHandler(lecturaBalance.registrar));
router.patch("/lecturas-balance/:id", soloDespacho, asyncHandler(lecturaBalance.corregir));
router.get("/lecturas-balance/:id/historial", asyncHandler(lecturaBalance.listarHistorial));

router.get("/lecturas-fuente", asyncHandler(lecturaFuente.listarGrilla));
router.post("/lecturas-fuente", soloDespacho, asyncHandler(lecturaFuente.registrar));
router.patch("/lecturas-fuente/:id", soloDespacho, asyncHandler(lecturaFuente.corregir));
router.get("/lecturas-fuente/:id/historial", asyncHandler(lecturaFuente.listarHistorial));

// Query-calculado, no una tabla (decisión #15). Va sin `soloDespacho`: es de
// consulta, y la decisión #22 deja consultar a cualquiera.
router.get("/reportes/balance-nacion", asyncHandler(balanceNacion.balanceNacion));

export default router;
