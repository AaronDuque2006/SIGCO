import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import despachoRoutes from "./modules/despacho/despacho.routes.js";
import { env } from "./shared/env.js";
import { errorHandler, notFoundHandler } from "./shared/http.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/despacho", despachoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API escuchando en el puerto ${env.PORT}`);
});
