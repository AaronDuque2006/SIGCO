export interface UsuarioDto {
  id: number;
  nombre: string;
  puesto: string;
  // null sólo para Gerente y superadmin (decisión #21).
  departamento: string | null;
  supervisor: { id: number; nombre: string } | null;
  bloqueado: boolean;
  esSuperadmin: boolean;
  // true mientras la persona siga usando la contraseña temporal.
  debeCambiarPassword: boolean;
}

/**
 * Respuesta del alta y del reinicio de contraseña. La temporal viaja **una
 * sola vez**, acá: no se guarda en claro ni existe forma de volver a
 * consultarla. Si se pierde, el superadmin genera otra.
 */
export interface OpcionCatalogoDto {
  id: number;
  nombre: string;
}

/**
 * Catálogos que necesita el formulario de alta: el organigrama real de PDVSA
 * (decisión #23). Van juntos en una sola respuesta porque se piden juntos y
 * son dos listas de cinco y cuatro filas.
 */
export interface CatalogosUsuarioDto {
  puestos: OpcionCatalogoDto[];
  departamentos: OpcionCatalogoDto[];
}

export interface UsuarioConPasswordTemporalDto {
  usuario: UsuarioDto;
  passwordTemporal: string;
  // ISO 8601. Vencida, la temporal deja de servir y hay que reiniciarla.
  passwordExpiraEn: string;
}
