import { Router, type Request, type Router as RouterType } from "express";
import { z } from "zod";
import { requireAuth, requirePasswordVigente } from "../../shared/auth.middleware.js";
import { asyncHandler } from "../../shared/http.js";
import * as catalogo from "./controllers/catalogo.controller.js";
import { catalogoActividadesRepository as repo } from "./repositories/catalogo.repository.js";
import { requireSupervisorDelDepartamento } from "./actividades.middleware.js";

const router: RouterType = Router();

// Todo el módulo va detrás de las dos puertas comunes: autenticado, y con la
// contraseña ya cambiada (decisión #54). Consultar lo puede hacer cualquiera
// de cualquier departamento (decisión #22); lo que se acota es escribir.
router.use(asyncHandler(requireAuth), asyncHandler(requirePasswordVigente));

const idNumerico = z.coerce.number().int().positive();

/** El departamento que posee el recurso, para la puerta de escritura. Al crear
 *  viene en el cuerpo; al corregir sale de la fila que se va a tocar. */
const delCuerpo = (campo: "departamentoId") => async (req: Request) => {
  const parseo = idNumerico.safeParse((req.body as Record<string, unknown> | null)?.[campo]);
  return parseo.success ? parseo.data : null;
};

const delParametro =
  (buscar: (id: number) => Promise<number | null>) =>
  async (req: Request) => {
    const parseo = idNumerico.safeParse(req.params.id);
    return parseo.success ? buscar(parseo.data) : null;
  };

// ---------------------------------------------------------------------------
// Catálogos. Leer lo puede cualquiera autenticado (decisión #22); escribir
// exige Supervisor+ del departamento dueño (decisión #31).
// ---------------------------------------------------------------------------

router.get("/insumos", asyncHandler(catalogo.listarInsumos));
router.post(
  "/insumos",
  requireSupervisorDelDepartamento(delCuerpo("departamentoId")),
  asyncHandler(catalogo.crearInsumo),
);
router.patch(
  "/insumos/:id",
  requireSupervisorDelDepartamento(delParametro((id) => repo.departamentoDeInsumo(id))),
  asyncHandler(catalogo.actualizarInsumo),
);

router.get("/productos-servicio", asyncHandler(catalogo.listarProductos));
router.post(
  "/productos-servicio",
  // El departamento sale del insumo padre: el producto no lo lleva encima.
  requireSupervisorDelDepartamento(async (req: Request) => {
    const parseo = idNumerico.safeParse((req.body as Record<string, unknown> | null)?.insumoId);
    return parseo.success ? repo.departamentoDeInsumo(parseo.data) : null;
  }),
  asyncHandler(catalogo.crearProducto),
);
router.patch(
  "/productos-servicio/:id",
  requireSupervisorDelDepartamento(delParametro((id) => repo.departamentoDeProducto(id))),
  asyncHandler(catalogo.actualizarProducto),
);

router.get("/gerencias-requirientes", asyncHandler(catalogo.listarGerencias));
router.post(
  "/gerencias-requirientes",
  requireSupervisorDelDepartamento(delCuerpo("departamentoId")),
  asyncHandler(catalogo.crearGerencia),
);
router.patch(
  "/gerencias-requirientes/:id",
  requireSupervisorDelDepartamento(delParametro((id) => repo.departamentoDeGerencia(id))),
  asyncHandler(catalogo.actualizarGerencia),
);

// Sólo lectura: son de Mantenimiento y este módulo las reutiliza (decisión #19).
router.get("/regiones-mtto", asyncHandler(catalogo.listarRegiones));

export default router;
