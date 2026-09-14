import { Router } from "express";
import {
  requireAuth,
  requirePasswordVigente,
  requireSuperadmin,
} from "../../shared/auth.middleware.js";
import { asyncHandler } from "../../shared/http.js";
import * as usuarios from "./controllers/usuario.controller.js";

// Anotación explícita por TS2742 (mismo caso que despacho.routes.ts).
const router: Router = Router();

// Decisión #11: la gestión de usuarios es exclusiva del superadmin y no hay
// auto-registro. Todo el router va detrás de las tres puertas: autenticado,
// con la contraseña ya cambiada, y superadmin.
router.use(
  asyncHandler(requireAuth),
  asyncHandler(requirePasswordVigente),
  asyncHandler(requireSuperadmin),
);

router.post("/", asyncHandler(usuarios.crear));
router.get("/", asyncHandler(usuarios.listar));
router.get("/:id", asyncHandler(usuarios.obtener));
router.patch("/:id", asyncHandler(usuarios.actualizar));
router.put("/:id/bloqueo", asyncHandler(usuarios.establecerBloqueo));
router.post("/:id/password-temporal", asyncHandler(usuarios.reiniciarPassword));

export default router;
