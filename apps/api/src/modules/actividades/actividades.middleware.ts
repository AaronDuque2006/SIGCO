import type { NextFunction, Request, Response } from "express";
import { autorizacionRepository } from "../auth/repositories/autorizacion.repository.js";
import { sesionRepository } from "../auth/repositories/sesion.repository.js";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../../shared/errors.js";
import { prisma } from "../../shared/prisma-client.js";

/**
 * Editar un catálogo de este módulo exige **Supervisor+ del departamento que
 * lo posee** (decisión #31).
 *
 * No alcanza con `requireDepartamento`, que compara contra un nombre fijo: acá
 * el departamento sale del propio recurso, porque el módulo es transversal y
 * cada departamento tiene su catálogo (decisión #9). Las dos condiciones se
 * exigen **juntas** — igual que la decisión #67 encadena `soloDespacho` con
 * `requireSupervisor` — porque separarlas dejaría que un supervisor de
 * Mantenimiento editara el catálogo de Calidad de Gas.
 *
 * El 403 queda registrado en `LOG_INTENTO_NO_AUTORIZADO`, con el motivo
 * distinguido, igual que los demás.
 */
export const requireSupervisorDelDepartamento =
  (resolverDepartamentoId: (req: Request) => Promise<number | null>) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.usuario) {
      next(new UnauthorizedError());
      return;
    }

    const registrarYRechazar = async (motivo: string, mensaje: string): Promise<void> => {
      await sesionRepository.registrarIntentoNoAutorizado({
        usuarioId: req.usuario!.id,
        ruta: `${req.method} ${req.originalUrl}`,
        motivo,
        ip: req.ip ?? "desconocida",
      });
      next(new ForbiddenError(mensaje));
    };

    try {
      const departamentoId = await resolverDepartamentoId(req);
      if (departamentoId === null) {
        next(new NotFoundError("No existe el recurso"));
        return;
      }

      const departamento = await prisma.departamento.findUnique({
        where: { id: departamentoId },
        select: { nombre: true },
      });
      if (!departamento) {
        next(new NotFoundError("No existe el departamento"));
        return;
      }

      const [cubre, esSupervisor] = await Promise.all([
        autorizacionRepository.puedeEditarDepartamento(req.usuario.id, departamento.nombre),
        autorizacionRepository.esSupervisorOSuperior(req.usuario.id),
      ]);

      if (!cubre) {
        await registrarYRechazar(
          `No pertenece a ${departamento.nombre} ni lo cubre`,
          `No puede editar el catálogo de ${departamento.nombre}`,
        );
        return;
      }
      if (!esSupervisor) {
        await registrarYRechazar(
          "No es Supervisor ni superior",
          "Requiere ser Supervisor o superior",
        );
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
