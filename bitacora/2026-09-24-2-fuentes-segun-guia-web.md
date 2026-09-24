# 2026-09-24 — El catálogo de fuentes pasa a ser el de GUIA WEB

Decisión #107. Revisa las #39, #41, #47 y #98.

## Cómo empezó

El owner mandó una captura del bloque "ORIENTE Y OCCIDENTE" del balance
(Procesado / Residual / Desvío, total recibido 1792) y pidió eliminar
fuentes, salvo las empresas mixtas, Cardón IV y Producción Occidente, que
"van separadas". La captura no coincidía uno a uno con las 31 fuentes
sembradas (Tonoro, Anaco y Entregas directas no existían), así que antes de
borrar nada se le preguntó cuál era la regla. Su respuesta fue pedir que se
analizara la hoja `GUIA WEB`, "porque de ahí se alimenta el puntual".

## Lo que mostró el workbook

- La tabla de la captura es `PROMEDIO!C17:G27`, y cada fila apunta a una
  celda de `GUIA WEB`. El recibido es residual + desvío (`E27 = F26+G26`).
- El catálogo de 31 había salido de la hoja `FUENTES`, un desglose que el
  balance ya no suma. `EJECUTIVO PUNTUAL` todavía lee de ella en esta copia
  y da otro recibido (1690,4).
- "Corredor Jusepín-Criogénico" era un subtotal de otras cinco fuentes, así
  que con el catálogo viejo contaba doble.
- "Entregas directas" no es una fuente: son 4 clientes que el workbook resta
  de su región y vuelve a sumar de los dos lados del balance.

## Lo que respondió el owner

1. El desvío de San Joaquín suma al volumen de la fuente y, por lo tanto, al
   balance.
2. Santa Bárbara y Jusepín no van.
3. Entregas directas se calcula de los 4 clientes, pero tiene que verse en el
   reporte.
4. PAGMI se borra.

## Lo que se hizo

- Migración `20260924160000_fuentes_segun_guia_web`: `LECTURA_FUENTE.desvio`
  (y `desvioAnt` en el historial), `CLIENTE.entregaDirecta`, se borran 21
  fuentes con sus lecturas (de demostración) y se marcan los 4 clientes. El
  seed inserta las 4 fuentes nuevas y queda en 14.
- Recibido = volumen + desvío de las fuentes + entregas directas del corte,
  en el Balance Nación y en la serie. `BalanceNacionDto.entregasDirectasMmpced`
  aparece en la tarjeta de Recibido ("incluye N de entregas directas").
- En Lecturas de fuentes, la columna y el campo Desvío, sólo en San Joaquín.
  El total del encabezado suma el desvío, y también el export a Excel.
- `sembrar-demo` descuenta las entregas directas del recibido que les deja a
  las fuentes, para que la semana de demostración siga cerca del equilibrio.

Verificado contra la base real (con la base respaldada antes de migrar), con
un usuario desechable en una API aparte y sobre una fecha sin datos: residual
293 + desvío 10 + Tonoro 154 + entregas directas 9 = recibido 466. El
historial guarda el desvío anterior, un PATCH sin desvío no lo borra y un
desvío negativo se rechaza. Revisado en el navegador en las dos pantallas.
Después se borraron las lecturas y el usuario de prueba.

## Queda pendiente

- Que el owner revise Lecturas de fuentes y Reportes en su navegador.
- ~~Volver a sembrar la demostración~~: hecho a pedido del owner. 98
  lecturas de fuentes (14 × 7 días) y la variación diaria entre -36 y +36
  MMPCED, con las entregas directas dentro del recibido.
- ~~Confirmar el sistema de las 4 fuentes nuevas~~: el owner pidió
  chequearlo en el Manual DAO. Tonoro (Jusepín - Criogénico) y Producción
  Occidente (Ulé - Amuay) estaban bien; Anaco y Gas seco (Soto) se reciben en
  Anaco - Puerto Ordaz (slides 23, 24 y 27) y se corrigieron con una
  migración aparte.
