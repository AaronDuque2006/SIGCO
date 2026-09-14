-- Sello de revocación de sesiones.
--
-- Revocar las filas de SESION_REFRESH corta la renovación, pero no el access
-- token que ya fue emitido: es un JWT sin estado, la API no puede retirarlo y
-- sigue valiendo hasta que expire (15 min). O sea que cambiar la contraseña
-- porque alguien más la conocía dejaba viva la sesión ajena ese rato.
--
-- Con esta columna, `requireAuth` rechaza todo token emitido antes de la
-- marca. NULL significa "nunca se revocó nada", que es el estado de arranque.
ALTER TABLE "usuarios" ADD COLUMN "sesiones_invalidas_antes_de" TIMESTAMP(3);
