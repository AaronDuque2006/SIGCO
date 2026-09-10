import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import despachoRoutes from "./modules/despacho/despacho.routes.js";
import { env } from "./shared/env.js";
import { errorHandler, notFoundHandler } from "./shared/http.js";
import { iniciarCierreDiario } from "./shared/scheduler.js";

const app = express();

// Coolify termina TLS por delante: sin esto req.ip sería la del proxy y el
// rate limiting por IP y los logs de login registrarían siempre la misma.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/despacho", despachoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API escuchando en el puerto ${env.PORT}`);
  iniciarCierreDiario();
});
