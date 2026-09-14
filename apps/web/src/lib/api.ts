import type { ApiErrorBody } from "@sicog/shared-types";

// El navegador nunca ve los tokens: viajan en cookies httpOnly (decisión #49),
// así que toda petición va con `credentials: "include"` y no hay ningún header
// de autorización que armar acá.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const leerError = async (res: Response): Promise<ApiError> => {
  let cuerpo: ApiErrorBody | null = null;
  try {
    cuerpo = (await res.json()) as ApiErrorBody;
  } catch {
    // Una respuesta sin JSON (un 502 del proxy, por ejemplo) no debería
    // reventar acá: se traduce a un error con la misma forma que el resto.
  }
  return new ApiError(
    cuerpo?.error?.code ?? "NETWORK_ERROR",
    cuerpo?.error?.message ?? "No se pudo contactar al servidor.",
    res.status,
    cuerpo?.error?.details,
  );
};

interface Opciones {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  // El refresh y el login no reintentan: si el refresh da 401 es que la sesión
  // murió de verdad, y reintentarlo sería un bucle.
  reintentar?: boolean;
}

const pedir = async (ruta: string, opciones: Opciones = {}): Promise<Response> =>
  fetch(`${BASE}/api${ruta}`, {
    method: opciones.metodo ?? "GET",
    credentials: "include",
    headers: opciones.cuerpo === undefined ? {} : { "Content-Type": "application/json" },
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
  });

/**
 * El access token dura 15 minutos y el refresh 7 días, así que una sesión
 * normal se topa con un 401 cada cuarto de hora. Se renueva y se reintenta una
 * sola vez; si el refresh también falla, el error sube y la pantalla manda a
 * iniciar sesión.
 */
export const api = async <T>(ruta: string, opciones: Opciones = {}): Promise<T> => {
  let res = await pedir(ruta, opciones);

  if (res.status === 401 && opciones.reintentar !== false) {
    const renovado = await pedir("/auth/refresh", { metodo: "POST", reintentar: false });
    if (renovado.ok) res = await pedir(ruta, opciones);
  }

  if (!res.ok) throw await leerError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
};
