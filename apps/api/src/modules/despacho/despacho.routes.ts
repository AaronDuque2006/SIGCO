import { Router } from "express";
import { requireAuth, requireDepartamento } from "../../shared/auth.middleware.js";
import { asyncHandler } from "../../shared/http.js";
import * as lecturaBalance from "./controllers/lectura-balance.controller.js";

// Anotación explícita por TS2742: los symlinks de pnpm impiden que TS nombre
// el tipo inferido (mismo caso que shared/prisma-client.ts).
const router: Router = Router();

// Decisión #22: cualquier usuario autenticado consulta; sólo Despacho escribe.
router.use(requireAuth);
const soloDespacho = asyncHandler(requireDepartamento("Despacho"));

router.get("/lecturas-balance", asyncHandler(lecturaBalance.listarGrilla));
router.post("/lecturas-balance", soloDespacho, asyncHandler(lecturaBalance.registrar));
router.patch("/lecturas-balance/:id", soloDespacho, asyncHandler(lecturaBalance.corregir));
router.get("/lecturas-balance/:id/historial", asyncHandler(lecturaBalance.listarHistorial));

export default router;
