# Contexto del Proyecto — SICOG (Sistema de Control Operacional de Gas, PDVSA Gas)
*Generado para continuar el proyecto en Claude Code / otra sesión. Reemplaza al resumen anterior (`Resumen_Proyecto_Control_Operacional_Gas.md`).*

**Nombre oficial del sistema: SICOG.** Usar este nombre en el `package.json` raíz del monorepo, título de la app (`web`), y cualquier referencia de marca dentro de la UI (ej. header del login, título de pestaña del navegador).

---

## 1. Objetivo del proyecto

Reemplazar el balance diario de gas natural que actualmente se lleva manualmente en Excel (`NUEVO_BALANCE_ACTUALIZADO.xlsm`) en la Gerencia de Control Operacional / Despacho Central de PDVSA Gas, mediante una aplicación web.

**Importante**: la carga de datos NO es por importación de archivos Excel — es **transcripción manual**. Los analistas digitan directamente en la aplicación, igual que hoy digitan en el Excel.

---

## 2. Rol del asistente / reglas de trabajo

- Actúa como experto en la industria del gas en Venezuela + experto en desarrollo de software, asesor del desarrollo de esta aplicación.
- **Preferir simplicidad sobre sobre-diseño** — ya se revirtió una vez un modelo más complejo de `ESTACION` (con UTM, telemetría, etc. metido en Despacho quando en realidad era de Mantenimiento).
- Diagramas ER siempre en **Mermaid** (`erDiagram`).
- **Preguntar antes de asumir** reglas de negocio no confirmadas — nunca rellenar vacíos con suposiciones.
- **No mezclar dominios** (Despacho, Mantenimiento, Calidad de Gas, Análisis Operacional) aunque compartan base de datos. Catálogos verdaderamente transversales (`USUARIO`, `REGION_MTTO` reutilizada por Actividades) se comparten por referencia, no se duplican.
- Cualquier cambio a un modelo ya confirmado se presenta como **propuesta explícita (diff conceptual)**, nunca se sobrescribe silenciosamente.
- No incluir datos personales sensibles de empleados (cédula, fecha de nacimiento, dirección, tallas) en el modelo ni reproducirlos en el chat.
- Seguridad como **prioridad uno** en cualquier decisión de arquitectura de software.

---

## 3. Stack técnico confirmado

| Capa | Tecnología |
|---|---|
| Frontend | Next.js (App Router), responsive, **shadcn/ui**, **TanStack Table** (data tables), **TanStack Query** (fetching/cache) |
| Formularios | **react-hook-form + zod**, schemas de zod compartidos con el backend |
| Backend | Node.js + **Express.js** |
| ORM | **Prisma** — aislado exclusivamente en la capa Repository, nunca importado directamente en Services/Controllers |
| Base de datos | **PostgreSQL** — nombre: `ctrl_operacional_gas`, con **pgvector** habilitado desde el script inicial (para RAG Fase 2). **Desarrollo**: instancia gestionada por **Supabase** (Postgres + pgvector nativo; Prisma usa conexión pooled `DATABASE_URL` en runtime y directa `DIRECT_URL` para migraciones). **Producción**: contenedor `postgres` del stack Coolify (ver fila Despliegue) |
| Arquitectura | Controller → Service → Repository (no MVC "puro") |
| Monorepo | **pnpm workspaces** |
| Despliegue | Un solo stack vía **Coolify** (docker-compose): `web`, `api`, `postgres`. `ollama` se agrega solo cuando arranque la Fase 2 RAG, no antes |
| Principios obligatorios | **SOLID** en la aplicación, **ACID** en la base de datos |

**Aplicación de SOLID/ACID:**
- SRP: Controller traduce HTTP↔Service; Service tiene la lógica de negocio; Repository solo persiste.
- OCP/DIP: Services dependen de interfaces de Repository (`IUsuarioRepository`, etc.), nunca de Prisma directamente. Si se necesita SQL crudo (queries agregadas tipo "Balance Nación" o el "REAL" de Actividades), va dentro del Repository vía `$queryRaw` parametrizado (nunca concatenación de strings).
- ACID: transacciones para cargas de balance, constraints (`CHECK`, `UNIQUE`, `FK`), aislamiento `SERIALIZABLE` en cierre de turno, triggers de auditoría.

**Convención de nombres Prisma/BD (confirmada):**
- Modelos Prisma: PascalCase singular (`Usuario`, `LecturaBalance`); campos: camelCase, mapeados a snake_case singular en la columna física vía `@map` (`clienteId` → `cliente_id`).
- Tablas físicas: snake_case, primera palabra del nombre en plural vía `@@map` (`usuarios`, `lecturas_balance`, `regiones_operativa`).

### Estructura del monorepo

```
ctrl-operacional-gas/
  apps/
    web/                    → Next.js
    api/                    → Express
      src/modules/
        despacho/            → controllers/ services/ repositories/
        mantenimiento/
        actividades/
        auth/
        calidad-gas/          ← carpeta mínima, se llena al diseñar Dominio C
        analisis-operacional/  ← carpeta mínima, se llena al diseñar Dominio D
      src/shared/            → middlewares, prisma-client.ts, domain types
  packages/
    db/                      → schema.prisma
    shared-types/            → DTOs compartidos
    shared-validators/       → schemas de zod (frontend + backend)
  docker-compose.yml
```

### Seguridad (prioridad uno)
- bcrypt costo 12 para contraseñas.
- JWT: access token 15 min, refresh token 7 días en cookie `httpOnly` + `secure` + `sameSite: strict`. Refresh guardado en tabla Postgres (`SESION_REFRESH`), no en Redis — menos piezas expuestas para 10 usuarios simultáneos.
- Rotación de secreto JWT: **pospuesta** para cuando el sistema esté en producción estable (no es prioridad ahora, pero queda documentada como mejora futura: mantener lista corta de secretos válidos con expiración para rotar sin downtime).
- Rate limiting en login (`express-rate-limit`, ~5 intentos / 15 min).
- Bloqueo de cuenta: `USUARIO.bloqueado boolean` — **desbloqueo manual exclusivo del superadmin**, no automático por tiempo.
- RBAC validado **en el backend siempre**, nunca solo en frontend (frontend = UX, backend = autorización real). Middleware centralizado (`requireDepartamento`, `requirePuestoMinimo`).
- `helmet` + CORS restringido al dominio del `web`.
- Usuario de BD de la app con permisos mínimos (sin `SUPERUSER`); migraciones con usuario aparte más privilegiado.
- Nunca loguear contraseñas/tokens/body de login.
- Auditoría de seguridad: login (IP, timestamp), intentos de autorización fallidos (`LOG_INTENTO_NO_AUTORIZADO`), además de los `*_HISTORIAL` ya definidos por integridad de datos.

---

## 4. Dominios del sistema (misma base de datos, sin relación funcional entre sí en los datos operativos)

- **Dominio A — Despacho**: balance diario, fuentes de gas, novedades operativas, contactos, quema nacional. **CERRADO.**
- **Dominio B — Mantenimiento**: estaciones T&D, instrumentación, telemetría semanal. **CERRADO** (incluye rediseño de telemetría de esta sesión).
- **Dominio E — Actividades y Horas-Hombre**: módulo transversal, un botón/sección por departamento, con catálogos propios por departamento. **CERRADO** (basado en `ACTIVIDADES_MDC_FINAL_V4.xls`, estructura de Mantenimiento; los otros 3 departamentos comparten estructura pero con su propio catálogo de `INSUMO`/`PRODUCTO_SERVICIO`, aún no levantado).
- **Autorización / `USUARIO`**: jerarquía de departamentos y puestos. **CERRADO.**
- **Dominio C — Calidad de Gas**: **PENDIENTE**, falta el Excel dedicado. Preview de parámetros físico-químicos disponible vía `Plantilla_Standar_2.pptx` (composición química, poder calorífico, límites Resolución 162 MENPET).
- **Dominio D — Análisis Operacional**: **PENDIENTE**, sin Excel ni especificación aún.

---

## 5. Archivos ya analizados

| Archivo | Qué es | Estado |
|---|---|---|
| `NUEVO_BALANCE_ACTUALIZADO.xlsm` | Balance diario real (8 hojas). Auditado contra el ERD de Despacho — consistente, sin gaps. Hoja `GUIA WEB` confirmó que Empresas Mixtas/LIC se comportan como `CLIENTE`. | Analizado a fondo, base y auditoría del Dominio A. |
| `INVENTARIO_ESTACIONES.xls` | 251 estaciones T&D. Auditado: confirma el catálogo real de 6 regiones de Mantenimiento (Nor-Oriente, Este-Oriente, Sur-Oriente, Centro, Centro-Occidente, Occidente), 16 tipos de instrumento ISA, `tipo_enlace_com` cerrado a 3 valores (IP PDVSA, SATELITAL, SERIAL PDVSA). | Base y auditoría del Dominio B. |
| `DISPON_SISUGAS_Semana_35.xls` | Reporte semanal de disponibilidad/telemetría real (6 hojas). Reveló que el estatus de telemetría real tiene 4 dimensiones independientes por estación (Comunicación, Eléctrico, Instrumentación, Caseta), no un solo campo — forzó el rediseño de `REPORTE_TELEMETRIA_ESTACION`. | Usado para rediseñar telemetría. |
| `ACTIVIDADES_MDC_FINAL_V4.xls` | Formato real de control de horas-hombre y actividades de Mantenimiento (bitácora + plan/real + % derivados). Estructura genérica reutilizable por los 4 departamentos; catálogos (`INSUMO`, `PRODUCTO_SERVICIO`) varían por departamento. | Base del módulo Actividades. |
| `Plantilla_Standar_2.pptx` | Manual técnico: 8 sistemas de transporte reales, puntos de entrega/recepción, calidad de gas por fuente. Confirmó la jerarquía Región→Subregión (opción c) para Oriente. | Seed data, confirmación de jerarquía de regiones. |
| `CLIENTE_Interaction-correccion.pdf` | Correcciones manuscritas al primer ERD. | Aplicadas. |
| `ESTACIONES.accdb` / 16 CSVs exportados | Catálogo de 288 estaciones T&D, bitácora de actividades/indicadores GCO, directorio de contactos. | Resuelto vía CSVs; mayormente Dominio B. |

**Privacidad**: los datos personales sensibles de `PERSONAL.csv` (cédula, fecha de nacimiento, dirección, tallas) **no se replican** en el modelo ni en logs de la aplicación.

---

## 6. Decisiones clave confirmadas (no rediseñar sin volver a preguntar)

1. Nombre de la BD: `ctrl_operacional_gas`.
2. ~~Balance diario: 2 cortes al día (puntual y cierre_promedio), digitados independientemente~~ **Corregido, ver decisión #34**: el cierre_promedio ya no se digita aparte, se deriva del historial de correcciones del puntual del día.
3. Registro "cerrado" puede ser corregido por cualquier analista — de ahí la obligatoriedad del historial de auditoría.
4. `LECTURA_FUENTE`: sin campos `procesado`/`residual` (el volumen del corte ya representa lo procesado).
5. "Desvío" no es campo numérico — es una fuente más dentro de `FUENTE` (ej. "Desvío – Ventas Directas").
6. `NOVEDAD_OPERATIVA` tiene `tipo` (catálogo, ver punto 20) e `impacto` (texto descriptivo, no escala).
7. `SISTEMA` aplica tanto a `FUENTE` como a `CLIENTE`.
8. `ESTACION` es simple (no UTM/telemetría en Despacho) — eso es Dominio B. `FUENTE` es simple: `id`, `nombre`, `sistema_id`.
9. Módulo Actividades/Indicadores GCO es parte del sistema, sin relación funcional con Despacho.
10. Datos personales sensibles NO se replican.
11. Autenticación: `USUARIO.nombre` único (login), `password_hash` (bcrypt), gestión exclusiva del superadmin, sin auto-registro.
12. Relación Cliente↔Fuente vía `SISTEMA`: un cliente pertenece a un solo sistema (`CLIENTE.sistema_id`).
13. `LECTURA_FUENTE` tiene auditoría igual que `LECTURA_BALANCE` (`estado` + `*_HISTORIAL`).
14. Quema de gas a nivel nacional, tabla `QUEMA_NACIONAL` (`fecha`, `tipo_corte`, `mmpced`), digitado manualmente. **El mismo mecanismo puntual/cierre_promedio de la decisión #34 aplica aquí** (tiene su propio `QUEMA_NACIONAL_HISTORIAL`).
15. "Balance Nación" es **query-calculado**, no tabla nueva.
16. Catálogo `SISTEMA` real: 9 sistemas (ANACO-JOSE-ORIENTE, NOR ORIENTE/SINORGAS, PUERTO ORDAZ, CENTRO-CARACAS, CENTRO/OCCIDENTE, COSTA OESTE, COSTA ESTE, ULE-AMUAY, ENTREGAS DIRECTAS OCC).
17. Regiones operativas de Despacho (`REGION_OPERATIVA`): 4 — Oriente, Centro, Centro-Occidente, Occidente.
18. **Jerarquía de regiones de Mantenimiento confirmada (opción c)**: `REGION_OPERATIVA` (4, Despacho) es la región madre; `REGION_MTTO` (6, Mantenimiento) es más granular — Oriente se subdivide en Nor-Oriente / Sur-Oriente / Este-Oriente; Centro, Centro-Occidente y Occidente son 1:1 con su región madre. Confirmado con datos reales de `INVENTARIO_ESTACIONES.xls`, `DISPON_SISUGAS` y `Plantilla_Standar_2.pptx`.
19. **`ACTIVIDAD_REGISTRO.region_id` reutiliza `REGION_MTTO`** (nullable = alcance nacional), en vez de crear una tabla `SUBREGION` duplicada — misma fuente de verdad para ambos dominios.
20. Empresas Mixtas/LIC (Petro Monagas, Mavegas, Bitor, Petropiar, Petro Delta, Gas Guárico, Ypergas) se modelan como **`CLIENTE`** (`tipo_sector = 'Empresa Mixta'`), confirmado con evidencia de `NUEVO_BALANCE_ACTUALIZADO.xlsm` hoja `GUIA WEB`.
21. Departamentos (4, cada usuario pertenece a exactamente uno, excepto Gerente/Superadmin): Despacho, Mantenimiento, Análisis Operacional, Calidad de Gas.
22. Visibilidad general: cualquier usuario **consulta** cualquier departamento; solo **edita** el suyo.
23. Jerarquía organizacional: Gerente (1, cubre los 4) → Superintendente de Despacho (Despacho+Mantenimiento) / Superintendente de Análisis (Calidad de Gas+Análisis Operacional) → Supervisor (uno por depto) → Ingeniero / Analista (**dos cargos distintos, misma jerarquía** — confirmado).
24. Pares Superintendente↔Departamentos son **fijos** (no reasignables) — confirmado.
25. En el módulo de Actividades, un superior ve **toda la cadena hacia abajo** (no solo un nivel) — confirmado.
26. `USUARIO.rol` (obsoleto) se **reemplaza por completo** por `puesto_id` + `departamento_id` — confirmado.
27. `DEPARTAMENTO`, `PUESTO`, `SUPERINTENDENCIA_DEPARTAMENTO` (tabla puente superintendente↔departamento) ya modeladas y cerradas — ver ERD sección 7.
28. **Rediseño de `REPORTE_TELEMETRIA_ESTACION`**: 4 dimensiones independientes vía FK a `ESTADO_TELEMETRIA` (Comunicación, Eléctrico, Instrumentación, Caseta) en vez de un solo enum. `SISTEMA DE CONTROL LOCAL` → dimensión `INSTRUMENTACION` (se refiere al PLC). `AFECTACION POR HURTO` → valor dentro de `ELECTRICO`. "Esperando reporte" **no se guarda** — se calcula por ausencia de fila en la semana. `detalle_medicion` y `observacion` quedan como texto libre.
29. `ESTATUS` de `ACTIVIDAD_REGISTRO`: catálogo cerrado de 3 — **RECIBIDO → EN PROCESO → FINALIZADO**.
30. `ACTIVIDAD_META` (plan anual de horas-hombre): la carga el **Supervisor** de cada departamento, **una vez al año** (una fila por `producto_servicio_id` + mes).
31. **Gobernanza de catálogos "de negocio"** (`INSUMO`, `PRODUCTO_SERVICIO`, `ESTADO_TELEMETRIA`, `GERENCIA_REQUIRIENTE`, `ESTATUS` de Actividades, y `NOVEDAD_OPERATIVA.tipo` como candidato futuro): administrados por **Supervisor de su propio departamento hacia arriba** (Supervisor, Superintendente, Gerente) — nunca Superadmin (no conoce el dominio) ni cualquier Analista (riesgo de duplicados, ya visto en los Excel reales con "OPERATIVA" vs "OPERATIVO"). **Soft-delete** (`activo boolean`), nunca borrado físico, para no romper reportes históricos.
32. Distinción ENUM técnico vs. catálogo editable: ENUM de base de datos solo para campos **estructurales** (el sistema ramifica lógica según el valor, ej. `tipo_corte`, `tipo_red`, `dimension` de `ESTADO_TELEMETRIA`); catálogo editable en tabla para listas **de negocio** que crecen sin tocar código (estados, tipos de actividad, insumos).
33. **Nombre oficial del sistema: SICOG** (Sistema de Control Operacional de Gas) — elegido por no chocar con nombres de sistemas reales ya existentes en la operación (`SISUGAS`, `WEBGAS`, `Infoplus21`) y por no favorecer a un solo dominio.
34. **Mecánica real de PUNTUAL/CIERRE_PROMEDIO** (corrige la decisión #2, aplica igual a `LECTURA_BALANCE` y `QUEMA_NACIONAL` — ver #14): el valor `PUNTUAL` de un cliente/fecha (o de la quema nacional/fecha) se puede corregir varias veces durante el día; cada corrección genera una fila en su propio `*_HISTORIAL` (mecanismo ya existente, reusado tal cual). Al cumplirse las 24 horas se calcula `CIERRE_PROMEDIO` como la **media aritmética simple** (no ponderada por el tiempo que cada valor estuvo vigente) de todos los valores que tuvo el `PUNTUAL` ese día — el historial de ese día más el valor final vigente —, y **se guarda como fila propia** (no es query-calculado como "Balance Nación", decisión #15, porque alimenta el informe formal de cierre). El `PUNTUAL` del día siguiente **arranca con el último valor del día anterior** (carry-forward), nunca en blanco — ese arranque es lógica de Service, no cambia el schema.
35. **Se elimina el campo `estado` (Cerrado/Pendiente) de `LECTURA_BALANCE` y `LECTURA_FUENTE`, y `estado_ant` de sus respectivos `*_HISTORIAL`** — corrige las decisiones #13 y #34 en este punto específico. Motivo: (a) no existe columna equivalente en ninguna de las hojas reales auditadas de `NUEVO_BALANCE_ACTUALIZADO.xlsm`, era una suposición previa sin evidencia; (b) el registro "cerrado" nunca restringe edición (decisión #3, cualquier analista corrige cualquier registro), por lo que el campo no gatilla ninguna regla de negocio real; (c) tras la decisión #34, `CIERRE_PROMEDIO` se deriva automáticamente a las 24h, lo que reduce aún más la utilidad de un estado manual. El historial de auditoría (`*_HISTORIAL`) sigue siendo obligatorio — esto no cambia, solo se retira el campo `estado` en sí. **Impacto**: actualizar `schema.prisma` (quitar `estado`/`estadoAnt` de `LecturaBalance`, `LecturaBalanceHistorial`, `LecturaFuente`, `LecturaFuenteHistorial`) y, si ya se generó, la migración de Prisma. **Hecho.**
36. **`CLIENTE.tipo_sector` deja de ser `String` libre y se convierte en catálogo editable `SECTOR_CLIENTE`** (`id`, `nombre`, `activo`) — mismo patrón de gobernanza de la decisión #31 (editable por Supervisor+ de Despacho, soft-delete, nunca borrado físico). Corrige la decisión #20 en este punto específico: el valor `'Empresa Mixta'` pasa de ser un literal string a una fila del catálogo (`CLIENTE.sector_id FK → SECTOR_CLIENTE`), sin cambiar el hecho ya confirmado de que Empresas Mixtas/LIC se modelan como `CLIENTE`. **Motivo**: la auditoría de `NUEVO_BALANCE_ACTUALIZADO.xlsm` (hoja `EJECUTIVO PUNTUAL`, tabla "CONSUMO POR SECTORES") reveló que `tipo_sector` en la práctica tiene una lista real de valores de negocio que crece — **Petrolero, Eléctrico, Siderúrgico, Petroquímico, Cemento, Otros** (6, confirmados leyendo las fórmulas de la hoja, no solo los valores) además de `Empresa Mixta` — mismo riesgo de typos ("OPERATIVA" vs "OPERATIVO") que motivó volver catálogo a `INSUMO`/`ESTADO_TELEMETRIA`. **Hecho** en `schema.prisma`.
37. **Reporte "Consumo por Sectores" confirmado en el alcance de Despacho** — total de gas por `SECTOR_CLIENTE` y por `REGION_OPERATIVA`. Es **query-calculado**, mismo patrón que "Balance Nación" (decisión #15): `SUM(LECTURA_BALANCE.volumen_mmpced)` agrupado por `CLIENTE.sector_id` y `CLIENTE.region_id`. No requiere tabla nueva — vive como query agregada en el Repository de Despacho cuando se diseñen los endpoints (§9.4 #10).
38. **"Quema Puntual" y "Quema TyD" son el mismo dato — resuelve el pendiente §9.6 #6 con evidencia, no con suposición.** Auditando las fórmulas activas de `NUEVO_BALANCE_ACTUALIZADO.xlsm`: `EJECUTIVO PUNTUAL!G31` ("QUEMA TYD", vista puntual) y `PROMEDIO!G49` ("QUEMA TYD", vista de cierre) apuntan ambas a `=FUENTES!I29`, la celda justo debajo de la etiqueta `"QUEMA PUNTUAL"` (`FUENTES!I28`). Es decir, "Quema Puntual" es la etiqueta del dato de entrada y "Quema TyD" es solo cómo se referencia ese mismo número en las vistas puntual/cierre — confirma que la decisión #14/#34 (`QUEMA_NACIONAL` con `tipo_corte` PUNTUAL/CIERRE_PROMEDIO) ya estaba bien diseñada. **No requiere cambio de schema.** También se confirmó que "QUEMA TYD" aparece en la misma fila que la tabla "CONSUMO POR SECTORES" solo por diseño visual de la hoja — la fórmula prueba que no es una suma de esos sectores ni tiene relación matemática con ellos (son dos datos independientes que casualmente comparten espacio en la hoja).

---

## 7. ERD consolidado (vigente)

```mermaid
erDiagram
  %% ===== DOMINIO A: DESPACHO =====
  REGION_OPERATIVA ||--o{ CLIENTE : agrupa
  SISTEMA ||--o{ FUENTE : ubica
  SISTEMA ||--o{ CLIENTE : distribuye
  SECTOR_CLIENTE ||--o{ CLIENTE : clasifica
  CLIENTE ||--o{ LECTURA_BALANCE : tiene
  USUARIO ||--o{ LECTURA_BALANCE : digita
  LECTURA_BALANCE ||--o{ LECTURA_BALANCE_HISTORIAL : genera
  USUARIO ||--o{ LECTURA_BALANCE_HISTORIAL : modifica
  FUENTE ||--o{ LECTURA_FUENTE : tiene
  USUARIO ||--o{ LECTURA_FUENTE : digita
  LECTURA_FUENTE ||--o{ LECTURA_FUENTE_HISTORIAL : genera
  USUARIO ||--o{ LECTURA_FUENTE_HISTORIAL : modifica
  CLIENTE ||--o{ NOVEDAD_OPERATIVA : "puede originar"
  FUENTE ||--o{ NOVEDAD_OPERATIVA : "puede originar"
  USUARIO ||--o{ NOVEDAD_OPERATIVA : registra
  CLIENTE ||--o{ CONTACTO : "puede tener"
  FUENTE ||--o{ CONTACTO : "puede tener"
  USUARIO ||--o{ QUEMA_NACIONAL : digita
  QUEMA_NACIONAL ||--o{ QUEMA_NACIONAL_HISTORIAL : genera
  USUARIO ||--o{ QUEMA_NACIONAL_HISTORIAL : modifica

  %% ===== DOMINIO B: MANTENIMIENTO =====
  REGION_MTTO ||--o{ AREA_MTTO : agrupa
  AREA_MTTO ||--o{ ESTACION : agrupa
  ESTACION ||--o{ ESTACION_INSTRUMENTO : tiene
  TIPO_INSTRUMENTO ||--o{ ESTACION_INSTRUMENTO : clasifica
  ESTACION ||--o{ REPORTE_TELEMETRIA_ESTACION : genera
  USUARIO ||--o{ REPORTE_TELEMETRIA_ESTACION : digita
  ESTADO_TELEMETRIA ||--o{ REPORTE_TELEMETRIA_ESTACION : "clasifica (x4 FKs)"

  %% ===== DOMINIO E: ACTIVIDADES / HORAS-HOMBRE (transversal, sin relación funcional con A/B) =====
  DEPARTAMENTO ||--o{ INSUMO : clasifica
  DEPARTAMENTO ||--o{ GERENCIA_REQUIRIENTE : clasifica
  INSUMO ||--o{ PRODUCTO_SERVICIO : agrupa
  PRODUCTO_SERVICIO ||--o{ ACTIVIDAD_REGISTRO : detalla
  PRODUCTO_SERVICIO ||--o{ ACTIVIDAD_META : planifica
  USUARIO ||--o{ ACTIVIDAD_REGISTRO : ejecuta
  GERENCIA_REQUIRIENTE ||--o{ ACTIVIDAD_REGISTRO : solicita
  REGION_MTTO ||--o{ ACTIVIDAD_REGISTRO : "ubica (nullable = nacional, catálogo reutilizado de Mantenimiento)"

  %% ===== AUTORIZACIÓN =====
  DEPARTAMENTO ||--o{ USUARIO : clasifica
  PUESTO ||--o{ USUARIO : ocupa
  USUARIO ||--o{ USUARIO : "supervisa / es cubierto por"
  DEPARTAMENTO ||--o{ SUPERINTENDENCIA_DEPARTAMENTO : cubre
  USUARIO ||--o{ SUPERINTENDENCIA_DEPARTAMENTO : cubre

  %% ===== SEGURIDAD (materializada al escribir schema.prisma, no dibujada antes) =====
  USUARIO ||--o{ SESION_REFRESH : tiene
  USUARIO ||--o{ LOG_LOGIN : intenta
  USUARIO ||--o{ LOG_INTENTO_NO_AUTORIZADO : genera

  %% ===== ENTIDADES =====
  REGION_OPERATIVA { int id PK
    string nombre }
  SISTEMA { int id PK
    string nombre }
  CLIENTE { int id PK
    int region_id FK
    int sistema_id FK
    int sector_id FK
    string nombre }
  SECTOR_CLIENTE { int id PK
    string nombre "catálogo editable por Supervisor+ de Despacho: Empresa Mixta, Petrolero, Eléctrico, Siderúrgico, Petroquímico, Cemento, Otros"
    boolean activo }
  FUENTE { int id PK
    int sistema_id FK
    string nombre }
  USUARIO { int id PK
    string nombre UK
    string password_hash
    int puesto_id FK
    int departamento_id "FK, nullable (Gerente/Superadmin)"
    int supervisor_id "FK a USUARIO, nullable"
    boolean bloqueado }
  LECTURA_BALANCE { bigint id PK
    int cliente_id FK
    date fecha
    string tipo_corte
    numeric volumen_mmpced
    int usuario_id FK }
  LECTURA_BALANCE_HISTORIAL { bigint id PK
    bigint lectura_id FK
    numeric volumen_mmpced_ant
    int usuario_id FK
    timestamp modificado_en }
  LECTURA_FUENTE { bigint id PK
    int fuente_id FK
    date fecha
    numeric volumen_mmpced
    int usuario_id FK }
  LECTURA_FUENTE_HISTORIAL { bigint id PK
    bigint lectura_fuente_id FK
    numeric volumen_mmpced_ant
    int usuario_id FK
    timestamp modificado_en }
  QUEMA_NACIONAL { bigint id PK
    date fecha
    string tipo_corte
    numeric mmpced
    int usuario_id FK }
  QUEMA_NACIONAL_HISTORIAL { bigint id PK
    bigint quema_nacional_id FK
    numeric mmpced_ant
    int usuario_id FK
    timestamp modificado_en }
  NOVEDAD_OPERATIVA { bigint id PK
    int cliente_id FK
    int fuente_id FK
    enum tipo "lista aún sin cerrar del todo, incluye 'Corrida de Pig'; candidato a pasar a catálogo editable"
    text impacto
    timestamp inicio
    timestamp fin
    string causa
    numeric mmpced_afectados
    int usuario_id FK }
  CONTACTO { int id PK
    int cliente_id FK
    int fuente_id FK
    string nombre_operador
    string telefono }

  REGION_MTTO { int id PK
    string nombre "6 valores reales: Nor-Oriente, Este-Oriente, Sur-Oriente, Centro, Centro-Occidente, Occidente" }
  AREA_MTTO { int id PK
    int region_id FK
    string nombre }
  ESTACION { int id PK
    int area_id FK
    string nombre
    string nodo UK
    string tipo_enlace_com "catálogo cerrado real: IP PDVSA, SATELITAL, SERIAL PDVSA"
    enum tipo_red "T | D" }
  TIPO_INSTRUMENTO { int id PK
    string nombre }
  ESTACION_INSTRUMENTO { int id PK
    int estacion_id FK
    int tipo_instrumento_id FK
    int cantidad }
  ESTADO_TELEMETRIA { int id PK
    enum dimension "COMUNICACION | ELECTRICO | INSTRUMENTACION | CASETA (estructural, fijo)"
    string nombre "catálogo editable por Supervisor+ de Mantenimiento"
    boolean activo }
  REPORTE_TELEMETRIA_ESTACION { bigint id PK
    int estacion_id FK
    date fecha_reporte
    int estado_comunicacion_id FK
    int estado_electrico_id FK
    int estado_instrumentacion_id FK
    int estado_caseta_id FK
    text detalle_medicion
    text observacion
    int usuario_id FK }

  DEPARTAMENTO { int id PK
    string nombre "Despacho, Mantenimiento, Calidad de Gas, Análisis Operacional" }
  PUESTO { int id PK
    string nombre "Gerente, Superintendente, Supervisor, Ingeniero, Analista" }
  SUPERINTENDENCIA_DEPARTAMENTO { int id PK
    int superintendente_id FK
    int departamento_id FK }

  INSUMO { int id PK
    int departamento_id FK
    string nombre
    boolean activo }
  PRODUCTO_SERVICIO { int id PK
    int insumo_id FK
    string nombre
    text descripcion_actividad
    boolean activo }
  ACTIVIDAD_REGISTRO { bigint id PK
    int producto_servicio_id FK
    int usuario_id FK
    int region_id "FK a REGION_MTTO, nullable = nacional"
    date fecha_desde
    date fecha_hasta
    int cantidad
    numeric hh
    int gerencia_requiriente_id FK
    string estatus "catálogo: RECIBIDO, EN PROCESO, FINALIZADO"
    text detalle }
  ACTIVIDAD_META { bigint id PK
    int producto_servicio_id FK
    int anio
    int mes
    int cantidad_meta
    numeric hh_meta }
  GERENCIA_REQUIRIENTE { int id PK
    int departamento_id FK
    string nombre
    boolean activo }

  SESION_REFRESH { bigint id PK
    int usuario_id FK
    string token_hash UK "hash del refresh token, nunca en claro"
    timestamp expira_en
    timestamp creado_en
    timestamp revocado_en "nullable"
    string ip "nullable"
    string user_agent "nullable" }
  LOG_LOGIN { bigint id PK
    int usuario_id "FK, nullable si el nombre de usuario no existe"
    string nombre
    boolean exitoso
    string ip
    timestamp creado_en }
  LOG_INTENTO_NO_AUTORIZADO { bigint id PK
    int usuario_id FK
    string ruta
    string motivo
    string ip
    timestamp creado_en }
```

---

## 8. Prototipo visual (previo, requiere actualización)

- React funcional (sin backend), 8 vistas: Login, Balance Diario, Lectura de Fuentes, Novedades Operativas, Contactos, Estaciones, Reporte de Telemetría, Reportes, Gestión de Usuarios.
- Estética "sala de control": fondo azul-tinta oscuro, tipografía monoespaciada en valores numéricos, reloj de turno en vivo.
- Ubicado en el repo hermano `../SIGCO-GAS-Prototipo-v1/control-operacional-prototipo.jsx` (Vite + React + Tailwind, ya inicializado como git repo aparte). **Pendiente**: reflejar el rediseño de telemetría, el módulo de Actividades, y la nueva estructura de departamentos/jerarquía. No se ha vuelto a tocar en esta sesión.

---

## 9. PENDIENTES ABIERTOS (actualizado a esta sesión)

### 9.1 Dominios sin diseñar
1. **Dominio C — Calidad de Gas**: falta el Excel dedicado. Preview de parámetros físico-químicos disponible en `Plantilla_Standar_2.pptx`.
2. **Dominio D — Análisis Operacional**: sin Excel ni especificación, alcance funcional totalmente por definir.

### 9.2 Módulo de Actividades
3. Estructura de `INSUMO`/`PRODUCTO_SERVICIO` solo se levantó para **Mantenimiento** (vía `ACTIVIDADES_MDC_FINAL_V4.xls`). Falta el equivalente para Despacho, Calidad de Gas y Análisis Operacional — mismo esquema de tablas, catálogos de valores distintos.
4. Lista cerrada completa del ENUM/catálogo `tipo` de `NOVEDAD_OPERATIVA` (Despacho, ya tiene "Corrida de Pig", faltan los demás valores) — candidato a pasar a catálogo editable siguiendo el mismo patrón que se aplicó a Actividades y Telemetría.

### 9.3 Mantenimiento / histórico
5. `SOLICITANTE` en actividades del Access viejo (campo texto libre) — ¿normalizar a FK? (bajo prioridad, dato histórico).

### 9.6 Despacho — verificar
6. ~~"Quema Puntual" vs. "Quema TyD"~~ **Resuelto, ver decisión #38** — son el mismo dato (confirmado por fórmula: ambas vistas apuntan a la misma celda origen). No requirió cambio de schema.
7. **Granularidad real del catálogo `FUENTE`**: al revisar la hoja `FUENTES` de `NUEVO_BALANCE_ACTUALIZADO.xlsm` se detectaron entradas más finas de lo esperado — San Joaquín aparece dividido en "Tren A y B" / "Tren C", y hay una sección "Directo a Ventas" con ~8 renglones adicionales (RECAT SJ, SJB FI FII, SOTO, AGUASAY 5A, BAJO GUANIPA, ETSJ, ZAPATO VIEJO, CORREDOR JUSEPIN-CRIOGENICO). No está confirmado si el catálogo `FUENTE` ya contempla esta granularidad o si el "consistente, sin gaps" de la sección 5 se refiere solo a la estructura general — verificar contra el estado actual del catálogo antes de continuar.

### 9.4 Implementación (no son decisiones de negocio)
6. ~~Escribir el `schema.prisma` completo~~ **Hecho** (`packages/db/prisma/schema.prisma`: Dominios A/B/E + Autorización + tablas de seguridad, con `@@unique`/`@@index`). Falta correr la migración inicial contra Supabase (pendiente de credenciales) y generar seed data (ver punto 9).
6b. ~~Sincronizar `schema.prisma` con la decisión #35~~ **Hecho** — se quitó `estado` de `LecturaBalance`/`LecturaFuente` y `estadoAnt` de sus `*Historial`. No existía migración inicial aún, así que no hizo falta una migración correctiva; verificado con `prisma generate` (sin errores) y sin referencias sueltas a esos campos en `apps/web`/`apps/api`.
7. `CHECK` de "exactamente uno" (`cliente_id`/`fuente_id`) en `NOVEDAD_OPERATIVA` y `CONTACTO` — **pendiente**: Prisma no soporta `CHECK` arbitrario declarativo, hay que agregarlo a mano al SQL generado por `prisma migrate dev --create-only` antes de aplicarlo.
8. ~~`UNIQUE(estacion_id, fecha_reporte)` en `REPORTE_TELEMETRIA_ESTACION`~~ **Hecho** en el schema (además de `UNIQUE(cliente_id, fecha, tipo_corte)` en `LECTURA_BALANCE`, `UNIQUE(fuente_id, fecha)` en `LECTURA_FUENTE` y `UNIQUE(producto_servicio_id, anio, mes)` en `ACTIVIDAD_META`, derivadas de las decisiones #2 y #30).
9. Seed data real: 9 sistemas, 4 regiones de Despacho, 6 regiones de Mantenimiento, catálogos iniciales de `INSUMO`/`PRODUCTO_SERVICIO` de Mantenimiento (de `ACTIVIDADES_MDC_FINAL_V4.xls`), valores iniciales de `ESTADO_TELEMETRIA` por dimensión, y `SECTOR_CLIENTE` (Empresa Mixta, Petrolero, Eléctrico, Siderúrgico, Petroquímico, Cemento, Otros — confirmados por fórmula en `NUEVO_BALANCE_ACTUALIZADO.xlsm`, decisión #36).
10. Diseñar endpoints/rutas de la API por módulo.
11. Estructura inicial del monorepo (carpetas y configs) — descrita en sección 3, falta materializarla.
12. Actualizar el prototipo visual con los hallazgos de esta sesión.
13. Rotación de secreto JWT — pospuesta explícitamente, implementar cuando el sistema esté en producción estable.

### 9.5 Fase 2 — RAG
14. Plan definido (Ollama + pgvector, modelo 7-8B cuantizado, CPU puro, vía Coolify — mismo despliegue que la app, contenedor de Ollama se agrega solo cuando arranque esta fase). Falta: RAM real de la VM, y si los manuales de procedimientos ya existen documentados o requieren levantamiento con los analistas.

---

## 10. Próximo paso inmediato

`schema.prisma` y la estructura inicial del monorepo (puntos (a) y (c) de la sesión anterior) están hechos. Falta:
1. El usuario debe crear un proyecto en Supabase y llenar `.env` (raíz) con `DATABASE_URL`/`DIRECT_URL` reales (ver `.env.example`).
2. Correr `pnpm --filter @sicog/db migrate:dev` para generar y aplicar la primera migración — agregar a mano los `CHECK` "exactamente uno" pendientes (§9.4 #7) al SQL antes de aplicarla.
3. Seed data real (§9.4 #9).
4. Diseño de endpoints/rutas de la API por módulo (punto (b), aún no retomado).
