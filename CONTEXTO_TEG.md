# SICOG — Contexto para el Trabajo Especial de Grado

> **Para qué sirve este archivo.** Es un dossier autocontenido sobre un sistema
> que ya existe y está construido, pensado para pegarse en una conversación de
> Claude en la web (claude.ai) y trabajar desde ahí los **entregables académicos**
> del trabajo de grado: título, propuesta/anteproyecto, planteamiento del
> problema, objetivos, justificación, marco teórico, marco metodológico, alcance
> y limitaciones.
>
> No es documentación técnica para programar. Todo lo que hace falta saber está
> acá adentro: quien lo lea **no tiene acceso al repositorio ni a los archivos
> fuente**.

---

## 0. Instrucciones para el asistente que lea esto

1. **Todo lo que está en las secciones 1 a 7, 9 y 10 son hechos verificados.** Salieron
   de auditar documentos reales de la empresa y de un sistema efectivamente
   construido y probado contra una base de datos real. No son planes ni
   intenciones.
2. **La sección 11 lista los vacíos.** Son datos académicos e institucionales que
   el autor todavía no ha aportado (universidad, carrera, tutor, normativa de
   presentación, fechas). **No los inventes.** Si un entregable los necesita,
   pregúntalos.
3. **La sección 8 (RAG) es mixta y está marcada internamente.** Distingue lo que
   ya está decidido y preparado en la arquitectura de lo que todavía no se
   decidió. No conviertas lo segundo en lo primero: el módulo **no está
   construido**.
4. **Regla de trabajo heredada del proyecto: preguntar antes de asumir.** Nunca
   rellenar un vacío con una suposición plausible. Si falta un dato, se pide.
5. **Confidencialidad (sección 12).** Hay material que no puede reproducirse en
   el documento de grado.
6. El sistema **ya está construido** — el trabajo de grado documenta y sustenta
   un desarrollo real, no propone uno a futuro. Esto cambia la redacción de
   objetivos y metodología: se describe lo que se hizo, no lo que se hará
   (salvo que la normativa de la institución exija el formato propositivo, dato
   que está en los vacíos).

---

## 1. Identificación del proyecto

| | |
|---|---|
| **Nombre del sistema** | **SICOG** — Sistema de Información para la Gerencia de Control Operacional de Gas (decisión #109) |
| **Organización** | PDVSA Gas — Gerencia de Control Operacional |
| **Unidad usuaria directa** | Despacho Central, y por extensión los departamentos de Mantenimiento, Calidad de Gas y Análisis Operacional |
| **Tipo de producto** | Aplicación web de registro, control y reporte operacional |
| **Estado** | Módulo de Despacho completo y verificado; pendiente de despliegue en producción |
| **Fecha de este corte** | 17 de septiembre de 2026 |

El nombre **SICOG** se eligió deliberadamente para no chocar con los sistemas
que ya existen en la operación real de PDVSA Gas (`SISUGAS`, `WEBGAS`,
`InfoPlus.21` de AspenTech) y para no favorecer a un solo departamento en el
nombre.

---

## 2. El problema real

La Gerencia de Control Operacional de PDVSA Gas lleva el **balance diario de gas
natural** en un libro de Excel con macros (`NUEVO BALANCE ACTUALIZADO.xlsm`, 8
hojas). Ese archivo es hoy el **registro operacional oficial** del despacho de
gas a nivel nacional: en él se registra cuánto gas se recibe de cada fuente de
producción, cuánto se entrega a cada cliente, cuánto se quema, y si el sistema
de transporte quedó empacado o desempacado al cierre del día.

**El trabajo concreto que hoy se hace en Excel:**

- Un analista de turno recorre **111 clientes** y **31 fuentes** cargando
  volúmenes en MMPCED (millones de pies cúbicos estándar por día), de corrido.
- Corrige durante la jornada los valores que cambian; un mismo número puede
  corregirse varias veces en el día.
- Al cerrar el día se produce un valor de cierre que alimenta el informe formal.
- Se registran además novedades operativas, quema nacional y un directorio de
  contactos de operadores.

**Deficiencias concretas de esa situación (todas verificables en el archivo real):**

1. **No hay trazabilidad de correcciones.** Cualquier analista puede corregir
   cualquier número y no queda registro de quién lo cambió, cuándo, ni cuál era
   el valor anterior. En un dato que alimenta un informe formal, esto es una
   pérdida de auditabilidad.
2. **No hay control de acceso.** El archivo no distingue quién puede editar qué.
   La estructura jerárquica real de la gerencia (Gerente → Superintendente →
   Supervisor → Ingeniero / Analista) no tiene ningún reflejo en la herramienta.
3. **Concurrencia no resuelta.** Un libro compartido no impide que dos personas
   se pisen el trabajo.
4. **Reglas de negocio no verificables.** El cálculo del cierre, el arrastre de
   un día al siguiente y la condición de empaque están implementados como
   fórmulas dispersas en celdas, no como reglas explícitas y controladas. Durante
   la auditoría del archivo se encontraron **inconsistencias internas del propio
   libro** (ver sección 9), que nadie había detectado.
5. **Datos transcritos a mano que podrían derivarse.** Por ejemplo, la serie de
   los últimos 7 días que alimenta un gráfico se **teclea manualmente cada día**,
   pudiendo calcularse de lo ya registrado.
6. **Riesgo de pérdida y de versiones paralelas**, inherente a un archivo
   ofimático como registro único.

**Aclaración importante sobre el alcance:** la carga de datos **no es una
importación de archivos** — es transcripción manual. Los analistas digitan los
valores que leen de otras fuentes, igual que hoy digitan en el Excel. SICOG no
automatiza la captura: **sustituye el soporte y le agrega las reglas, el control
y la trazabilidad que el soporte actual no puede dar.**

---

## 3. La solución construida

SICOG es una aplicación web que **reemplaza totalmente** el libro de Excel y pasa
a ser la única fuente del registro operacional. El listón de adopción se fijó
explícitamente: el sistema debe cubrir **todo** lo que el libro hace hoy *antes*
del cambio. Cada función del Excel que SICOG no cubriera sería un bloqueante de
la transición, no una mejora pendiente.

**Lo que aporta que una hoja de cálculo no puede dar:**

- **Reglas de operación codificadas y hechas cumplir**, no descritas en un
  instructivo.
- **Historial obligatorio de correcciones**: cada modificación de un valor deja
  una fila de auditoría con el valor anterior, el usuario y el momento.
- **Autorización real**, resuelta contra la base de datos en cada petición.
- **Derivación automática del cierre diario** mediante un proceso programado.
- **Reportes y gráficos calculados** a partir de lo registrado.

### 3.1 Contexto de uso (relevante para justificar decisiones de diseño)

El entorno es una **sala de control operando por turnos rotativos, incluida
guardia nocturna**, sobre monitores fijos, con la pantalla encendida durante todo
el turno. No es una herramienta que se abre y se cierra. De ahí se derivan
requisitos no funcionales concretos y justificables:

- Tema oscuro fijo, sin modo claro, por legibilidad sostenida durante una
  guardia completa.
- Contraste verificado contra el estándar WCAG AA (15,08:1 para el texto
  principal y 5,63:1 para el texto atenuado sobre la superficie de tarjeta).
- Digitación por teclado sin sacar la mano del teclado: la grilla guarda al salir
  del campo o con Enter y descarta con Escape, porque son cien filas seguidas.
- Ningún rechazo silencioso de datos: si el sistema descarta lo que alguien
  tecleó, lo dice. Un fallo mudo en una grilla de cien filas se descubre al final
  del día, o nunca.
- El **día operativo es el de Venezuela** (`America/Caracas`), no el del reloj
  del servidor: una novedad de las 22:00 pertenece a su día local, no al
  siguiente — y la guardia nocturna es justamente cuando ocurren las cosas.

---

## 4. Dominio de negocio: conceptos que el documento debe explicar

El trabajo de grado necesita un marco conceptual del negocio gasífero. Estos son
los conceptos reales del área, con su significado verificado:

- **MMPCED** — millones de pies cúbicos estándar por día. Unidad de todos los
  volúmenes del sistema.
- **Sistema de transporte de gas** — red troncal de tuberías y estaciones. En
  Venezuela, según el manual oficial de PDVSA Gas, son **7**: Anaco–José–Puerto
  La Cruz–Sinorgas; Anaco–Puerto Ordaz; La Toscana–San Vicente;
  Jusepín–Criogénico; Anaco–Caracas–Barquisimeto–Río Seco; Ulé–Amuay; y
  Transcaribeño.
- **Sub-sistema** — rama de un sistema que el área reporta por separado (p. ej.
  Costa Oeste y Costa Este, ambas dentro de Ulé–Amuay).
- **Fuente** — punto que **aporta** gas al sistema (plantas de extracción,
  criogénicos, empresas mixtas).
- **Cliente** — punto que **consume** gas del sistema, clasificado por sector
  económico (Petrolero, Eléctrico, Siderúrgico, Petroquímico, Cemento, Otros).
- **Corte puntual vs. cierre promedio** — el valor `PUNTUAL` se digita y corrige
  durante la jornada; el `CIERRE_PROMEDIO` es la media aritmética de todos los
  valores que ese dato tuvo durante el día, y alimenta el informe formal.
- **Quema nacional** — volumen de gas quemado, registrado a nivel país.
- **Empaque / desempaque** — condición del sistema de transporte según si se
  recibió más gas del que se entregó (empacado) o menos (desempacado).
- **Balance Nación** — cifra consolidada nacional: recibido, transportado,
  variación y condición.
- **Novedad operativa** — evento registrado durante el turno, asociado a un
  cliente o a una fuente.
- **Transferencia** — movimiento de gas que sale del sistema sin ser consumo de
  un cliente (aportes a otras divisiones, transferencias entre sistemas).

**Un dato importante para el marco teórico:** una empresa mixta puede ser
**fuente y cliente a la vez** — produce gas asociado que entrega al sistema y
además consume gas para su propia operación. Esto se confirmó con evidencia
numérica (los volúmenes no coinciden entre una hoja y otra) y con el manual
oficial, no por suposición. Es un buen ejemplo de la complejidad real del dominio
para la sección de justificación.

---

## 5. Reglas de negocio distintivas (el aporte técnico sustantivo)

Estas son las reglas que le dan densidad académica al trabajo: cada una es una
decisión no trivial, derivada de evidencia, y ninguna existe en el Excel como
regla explícita.

1. **Doble corte diario.** Cada cliente tiene un valor `PUNTUAL` corregible
   durante el día y un `CIERRE_PROMEDIO` derivado. El cierre es la **media
   aritmética simple** de todos los valores que el puntual tuvo ese día (las
   filas del historial más el valor final vigente), no una media ponderada por
   el tiempo que cada valor estuvo vigente.

2. **Cierre automático, no manual.** Un proceso programado corre a las 00:05 hora
   de Venezuela y hace dos cosas: cierra el día anterior calculando los promedios,
   y abre el día nuevo. Se eligió un proceso automático sobre un botón de "cerrar
   día" porque el cierre alimenta el informe formal y no puede quedar sin hacerse
   porque nadie se acordó, ni hacerse dos veces.

3. **Arrastre entre días (carry-forward) persistido.** Al abrir el día, cada
   cliente recibe una fila con el último valor vigente del día anterior. Motivo:
   si un cliente no se toca en todo el día, igual tiene valor vigente y entra al
   cierre — no quedan huecos en el informe formal. El analista solo corrige lo
   que cambió.

4. **Recálculo retroactivo con propagación acotada.** Una corrección tardía sobre
   un día ya cerrado **recalcula ese cierre** y **se arrastra a los días
   siguientes que sigan siendo copias intactas del arrastre**, deteniéndose en el
   primer día que un analista fijó a mano. Sin esto, un valor equivocado quedaría
   propagado en silencio por toda la cadena; con esto, corregir el origen corrige
   la cadena sin destruir el trabajo de quien sí revisó un día posterior.
   *Detalle fino:* "intacto" se detecta comparando el valor con el heredado, no
   preguntando si tiene historial — porque la propia propagación escribe
   historial y ese criterio se rompería en la segunda corrección de la misma
   cadena.

5. **Historial obligatorio y no opcional.** Cualquier analista puede corregir
   cualquier registro, incluso de días cerrados; por eso el rastro de auditoría
   es la contrapartida indispensable. Se escribe en la **misma transacción** que
   el cambio.

6. **Autorización jerárquica por departamento.** Cualquier usuario puede
   *consultar* cualquier departamento; solo puede *editar* el suyo. La jerarquía
   de cargos (Gerente, Superintendente, Supervisor, Ingeniero, Analista) no es
   decorativa: su orden determina quién puede administrar los catálogos de
   negocio.

7. **Separación estricta de dominios.** Cuatro dominios comparten una sola base
   de datos y nada más. Solo los catálogos genuinamente transversales se comparten
   por referencia, nunca se duplican.

8. **Catálogos de negocio gobernados y con baja lógica.** Listas como sectores,
   insumos o estados se administran desde Supervisor hacia arriba —nunca el
   administrador del sistema, que no conoce el dominio, ni cualquier analista, por
   riesgo de duplicados: en los archivos reales ya se encontró "OPERATIVA" junto a
   "OPERATIVO"— y nunca se borran físicamente, para no romper reportes históricos.

---

## 6. Arquitectura y tecnologías (insumo del marco metodológico)

| Capa | Tecnología |
|---|---|
| Frontend | Next.js (App Router), React, shadcn/ui sobre Tailwind, TanStack Table y TanStack Query |
| Formularios y validación | react-hook-form + Zod, con esquemas compartidos entre frontend y backend |
| Backend | Node.js + Express |
| ORM | Prisma, aislado exclusivamente en la capa de persistencia |
| Base de datos | PostgreSQL, con la extensión **pgvector** habilitada desde la primera migración, reservada para el RAG de la Fase 2 (sección 8) |
| Monorepo | pnpm workspaces |
| Contenedores | Docker / docker-compose |
| Despliegue previsto | Un único stack en Coolify: `web`, `api`, `postgres` |

**Patrón arquitectónico:** Controlador → Servicio → Repositorio (no MVC "puro").

**Principios aplicados, con su justificación concreta:**

- **SOLID.** Responsabilidad única: el controlador traduce HTTP ↔ servicio, el
  servicio contiene la lógica de negocio, el repositorio solo persiste.
  Inversión de dependencias: los servicios dependen de *interfaces* de
  repositorio, nunca del ORM. Cuando se necesita SQL agregado (reportes
  consolidados), vive dentro del repositorio mediante consultas parametrizadas,
  nunca concatenación de cadenas.
- **ACID.** Transacciones para las cargas y sus historiales, restricciones de
  integridad (`CHECK`, `UNIQUE`, claves foráneas) en la base y no en el código de
  aplicación.
- **Validación solo en el borde.** Los controladores validan con los esquemas
  compartidos; servicios y repositorios confían en los tipos.
- **Contratos compartidos.** Los tipos de salida y los esquemas de validación
  viven en paquetes compartidos por frontend y backend, de modo que un cambio de
  contrato rompe la compilación en vez de fallar en ejecución.

### 6.1 Seguridad (tratada como prioridad de primer orden)

Este bloque da material sustancial para un capítulo propio:

- Contraseñas con **bcrypt**, factor de costo 12.
- **Token de acceso de vida corta (15 min) + token de refresco en base de datos
  (7 días).** Ninguno viaja en el cuerpo de la respuesta ni es accesible desde
  JavaScript: ambos van en cookies `httpOnly` + `sameSite: strict` + `secure`.
  Motivo: con `httpOnly`, un ataque de scripting entre sitios no puede leer el
  token; `sameSite: strict` corta la falsificación de petición entre sitios sin
  necesidad de un token anti-CSRF aparte.
- **Rotación del token de refresco con detección de reuso**: cada renovación
  emite un par nuevo y revoca el anterior; si llega un token ya revocado, se
  interpreta como robo y se revocan **todas** las sesiones de ese usuario. El
  token se guarda con SHA-256 y no con bcrypt, porque es aleatorio de 256 bits y
  no un secreto elegido por una persona.
- **Sello de revocación**: como un token de acceso sin estado no se puede
  retirar una vez emitido, se registra en el usuario el instante de la última
  revocación y se rechaza todo token emitido antes de esa marca. Esto se
  descubrió en verificación: tras cambiar una contraseña comprometida, la sesión
  ajena seguía leyendo datos durante 15 minutos.
- **Los intentos fallidos NO bloquean la cuenta.** La defensa automática es la
  limitación de tasa (5 intentos / 15 min). Bloquear por intentos fallidos
  habilitaría una denegación de servicio trivial: cualquiera que conozca un
  nombre de usuario podría dejar afuera a esa persona. El bloqueo existe, pero
  como acción manual del administrador.
- **Contraseña temporal generada por el sistema**, entregada una sola vez, con
  vencimiento a 72 horas y cambio forzado en el primer ingreso. Se rechazó
  derivarla del nombre de usuario porque el nombre es público y un compañero
  curioso podría entrar antes que el titular, quedando el robo registrado a
  nombre de la víctima.
- **Autorización resuelta contra la base de datos en cada petición**, nunca
  contra el contenido del token.
- **La guardia del frontend es comodidad, no defensa**: quien hace cumplir la
  regla es el backend. Si la guardia visual fallara, la pantalla se ve rara;
  nadie entra.
- Auditoría de seguridad: registro de ingresos y de **intentos de autorización
  fallidos**, con el motivo distinguido.

*Nota de honestidad metodológica para el documento:* la política de contraseñas
se **relajó deliberadamente** a pedido del área (de 12 caracteres a 6
alfanuméricos) después de que los usuarios reportaran fricción. A cambio, la
lista de términos bloqueados se **amplió**, porque a 6 caracteres la longitud ya
no es lo que defiende la cuenta. Es un caso real y documentable de negociación
entre seguridad y usabilidad, con su compensación explícita.

---

## 7. Alcance: qué está construido y qué no

### Construido y verificado contra base de datos real

- **Autenticación y sesiones** completas: ingreso, renovación rotativa con
  detección de reuso, cierre de sesión, limitación de tasa, auditoría.
- **Gestión de usuarios** (alta, modificación, reinicio de contraseña,
  bloqueo/desbloqueo), exclusiva del administrador.
- **Módulo Despacho completo:**
  - Balance diario por cliente (111 filas, digitación de corrido).
  - Lecturas de fuentes (31).
  - Quema nacional.
  - Novedades operativas.
  - Directorio de contactos.
  - Transferencias fuera del sistema.
  - Administración de los catálogos de clientes y fuentes.
  - Reportes: Balance Nación, Consumo por Sectores, serie histórica de recibido
    contra transportado, y desglose por sistema/sub-sistema.
  - Proceso automático de cierre diario.
- **Interfaz**: diez pantallas, revisadas por el responsable del área en
  navegador real el 16 de septiembre de 2026.

### Diseñado pero no construido

- **Mantenimiento** (estaciones de transmisión y distribución, instrumentación,
  telemetría semanal) — modelo de datos cerrado, sin API ni pantallas.
- **Actividades y Horas-Hombre** — módulo transversal, modelo cerrado.

### Ni diseñado ni construido

- **Calidad de Gas** y **Análisis Operacional**. Motivo explícito y honesto: **no
  existe planilla ni especificación de origen** para ninguno de los dos. En la
  interfaz aparecen como "En desarrollo".

### No desplegado

El despliegue en producción todavía no ocurrió.

**Este recorte es una delimitación de alcance defendible y debe presentarse como
tal en el documento**, no como una carencia: se cubrió en profundidad el dominio
que tenía evidencia documental completa, en vez de cubrir cuatro superficialmente.

---

## 8. Fase 2 — Asistente de consulta con RAG (el eje de innovación)

**Este es el componente que diferencia al proyecto de un CRUD de reemplazo de
Excel, y probablemente el eje que más peso académico puede aportar.**

### 8.1 Qué está efectivamente decidido

Poco, pero lo que hay es sustantivo y **está previsto desde el día uno**, no
agregado después:

- **La base de datos tiene la extensión `pgvector` habilitada desde la primera
  migración**, con el propósito explícito de soportar búsqueda por similitud
  vectorial en una Fase 2. No es una idea posterior: la arquitectura se preparó
  para esto antes de escribir la primera pantalla.
- **El motor de inferencia previsto es Ollama**, es decir, un modelo de lenguaje
  **ejecutándose localmente** dentro del mismo stack de despliegue, no un
  servicio en la nube.
- **La Fase 2 está deliberadamente diferida.** Hay una regla explícita del
  proyecto: no agregar el contenedor de Ollama ni código de RAG hasta que esa
  fase arranque formalmente. El motivo es la misma disciplina de alcance que
  gobernó todo el desarrollo: primero retirar el Excel, que es el compromiso
  adquirido con el área; después extender.

### 8.2 Por qué RAG local y no un servicio en la nube

Esta justificación es fuerte y defendible ante un jurado, y **no es una
preferencia técnica sino una restricción del contexto**:

1. **Soberanía del dato.** El corpus a consultar son documentos internos de
   PDVSA: manuales técnicos de los sistemas de transporte, procedimientos
   operativos, el historial de novedades del turno. Enviarlos a una API de
   terceros para generar embeddings o respuestas significa sacar información de
   una industria estratégica del perímetro de la empresa. Un modelo local no
   plantea esa cesión.
2. **Independencia de conectividad.** La sala de control opera 24 horas,
   incluida la guardia nocturna. Un asistente que deja de funcionar cuando se
   cae el enlace a internet no es confiable en ese entorno; uno que corre en el
   mismo stack que la aplicación, sí.
3. **Costo operativo nulo por consulta**, frente al costo por token de un
   servicio externo — relevante en un contexto de restricciones presupuestarias.
4. **Coherencia con la arquitectura ya construida.** El almacén vectorial es la
   **misma base PostgreSQL** que ya sostiene el sistema, vía `pgvector`. No se
   introduce un motor de búsqueda vectorial aparte, no hay un segundo almacén que
   sincronizar, y se mantiene el principio de mínima superficie de despliegue que
   guió todo el proyecto (un solo stack: web, api, postgres, y ahora ollama).

### 8.3 Corpus candidato — y por qué el proyecto está bien posicionado

La ventaja poco común de este caso es que **el corpus ya fue levantado y
auditado** durante la Fase 1. No hay que salir a conseguir documentos:

- **El manual oficial de sistemas de transporte de gas** (110 diapositivas):
  nomenclatura de estaciones por sistema, puntos de entrega y recepción, datos
  técnicos de tuberías, parámetros de calidad. Es la autoridad documental del
  área y ya se usó como fuente de verdad para resolver decisiones de diseño.
- **El historial acumulado de novedades operativas**: texto libre escrito por los
  analistas turno a turno, que **crece todos los días** y hoy no es consultable
  más allá de filtrar por fecha y origen. Es el candidato más valioso, porque es
  conocimiento operativo que hoy se pierde.
- **El directorio de contactos** de operadores por cliente y fuente.
- **Los procedimientos y manuales operativos** del área (pendiente de
  inventariar).
- **El propio registro de 79 decisiones de diseño**, como documentación viva del
  sistema para quien lo mantenga después.

### 8.4 Distinción de diseño que conviene explicitar en el documento

**No todo dato del sistema es candidato a RAG, y confundirlo es el error más
común en trabajos de este tipo.**

- Los **datos operacionales son estructurados y numéricos** (volúmenes por
  cliente, por fecha, por corte). Una pregunta como "¿cuánto se le entregó a
  Pequiven el martes?" es una **consulta SQL**, no un problema de recuperación
  semántica. Vectorizar cifras para después pedirle a un modelo que las sume es
  menos exacto, más lento y más caro que la consulta que el sistema ya sabe
  hacer.
- El RAG aporta valor sobre el **corpus no estructurado**: manuales,
  procedimientos, y sobre todo el texto libre de las novedades.
- El diseño interesante —y el que da material para un capítulo— es el **híbrido**:
  un asistente que recupere del corpus documental y que además pueda apoyarse en
  consultas estructuradas ya existentes para las cifras. Reconocer explícitamente
  esa frontera es, en sí mismo, un aporte metodológico.

### 8.5 Casos de uso candidatos (A CONFIRMAR CON EL ÁREA — no están decididos)

Ninguno de estos está confirmado. Se listan como hipótesis a validar, siguiendo
la regla del proyecto de no dar por cerrada una regla de negocio no confirmada:

- Consulta en lenguaje natural sobre el manual técnico ("¿cuáles son los puntos
  de entrega del sistema Ulé–Amuay?"), hoy resuelta hojeando 110 diapositivas.
- Búsqueda semántica sobre el histórico de novedades ("¿qué se hizo la última vez
  que falló la telemetría en tal estación?"), que convierte el registro de
  novedades de archivo muerto en memoria operativa consultable.
- Apoyo al analista entrante en el relevo de turno.
- Inducción de personal nuevo sobre nomenclatura y procedimientos del área.

### 8.6 Lo que falta definir antes de construirlo

Todo esto está abierto y debe decidirse (y, si la Fase 2 entra en el trabajo de
grado, decidirse **con justificación documentada**, igual que las 79 decisiones
de la Fase 1):

- Modelo de lenguaje y modelo de embeddings concretos, y si el hardware
  disponible los sostiene.
- Estrategia de segmentación del corpus, especialmente de material en
  diapositivas, que no es prosa continua.
- Proceso de ingesta y reindexado cuando el corpus cambia.
- Control de acceso sobre las respuestas: si la autorización por departamento
  debe alcanzar también a lo que el asistente puede recuperar.
- **Cómo se evalúa.** Un jurado va a preguntarlo. Sin un criterio de evaluación
  definido, el módulo es una demostración, no un resultado.
- Qué hacer cuando el sistema no encuentra respuesta — el riesgo de alucinación
  en un contexto operacional no es cosmético.

### 8.7 Decisión pendiente sobre el alcance del trabajo de grado

**Hay que decidir explícitamente si la Fase 2 entra en el documento y cómo**, y
es una decisión con consecuencias fuertes:

- **Como trabajo futuro** (capítulo de recomendaciones): el documento se sostiene
  sobre lo ya construido y verificado, con riesgo bajo. Pero el trabajo se
  presenta como un sistema de registro, que es menos ambicioso.
- **Como objetivo central del trabajo**: eleva mucho el aporte —de "sustituir una
  hoja de cálculo" a "incorporar recuperación aumentada sobre el conocimiento
  operativo de la gerencia"— y da material propio de marco teórico (modelos de
  lenguaje, embeddings, bases vectoriales, RAG). Pero obliga a construirlo,
  evaluarlo y defenderlo, y hoy no existe ni una línea de ese código.

Esta decisión depende de tiempo disponible, hardware y normativa, y **debe
tomarla el autor** — está anotada en los vacíos de la sección 11.

---

## 9. Metodología realmente empleada

Esto describe lo que efectivamente ocurrió, para que se traduzca al marco
metodológico con la formalidad que exija la institución.

**Enfoque: desarrollo iterativo e incremental, guiado por evidencia documental.**

1. **Levantamiento por auditoría de artefactos reales**, no por entrevista
   abierta. Las reglas se extrajeron de los archivos que el área usa todos los
   días. Principio operativo adoptado: **leer las fórmulas, no solo los valores**
   — dos veces eso cambió una decisión ya tomada.
2. **Validación con el responsable del área** de todo lo que la evidencia no
   resolvía. Regla explícita: nunca rellenar una regla de negocio no confirmada
   con una suposición.
3. **Registro formal de decisiones.** Existe un registro numerado y fechado de
   **79 decisiones de diseño**, cada una con su motivo, sus alternativas
   descartadas y la evidencia que la sustenta. Las decisiones que corrigen a otras
   anteriores lo dicen explícitamente y no se sobrescriben. **Este registro es,
   por sí solo, un anexo de alto valor para el trabajo de grado.**
4. **Entrega por rebanadas verticales**: cada incremento atraviesa base de datos,
   API e interfaz y queda funcionando, en vez de construir capas completas.
5. **Verificación contra el sistema corriendo**, no solo contra el compilador:
   cada endpoint y cada proceso programado se ejercitó contra la base real con
   datos reales.
6. **Bitácora narrativa por sesión** (23 entradas), que documenta también los
   errores cometidos y corregidos.

### Hallazgos de la auditoría documental (valiosos como resultados)

La auditoría produjo hallazgos propios, que son resultados legítimos del trabajo:

- Se detectó que el catálogo de fuentes requería **mucha más granularidad** de la
  supuesta: las plantas se leen y corrigen **por tren** de procesamiento, no por
  complejo. La lista pasó de un puñado de complejos a ~22 fuentes reales.
- Se corrigió el catálogo de sistemas de transporte: una fuente previa afirmaba 8
  y el balance sugería 9; el **manual oficial confirmó 7**. Los "9" eran
  agrupaciones regionales de reporte mezcladas con sistemas de transporte, que son
  cosas distintas.
- Se descubrió que dos etiquetas distintas del libro ("Quema Puntual" y "Quema
  TyD") **apuntan a la misma celda**: son el mismo dato con dos nombres.
- Se encontró una **discrepancia numérica medible de 8 MMPCED** entre lo que el
  libro reporta como transportado y lo que el sistema calculaba, causada por
  transferencias que salen del sistema sin ser consumo de ningún cliente. Se
  modeló y la cifra cuadró.
- Se identificó una **inconsistencia del propio libro** que sigue sin explicación:
  el total nacional excluye una de las filas de su propia lista (la entrega a Ico
  Morón) sin motivo aparente. **No se replicó la anomalía**; queda documentada
  como pregunta abierta al área. Es un ejemplo excelente de por qué una regla
  enterrada en una celda es un riesgo.
- Se determinó que once celdas del libro **no se digitan**: se alimentan
  automáticamente desde el historiador industrial AspenTech InfoPlus.21. Se
  dejaron **fuera del alcance** con una justificación explícita: los analistas ya
  consultan esas presiones en vivo desde el SCADA, de modo que replicarlas no
  agregaría valor y abriría un frente de integración sin beneficio real.

---

## 10. Datos cuantitativos verificados (útiles para justificación y resultados)

- **111 clientes** y **31 fuentes** cargados como catálogo real.
- **7 sistemas** de transporte, **3 sub-sistemas**, **4 regiones operativas**,
  **7 sectores económicos**, **4 departamentos**, **5 cargos** en la jerarquía.
- **251 y 288 estaciones** de transmisión y distribución en los dos inventarios
  auditados (insumo del módulo de Mantenimiento, ya modelado).
- **8 hojas** en el libro de Excel reemplazado.
- **110 diapositivas** en el manual oficial de sistemas de transporte usado como
  autoridad documental.
- **8 gráficos** en el libro, que resultaron ser **los mismos 4 repetidos** para
  los dos cortes — y así se implementaron, una sola vez con selector de corte.
- **79 decisiones de diseño** registradas y fechadas.
- **23 sesiones de trabajo** documentadas, entre el 8 y el 16 de septiembre de
  2026.
- **7 migraciones** de base de datos aplicadas.
- **10 pantallas** construidas y revisadas en navegador.
- Contraste de interfaz medido: **15,08:1** y **5,63:1**, ambos por encima del
  umbral WCAG AA.
- Paleta de gráficos validada para daltonismo: separación ΔE de 30,2 en
  protanopía y 28,7 en tritanopía para la serie principal. Se documentó
  explícitamente que **seis tonos que sobrevivan la comparación de todos los pares
  no es alcanzable sobre fondo oscuro**, y se compensó con codificación
  secundaria (nombre, cifra y porcentaje en la leyenda).

---

## 11. Vacíos: lo que el autor debe aportar (NO INVENTAR)

Nada de esto está definido en el material del proyecto. Deben preguntarse antes
de redactar cualquier entregable que los requiera:

- [ ] **Universidad, núcleo y carrera.**
- [ ] **Denominación exacta del entregable**: ¿Trabajo Especial de Grado,
      Trabajo de Grado, Proyecto Socio-Integrador, Pasantía? Cada una tiene
      estructura distinta.
- [ ] **Normativa de presentación de la institución** (estructura de capítulos
      exigida, normas de citación — APA, UPEL, otra —, extensión, formato).
- [ ] **Modalidad de investigación exigida** (proyecto factible, investigación
      aplicada, investigación y desarrollo…). Determina cómo se redactan los
      objetivos.
- [ ] **Metodología de desarrollo que la institución espera ver citada** (RUP,
      XP, Scrum, cascada, metodología propia del autor). El desarrollo real fue
      iterativo e incremental guiado por evidencia; hay que ver a cuál de las
      formalmente aceptadas se ajusta sin falsear los hechos.
- [ ] **Tutor académico y tutor industrial** (si aplica).
- [ ] **Fechas**: entrega de propuesta, entrega del documento, defensa.
- [ ] **Qué ya fue entregado o aprobado** (¿hay título tentativo presentado? ¿la
      propuesta ya fue rechazada o corregida alguna vez?).
- [ ] **Autorización institucional de PDVSA Gas** para usar el caso y los datos
      (ver sección 12).
- [ ] **Si hay coautores** o es individual.
- [ ] **Si la Fase 2 (RAG) entra en el alcance del trabajo o queda como trabajo
      futuro** — ver sección 8.7. Es la decisión de mayor impacto sobre el título,
      los objetivos y el marco teórico, y depende de tiempo disponible y hardware.
- [ ] **Hardware disponible** para correr el modelo local, si la Fase 2 entra en
      el alcance. Determina qué modelo es viable y si el módulo es realizable en
      el plazo.

---

## 12. Restricciones de confidencialidad y ética

Reglas heredadas del proyecto, que **aplican igual al documento de grado**:

1. **Nunca reproducir datos personales sensibles de empleados** (cédula, fecha de
   nacimiento, dirección, tallas de vestimenta). Uno de los archivos fuente los
   contiene y fueron deliberadamente excluidos del modelo de datos, de los
   registros del sistema y de toda salida. El documento de grado tampoco debe
   contenerlos.
2. **Los archivos fuente son documentos internos de PDVSA** y están
   deliberadamente excluidos del repositorio. Antes de anexar capturas o extractos
   al documento, debe confirmarse la autorización institucional.
3. Los volúmenes operacionales reales de gas pueden ser información sensible.
   **Confirmar con el área** antes de publicar cifras reales; si hace falta,
   usar datos de ejemplo en las capturas.
4. **No inventar identidad institucional.** No existe manual de marca, logo
   corporativo ni assets entregados por PDVSA Gas. La identidad visual del sistema
   es una decisión del proyecto, no una herencia corporativa.

---

## 13. Insumos para el título y los objetivos

**Estos son puntos de partida para discutir, no propuestas cerradas.** El título
definitivo depende de la normativa de la institución y de la modalidad exigida
(ambos en los vacíos de la sección 11).

**Ejes que el título debería capturar:** (a) es un sistema web, (b) es para
control operacional de gas natural, (c) es para una gerencia concreta de PDVSA
Gas, y (d) sustituye un registro manual en hoja de cálculo. Conviene decidir si
el título nombra el sistema completo (los cuatro dominios, con Despacho como
alcance implementado) o solo el dominio construido — decisión con consecuencias
directas sobre el alcance que después hay que defender.

**El eje del RAG cambia el título si entra en el alcance.** Si la Fase 2 se
incorpora, el título deja de describir un sistema de registro y pasa a
incorporar la recuperación aumentada sobre el conocimiento operativo de la
gerencia, lo que sube notablemente el aporte declarado — y obliga a sostenerlo.
Es la primera decisión a tomar antes de redactar nada, y está en los vacíos
(sección 11).

**Para los objetivos**, el material da soporte natural a una progresión de este
tipo: diagnosticar la situación actual del registro en hoja de cálculo →
formalizar las reglas de negocio del balance diario a partir de la evidencia
documental → diseñar el modelo de datos y la arquitectura → desarrollar los
módulos → validar contra la operación real. Si la Fase 2 entra, se suma un eje
de incorporación del asistente de consulta con su propio criterio de evaluación.
La cantidad y la redacción exacta dependen de la normativa pendiente.

**Fortalezas del proyecto que el documento debería explotar:**

- Es un sistema **real, terminado y verificado**, no un prototipo.
- Resuelve un problema **operacional concreto de una industria estratégica**.
- Tiene **evidencia documental abundante** y un registro de 79 decisiones
  fundamentadas.
- Tiene **hallazgos propios** de la auditoría, incluida una discrepancia numérica
  detectada y corregida y una anomalía del sistema anterior documentada.
- Tiene un **capítulo de seguridad** con profundidad poco común en trabajos de
  este nivel, incluida una vulnerabilidad detectada y corregida durante la propia
  verificación.
- Tiene un **eje de innovación con RAG local** (sección 8) previsto desde la
  arquitectura inicial y no agregado a última hora, con el corpus documental ya
  levantado y una justificación de soberanía del dato que se sostiene sola en
  una industria estratégica.
- Documenta honestamente sus **limitaciones** y sus decisiones de compromiso.

**Debilidades que conviene anticipar antes de que las señale un jurado:**

- Dos de los cuatro dominios no están ni diseñados (hay justificación documental:
  no existe la fuente).
- El sistema **no ha sido desplegado en producción** ni sometido a uso real
  sostenido, por lo que **no hay métricas de adopción ni de impacto medido**. No
  deben inventarse.
- No hay pruebas automatizadas documentadas como tales; la verificación fue
  manual contra el sistema corriendo.
- La validación fue con **un solo interlocutor** del área, no con un grupo de
  usuarios.
