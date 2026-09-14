"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // El cliente se crea dentro del componente y no como módulo suelto: uno
  // global se compartiría entre peticiones al renderizar en el servidor, y con
  // él los datos de una persona se le podrían mostrar a otra.
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Un 401 no se reintenta: `api()` ya intentó renovar la sesión y,
            // si llegó acá, es que la sesión murió de verdad.
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}
