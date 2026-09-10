// Ningún token aparece acá a propósito: access y refresh viajan en cookies
// httpOnly, así que el frontend nunca los ve ni los manipula.
export interface UsuarioSesionDto {
  id: number;
  nombre: string;
  puesto: string;
  // null para Gerente/Superadmin, que no pertenecen a un solo departamento.
  departamento: string | null;
  // Sólo para que la UI sepa qué habilitar. La autorización real la resuelve
  // el backend contra la BD en cada request (decisión #22).
  departamentosQueEdita: string[];
}
