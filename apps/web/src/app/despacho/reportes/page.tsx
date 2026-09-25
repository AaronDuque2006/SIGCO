"use client";

import type { TipoCorte } from "@sicog/shared-types";
import { useState } from "react";
import { ContenidoReportes } from "@/components/contenido-reportes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { useBalanceNacion, useConsumoPorSectores, urlExportarPdfReportes } from "@/lib/despacho";
import { hoy } from "@/lib/fechas";
import { IconFileTypePdf } from "@tabler/icons-react";

/**
 * Los reportes del módulo, con las gráficas del workbook.
 *
 * En el Excel son ocho gráficas repartidas en dos hojas, `EJECUTIVO PUNTUAL` y
 * `PROMEDIO`. Son las **mismas cuatro** en cada hoja, cambiando sólo el corte,
 * así que acá van una vez con el selector de corte arriba — igual que Balance
 * Diario.
 */
export default function ReportesPage() {
  const [fecha, setFecha] = useState(hoy);
  const [tipoCorte, setTipoCorte] = useState<TipoCorte>("PUNTUAL");

  const balance = useBalanceNacion(fecha, tipoCorte);
  const consumo = useConsumoPorSectores(fecha, tipoCorte);

  const error = balance.error ?? consumo.error;
  // Las dos consultas describen el mismo día, así que la pantalla espera a las
  // dos y aparece entera. Dejarlas entrar de a una haría saltar el layout dos
  // veces, y en una máquina cargada eso son varios segundos de brincos.
  const cargando = balance.isPending || consumo.isPending;

  // Deshabilitado mientras carga o hay error: exportar un reporte a medio
  // cargar (o el de un día que ni siquiera respondió) produciría un PDF con
  // huecos que nadie pidió.
  const puedeExportar = !cargando && !error;

  return (
    <main>
      <EncabezadoVista titulo="Reportes y gráficas">
        Las mismas cuatro vistas de las hojas <em>EJECUTIVO PUNTUAL</em> y{" "}
        <em>PROMEDIO</em> del balance, con el corte como selector.
      </EncabezadoVista>

      {/* Los filtros, en una fila arriba de todo lo demás, con el botón de
          exportar al final: es una acción sobre el mismo filtro, no otra
          cosa. */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="corte">Corte</Label>
          <Select
            id="corte"
            value={tipoCorte}
            onChange={(e) => setTipoCorte(e.target.value as TipoCorte)}
          >
            <option value="PUNTUAL">Puntual</option>
            <option value="CIERRE_PROMEDIO">Cierre promedio</option>
          </Select>
        </div>
        <div className="flex items-end">
          {/* Un `<a>` con `download`, no un `onClick` con `fetch`: es una
              descarga de archivo, y el navegador ya sabe hacer eso — con
              barra de progreso propia y sin tener que armar un blob acá. Las
              cookies de sesión viajan solas porque es una navegación normal,
              no un `fetch` cross-origin. */}
          <Button
            variant="outline"
            disabled={!puedeExportar}
            // El `<a>` de abajo es el elemento real: `nativeButton={false}`
            // le dice a Base UI que no espere un `<button>` nativo detrás del
            // `render`, así no repite semántica que ya no aplica.
            nativeButton={false}
            render={
              <a
                href={puedeExportar ? urlExportarPdfReportes(fecha, tipoCorte) : undefined}
                aria-disabled={!puedeExportar}
                download
              />
            }
          >
            <IconFileTypePdf size={16} stroke={1.75} aria-hidden />
            Exportar PDF
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : cargando ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Cargando los reportes…
        </p>
      ) : balance.data && consumo.data ? (
        <ContenidoReportes balance={balance.data} consumo={consumo.data} tipoCorte={tipoCorte} />
      ) : null}
    </main>
  );
}
