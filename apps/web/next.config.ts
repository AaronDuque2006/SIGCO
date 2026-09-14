import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los paquetes compartidos se consumen como TypeScript desde `src`, no
  // compilados a `dist`: así la API (que corre con tsx) y el frontend leen
  // exactamente el mismo archivo y no hay que recordar recompilar el contrato
  // antes de usarlo.
  transpilePackages: ["@sicog/shared-types", "@sicog/shared-validators"],
};

export default nextConfig;
