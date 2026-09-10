import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../shared/auth.middleware.js";
import { asyncHandler } from "../../shared/http.js";
import * as auth from "./controllers/auth.controller.js";

// §3: ~5 intentos / 15 min. Es la única defensa automática contra fuerza
// bruta — por decisión, los intentos fallidos NO bloquean la cuenta, para que
// nadie pueda dejar afuera a un analista mandando contraseñas malas a
// propósito (el campo `bloqueado` lo maneja el superadmin a mano).
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Sólo cuentan los intentos fallidos: quien entra bien no gasta cupo.
  skipSuccessfulRequests: true,
  message: {
    error: { code: "FORBIDDEN", message: "Demasiados intentos. Espere unos minutos." },
  },
});

const router: Router = Router();

router.post("/login", limiteLogin, asyncHandler(auth.login));
router.post("/refresh", asyncHandler(auth.refrescar));
router.post("/logout", asyncHandler(auth.cerrarSesion));
router.get("/sesion", requireAuth, asyncHandler(auth.sesionActual));

export default router;
