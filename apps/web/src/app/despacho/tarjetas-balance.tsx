import type { BalanceNacionDto } from "@sicog/shared-types";
import { Chispa } from "@/components/graficas";
import { TarjetaCifra } from "@/components/tarjeta-cifra";

/**
 * El "Balance Nación" del §11, que es query-calculado y no una tabla
 * (decisión #15).
 *
 * `recibido` sale de las lecturas de FUENTES y `transportado` de las de
 * CLIENTES **más la quema y las transferencias**: el workbook las cuenta en su
 * total y así quedó (decisiones #74 y #79). La condición replica la fórmula del
 * workbook real: corte estricto en cero, sin umbral, así que una variación de
 * exactamente 0 cae en desempaque.
 *
 * Recibe el dato ya cargado en vez de consultarlo: la pantalla espera a sus
 * tres consultas y aparece entera, y así esta tarjeta no puede renderizarse sin
 * datos. Cuando podía, el pie afirmaba "Salió más gas del que entró" mientras
 * cargaba — una afirmación sobre el sistema de transporte nacional emitida
 * antes de tener la cifra.
 */
export function TarjetasBalance({
  datos,
  serieVariacion,
}: {
  datos: BalanceNacionDto;
  /** La variación de los últimos días, para la curva de esa tarjeta. Opcional:
   *  es contexto, y la vista no espera por ella. */
  serieVariacion?: number[];
}) {
  const empaque = datos.condicion === "EMPAQUE";

  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <TarjetaCifra
        titulo="Recibido"
        valor={datos.recibidoMmpced}
        pie="Lecturas de fuentes"
      />
      <TarjetaCifra
        titulo="Entregado"
        valor={datos.transportadoMmpced}
        pie={pieTransportado(datos)}
      />
      <TarjetaCifra
        titulo="Variación"
        valor={datos.variacionMmpced}
        pie="Recibido menos entregado"
        curva={
          serieVariacion ? (
            <Chispa valores={serieVariacion} etiqueta="Variación de los últimos días" />
          ) : undefined
        }
      />
      <div className="rounded-lg border border-border bg-card px-3 py-2.5">
        <dt className="text-xs font-medium text-muted-foreground">Condición del sistema</dt>
        <dd className="mt-0.5">
          {/* Verde y rojo, a pedido del owner: el empaque del sistema de
              transporte **es** un estado operativo, que es justo para lo que el
              sistema reserva estos tres colores. Que el desempaque sea
              frecuente no lo vuelve neutro — es la condición que el área quiere
              ver de lejos. */}
          <span
            className={`rounded-md px-2 py-0.5 text-sm font-medium ${
              empaque ? "bg-ok-soft text-ok" : "bg-danger-soft text-destructive"
            }`}
          >
            {empaque ? "Empacado" : "Desempacado"}
          </span>
        </dd>
        <p className="mt-1 text-xs text-muted-foreground">
          {empaque ? "Entró más gas del que salió" : "Salió más gas del que entró"}
        </p>
      </div>
    </dl>
  );
}

/**
 * Qué parte del entregado no es consumo de clientes.
 *
 * Se nombra sólo lo que hay: un día sin quema ni transferencias no necesita
 * explicar que no las tuvo.
 */
function pieTransportado(b: BalanceNacionDto): string {
  const partes: string[] = [];
  if (b.quemaMmpced !== 0) partes.push("quema");
  if (b.transferenciasMmpced !== 0) partes.push("transferencias");
  return partes.length === 0
    ? "Lecturas de clientes"
    : `Clientes más ${partes.join(" y ")}`;
}
