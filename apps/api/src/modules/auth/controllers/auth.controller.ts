import type { CookieOptions, Request, Response } from "express";
import { loginSchema } from "@sicog/shared-validators";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { env } from "../../../shared/env.js";
import { parseOrThrow } from "../../../shared/http.js";
import {
  ACCESS_TTL_SEGUNDOS,
  authService,
  type ParDeTokens,
} from "../services/auth.service.js";

export const COOKIE_ACCESS = "sicog_access";
export const COOKIE_REFRESH = "sicog_refresh";

// httpOnly: JavaScript nunca ve los tokens, así que un XSS no puede robarlos.
// sameSite strict: el navegador no las manda en peticiones que vengan de otro
// sitio, que es lo que corta el CSRF sin necesidad de un token aparte.
const opcionesBase = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
});

const datosPeticion = (req: Request) => ({
  ip: req.ip ?? "desconocida",
  userAgent: req.get("user-agent") ?? null,
});

function ponerCookies(res: Response, tokens: ParDeTokens): void {
  res.cookie(COOKIE_ACCESS, tokens.accessToken, {
    ...opcionesBase(),
    maxAge: ACCESS_TTL_SEGUNDOS * 1000,
  });
  res.cookie(COOKIE_REFRESH, tokens.refreshToken, {
    ...opcionesBase(),
    expires: tokens.refreshExpiraEn,
  });
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { nombre, password } = parseOrThrow(loginSchema, req.body);
  const { usuario, tokens } = await authService.login(nombre, password, datosPeticion(req));
  ponerCookies(res, tokens);
  res.json(usuario);
};

export const refrescar = async (req: Request, res: Response): Promise<void> => {
  const { usuario, tokens } = await authService.refrescar(
    String(req.cookies?.[COOKIE_REFRESH] ?? ""),
    datosPeticion(req),
  );
  ponerCookies(res, tokens);
  res.json(usuario);
};

export const cerrarSesion = async (req: Request, res: Response): Promise<void> => {
  await authService.cerrarSesion(req.cookies?.[COOKIE_REFRESH]);
  // Las opciones deben coincidir con las del alta o el navegador no las borra.
  res.clearCookie(COOKIE_ACCESS, opcionesBase());
  res.clearCookie(COOKIE_REFRESH, opcionesBase());
  res.status(204).send();
};

export const sesionActual = async (req: Request, res: Response): Promise<void> => {
  res.json(await authService.sesionActual(usuarioActual(req).id));
};
