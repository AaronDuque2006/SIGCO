import { z } from "zod";

// El login no valida la forma de la contraseña: las reglas de complejidad
// aplican al crearla, no al presentarla. Rechazar acá por formato sólo le
// diría a un atacante qué formas no vale la pena probar.
export const loginSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
