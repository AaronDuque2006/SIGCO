import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  requireAuth,
  requirePasswordVigente,
  requireSuperadmin,
  usuarioActual,
} from "../../shared/auth.middleware.js";
import { env } from "../../shared/env.js";
import { asyncHandler } from "../../shared/http.js";
import * as rag from "./controllers/rag.controller.js";

// Cada consulta ocupa la CPU del servidor durante segundos: un límite por
// usuario evita que una sola persona (o un script con su sesión) acapare el
// modelo para todos.
const limiteConsultas = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `u${usuarioActual(req).id}`,
  message: {
    error: { code: "FORBIDDEN", message: "Demasiadas consultas seguidas. Espere unos minutos." },
  },
});

const router: Router = Router();

router.use(asyncHandler(requireAuth), asyncHandler(requirePasswordVigente));

// Consultar lo puede cualquier usuario autenticado (§16.3).
router.post("/consultas", limiteConsultas, asyncHandler(rag.consultar));

// Qué entra al corpus lo decide sólo el superadmin (decisión #101).
const soloSuperadmin = asyncHandler(requireSuperadmin);
router.get("/documentos", soloSuperadmin, asyncHandler(rag.listar));
router.post(
  "/documentos",
  soloSuperadmin,
  express.raw({ type: "application/octet-stream", limit: `${env.RAG_TAMANO_MAXIMO_MB}mb` }),
  asyncHandler(rag.subir),
);
router.delete("/documentos/:id", soloSuperadmin, asyncHandler(rag.eliminar));
router.post("/documentos/:id/reprocesar", soloSuperadmin, asyncHandler(rag.reprocesar));

export default router;
