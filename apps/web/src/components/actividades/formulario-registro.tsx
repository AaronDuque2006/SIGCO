"use client";

import type { GerenciaRequirienteDto, ProductoServicioDto } from "@sicog/shared-types";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useCrearRegistro, useRegionesMtto, useResponsables } from "@/lib/actividades";
import { useSesion } from "@/lib/sesion";
import { hoy } from "@/lib/fechas";

/**
 * Alta de una actividad.
 *
 * **La clave de idempotencia se genera una vez, al abrir el formulario, y se
 * reusa en cada envío.** Ése es todo el punto: una clave nueva por intento
 * sería una clave por reintento, y cada reintento volvería a crear la fila. Si
 * el guardado falla y la persona corrige y reenvía, la clave sigue siendo la
 * misma — el backend compara el cuerpo y, al ser distinto, lo trata como una
 * operación nueva.
 *
 * Al guardar con éxito se cierra el formulario, así que el próximo alta abre
 * uno nuevo con clave nueva.
 */
export function FormularioRegistro({
  departamentoId,
  productos,
  gerencias,
  onCerrar,
}: {
  departamentoId: number | undefined;
  productos: ProductoServicioDto[];
  gerencias: GerenciaRequirienteDto[];
  onCerrar: () => void;
}) {
  const crear = useCrearRegistro();
  const regiones = useRegionesMtto();
  const responsables = useResponsables(departamentoId);
  const { sesion } = useSesion();
  const [clave] = useState(() => crypto.randomUUID());

  // Por defecto, uno mismo. Elegir a otra persona es **asignarle** la tarea:
  // nace en Recibido y es ella quien después le mueve el estado y le carga las
  // horas (decisión #83).
  const [usuarioId, setUsuarioId] = useState("");

  const [productoServicioId, setProducto] = useState("");
  const [gerenciaRequirienteId, setGerencia] = useState("");
  const [regionId, setRegion] = useState("");
  const [fechaDesde, setDesde] = useState(hoy);
  const [fechaHasta, setHasta] = useState(hoy);
  const [cantidad, setCantidad] = useState("1");
  const [detalle, setDetalle] = useState("");

  // Sólo los activos: el soft-delete existe para que los reportes históricos
  // sigan nombrando lo dado de baja, no para seguir ofreciéndolo al cargar.
  const productosActivos = productos.filter((p) => p.activo && p.insumo.activo);
  const gerenciasActivas = gerencias.filter((g) => g.activo);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (departamentoId === undefined) return;
    crear.mutate(
      {
        claveIdempotencia: clave,
        datos: {
          productoServicioId: Number(productoServicioId),
          gerenciaRequirienteId: Number(gerenciaRequirienteId),
          regionId: regionId === "" ? null : Number(regionId),
          usuarioId: usuarioId === "" ? undefined : Number(usuarioId),
          fechaDesde,
          fechaHasta,
          cantidad: Number(cantidad),
          // Una tarea nace asignada y sin horas; las carga quien la ejecuta.
          hh: null,
          estatus: "RECIBIDO",
          detalle: detalle.trim() === "" ? null : detalle.trim(),
        },
      },
      { onSuccess: onCerrar },
    );
  };

  return (
    <form onSubmit={enviar} className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium">Registrar actividad</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Nace en <strong>Recibido</strong> y sin horas. Quien la ejecute le mueve el
        estado y le carga las horas desde la fila.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="producto">Actividad</Label>
          <Select
            id="producto"
            required
            value={productoServicioId}
            onChange={(e) => setProducto(e.target.value)}
          >
            <option value="">Elegir…</option>
            {productosActivos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.insumo.nombre} — {p.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="responsable">Responsable</Label>
          <Select
            id="responsable"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
          >
            <option value="">{sesion ? `${sesion.nombre} (usted)` : "Usted"}</option>
            {(responsables.data ?? [])
              .filter((r) => r.id !== sesion?.id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.puesto}
                </option>
              ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            {usuarioId === "" ? "La registra a su nombre." : "Se la asigna a esa persona."}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gerencia-alta">Gerencia requiriente</Label>
          <Select
            id="gerencia-alta"
            required
            value={gerenciaRequirienteId}
            onChange={(e) => setGerencia(e.target.value)}
          >
            <option value="">Elegir…</option>
            {gerenciasActivas.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="region">Alcance</Label>
          <Select id="region" value={regionId} onChange={(e) => setRegion(e.target.value)}>
            {/* Nacional es la ausencia de región, no una región más
                (decisión #19), y en el workbook es el caso más común. */}
            <option value="">Nacional</option>
            {(regiones.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desde-alta">Desde</Label>
          <Input
            id="desde-alta"
            type="date"
            required
            value={fechaDesde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hasta-alta">Hasta</Label>
          <Input
            id="hasta-alta"
            type="date"
            required
            value={fechaHasta}
            onChange={(e) => setHasta(e.target.value)}
          />
          {/* La actividad se imputa al mes en que **termina** (§14.4), así que
              esta fecha decide en qué mes cae en el reporte. */}
          <p className="text-xs text-muted-foreground">Decide el mes del reporte.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cantidad">Cantidad</Label>
          <Input
            id="cantidad"
            type="number"
            min={1}
            required
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Más de 1 sólo si se repite la misma actividad.
          </p>
        </div>

        <div className="space-y-1.5 lg:col-span-3">
          <Label htmlFor="detalle">Detalle</Label>
          <Input
            id="detalle"
            placeholder="Qué se hizo, o qué hay que hacer"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
          />
        </div>
      </div>

      {fechaDesde > fechaHasta ? (
        <p className="mt-3 text-xs text-destructive" role="alert">
          La fecha de fin no puede ser anterior a la de inicio.
        </p>
      ) : null}

      {crear.error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{crear.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={crear.isPending || fechaDesde > fechaHasta}>
          {crear.isPending ? "Guardando…" : "Registrar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
