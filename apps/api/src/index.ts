import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});
