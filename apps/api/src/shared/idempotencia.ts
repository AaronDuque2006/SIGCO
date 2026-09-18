import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { PrismaClientKnownRequestError } from "@sicog/db";
import { ConflictError, UnauthorizedError, ValidationError } from "./errors.js";
import { prisma } from "./prisma-client.js";

/**
 * Hace que un `POST` sin clave natural sea seguro de reintentar.
 *
 * En Despacho no hace falta: todos sus `POST` chocan contra un `@@unique` del
 * propio dato, así que un reintento devuelve `409` solo (§11.1). Este módulo no
 * tiene esa suerte — dos asignaciones idénticas de la misma tarea a la misma
 * persona son legítimas, así que no hay clave natural que inventar—, y sus
 * horas alimentan indicadores de gestión: un duplicado silencioso infla un
 * número que alguien va a reportar.
 *
 * El caso que esto cierra y que **ningún botón deshabilitado cierra**: el
 * `POST` entró, la respuesta se perdió en un timeout, y el navegador no sabe si
 * reintentar. Toda llamada tiene tres finales, no dos: bien, mal, y *no se
 * sabe*.
 */

/** 24 horas. El único camino de re-entrega acá es el reintento de un
 *  navegador; no hay cola ni dead-letter que pueda reponer la misma intención
 *  días después. Si alguna vez se encola este `POST`, esto tiene que crecer
 *  hasta cubrir ese camino. */
const VIGENCIA_MS = 24 * 60 * 60 * 1000;

const huellaDe = (req: Request): string =>
  createHash("sha256")
    .update(`${req.method}\n${req.originalUrl}\n${JSON.stringify(req.body ?? null)}`)
    .digest("hex");

/**
 * Exige la cabecera `Idempotency-Key` y reclama la clave **antes** de dejar
 * pasar la petición.
 *
 * Se exige en vez de aceptarla como opcional: una clave opcional sólo protege
 * a los clientes que se acuerdan de mandarla, y el que no se acuerda es
 * justamente el que va a duplicar.
 */
export const requireIdempotencia = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.usuario) {
    next(new UnauthorizedError());
    return;
  }

  const clave = req.header("Idempotency-Key")?.trim();
  if (!clave || clave.length > 200) {
    next(
      new ValidationError(
        "Falta la cabecera Idempotency-Key, o es demasiado larga. Es obligatoria en este endpoint para que un reintento no duplique el registro.",
      ),
    );
    return;
  }

  const huella = huellaDe(req);
  const usuarioId = req.usuario.id;

  try {
    // Se reclama insertando. Un `SELECT` seguido de un `INSERT` sería una
    // carrera entre dos reintentos simultáneos: el único **es** el mecanismo.
    // El estado arranca en EN_CURSO antes de hacer nada, para que una caída
    // entre el intento y la respuesta deje rastro de algo sin resolver.
    await prisma.claveIdempotencia.create({
      data: {
        clave,
        usuarioId,
        huellaPeticion: huella,
        estado: "EN_CURSO",
        expiraEn: new Date(Date.now() + VIGENCIA_MS),
      },
    });
  } catch (err) {
    if (!(err instanceof PrismaClientKnownRequestError) || err.code !== "P2002") {
      next(err);
      return;
    }

    const previa = await prisma.claveIdempotencia.findUnique({
      where: { clave_usuarioId: { clave, usuarioId } },
    });
    if (!previa) {
      // La clave venció y se limpió entre el choque y esta consulta. Que lo
      // reintente: es el mismo estado que si nunca hubiera existido.
      next(new ConflictError("Reintente la operación."));
      return;
    }

    if (previa.huellaPeticion !== huella) {
      next(
        new ValidationError(
          "Esa Idempotency-Key ya se usó con otro contenido. Use una clave nueva.",
        ),
      );
      return;
    }

    if (previa.estado === "EN_CURSO") {
      // Se rechaza en vez de esperar. Dejar entrar al segundo porque el
      // primero "parece trabado" es exactamente cuando duplicar cuesta más.
      next(new ConflictError("La misma operación está en curso. Reintente en unos segundos."));
      return;
    }

    res.status(previa.estadoHttp ?? 200).json(previa.respuesta);
    return;
  }

  // La respuesta se guarda al vuelo para poder reponerla ante un reintento.
  // Si la petición **no** salió bien, la clave se libera: no se aplicó nada,
  // así que retener la clave sólo impediría corregir y volver a intentar.
  const jsonOriginal = res.json.bind(res);
  res.json = (cuerpo: unknown) => {
    const exito = res.statusCode >= 200 && res.statusCode < 300;
    const guardar = exito
      ? prisma.claveIdempotencia.update({
          where: { clave_usuarioId: { clave, usuarioId } },
          data: {
            estado: "COMPLETADA",
            estadoHttp: res.statusCode,
            respuesta: cuerpo as never,
          },
        })
      : prisma.claveIdempotencia.delete({
          where: { clave_usuarioId: { clave, usuarioId } },
        });

    // No se espera: la respuesta ya está decidida y hacerla esperar por el
    // registro sólo agregaría latencia a lo que el usuario ve.
    void guardar.catch((e: unknown) => {
      console.error("No se pudo cerrar la clave de idempotencia:", e);
    });

    return jsonOriginal(cuerpo);
  };

  next();
};
