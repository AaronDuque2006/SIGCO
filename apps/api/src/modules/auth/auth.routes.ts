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

// La contraseña actual se verifica acá, así que este endpoint es un segundo
// oráculo de fuerza bruta sobre una cuenta ya abierta. Va con su propio
// límite, más holgado que el del login porque acá ya hay sesión válida.
const limiteCambioPassword = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: { code: "FORBIDDEN", message: "Demasiados intentos. Espere unos minutos." },
  },
});

const router: Router = Router();

router.post("/login", limiteLogin, asyncHandler(auth.login));
router.post("/refresh", asyncHandler(auth.refrescar));
router.post("/logout", asyncHandler(auth.cerrarSesion));
router.get("/sesion", asyncHandler(requireAuth), asyncHandler(auth.sesionActual));

// A propósito NO lleva `requirePasswordVigente`: quien entró con una
// contraseña temporal tiene que poder cambiarla, y es lo único que puede hacer
// hasta entonces (decisión #54).
router.put(
  "/password",
  asyncHandler(requireAuth),
  limiteCambioPassword,
  asyncHandler(auth.cambiarPassword),
);

export default router;
