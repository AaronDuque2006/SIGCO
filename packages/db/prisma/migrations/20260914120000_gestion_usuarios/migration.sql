-- Gestión de usuarios (decisiones #52-#55).
--
-- `es_superadmin` es un rol de sistema ortogonal al cargo: PUESTO modela el
-- organigrama real de PDVSA (decisión #23) y la decisión #31 deja al
-- superadmin explícitamente fuera del negocio, así que no puede ser un puesto
-- más. Una misma persona puede ser Supervisor de Despacho y superadmin.
ALTER TABLE "usuarios" ADD COLUMN "es_superadmin" BOOLEAN NOT NULL DEFAULT false;

-- Contraseña temporal: se fuerza el cambio en el primer ingreso y vence a las
-- 72 h. `password_expira_en` NULL significa contraseña definitiva (no vence:
-- no hay expiración periódica obligatoria, decisión #52).
ALTER TABLE "usuarios" ADD COLUMN "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "usuarios" ADD COLUMN "password_expira_en" TIMESTAMP(3);

-- Una contraseña definitiva nunca lleva vencimiento, y una temporal siempre
-- lo lleva: las dos columnas describen un solo estado, así que se amarran acá
-- en vez de confiar en que toda la aplicación las escriba coherentes.
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_password_temporal_coherente"
  CHECK (("debe_cambiar_password" = true AND "password_expira_en" IS NOT NULL)
      OR ("debe_cambiar_password" = false AND "password_expira_en" IS NULL));
