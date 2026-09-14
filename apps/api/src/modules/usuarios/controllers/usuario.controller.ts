import type { Request, Response } from "express";
import {
  actualizarUsuarioSchema,
  bloqueoUsuarioSchema,
  crearUsuarioSchema,
  idParamSchema,
  listarUsuariosQuerySchema,
} from "@sicog/shared-validators";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { parseOrThrow } from "../../../shared/http.js";
import { usuarioService } from "../services/usuario.service.js";

export const crear = async (req: Request, res: Response): Promise<void> => {
  const input = parseOrThrow(crearUsuarioSchema, req.body);
  res.status(201).json(await usuarioService.crear(input));
};

export const listar = async (req: Request, res: Response): Promise<void> => {
  const query = parseOrThrow(listarUsuariosQuerySchema, req.query);
  res.json(await usuarioService.listar(query));
};

export const obtener = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.json(await usuarioService.obtener(id));
};

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const input = parseOrThrow(actualizarUsuarioSchema, req.body);
  res.json(await usuarioService.actualizar(id, input, usuarioActual(req).id));
};

export const establecerBloqueo = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const { bloqueado } = parseOrThrow(bloqueoUsuarioSchema, req.body);
  res.json(await usuarioService.establecerBloqueo(id, bloqueado, usuarioActual(req).id));
};

// 201: cada reinicio crea una contraseña temporal nueva. La respuesta es la
// única vez que esa contraseña existe en claro.
export const reiniciarPassword = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.status(201).json(await usuarioService.reiniciarPassword(id));
};
