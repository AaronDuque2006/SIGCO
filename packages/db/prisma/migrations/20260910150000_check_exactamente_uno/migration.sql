-- Pendiente desde el diseño original (CONTEXTO_PROYECTO.md §9.4 #7): Prisma no
-- soporta CHECK arbitrario declarativo, así que se agrega a mano. Garantiza
-- que cada NovedadOperativa/Contacto pertenezca exactamente a un cliente o a
-- una fuente, nunca a ambos ni a ninguno.
ALTER TABLE "novedades_operativa" ADD CONSTRAINT "novedades_operativa_cliente_o_fuente_check"
  CHECK ((("cliente_id" IS NOT NULL))::int + (("fuente_id" IS NOT NULL))::int = 1);

ALTER TABLE "contactos" ADD CONSTRAINT "contactos_cliente_o_fuente_check"
  CHECK ((("cliente_id" IS NOT NULL))::int + (("fuente_id" IS NOT NULL))::int = 1);
