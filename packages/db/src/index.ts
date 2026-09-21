export { Prisma, PrismaClient } from "@prisma/client";
export { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Los catálogos generados desde los archivos fuente, para que los scripts de
// carga los consuman sin alcanzar dentro de prisma/.
export { FALLAS_SEED, type FallaSeed } from "../prisma/fallas.seed.js";
