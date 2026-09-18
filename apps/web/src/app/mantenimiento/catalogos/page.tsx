"use client";

import type { GerenciaRequirienteDto, InsumoDto, ProductoServicioDto } from "@sicog/shared-types";
import { useState } from "react";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  DEPARTAMENTO_MANTENIMIENTO,
  useDepartamentoId,
  useGerencias,
  useInsumos,
  useProductosServicio,
} from "@/lib/actividades";
import { api, ApiError } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSesion } from "@/lib/sesion";

/**
 * Los catálogos del módulo: insumos, productos/servicio y gerencias
 * requirientes.
 *
 * Los gobierna el **Supervisor de su propio departamento hacia arriba**
 * (decisión #31), nunca el superadmin —que no conoce el dominio— ni un
 * analista, por el riesgo de duplicados que los Excel reales ya mostraron.
 * La puerta real es el 403 del backend; esto sólo evita ofrecer un formulario
 * que va a rebotar.
 *
 * **Nada se borra**: dar de baja es desactivar, para no romper los reportes
 * históricos que siguen nombrando lo dado de baja.
 */
export default function CatalogosPage() {
  const { sesion } = useSesion();
  const departamentoId = useDepartamentoId(DEPARTAMENTO_MANTENIMIENTO) ?? undefined;
  const insumos = useInsumos(departamentoId);
  const productos = useProductosServicio(departamentoId);
  const gerencias = useGerencias(departamentoId);

  const puedeEditar =
    sesion?.departamentosQueEdita.includes(DEPARTAMENTO_MANTENIMIENTO) === true &&
    ["Gerente", "Superintendente", "Supervisor"].includes(sesion.puesto);

  return (
    <main>
      <EncabezadoVista titulo="Catálogos">
        Los administra el Supervisor del departamento hacia arriba. Nada se borra:
        dar de baja es desactivar, para que los reportes históricos sigan
        pudiendo nombrarlo.
      </EncabezadoVista>

      {!puedeEditar ? (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Está viendo los catálogos en modo consulta: editarlos requiere ser
          Supervisor o superior de Mantenimiento.
        </p>
      ) : null}

      <Seccion
        titulo="Insumos"
        descripcion="La agrupación mayor. Cada producto o servicio cuelga de uno."
        recurso="insumos"
        filas={insumos.data ?? []}
        error={insumos.error}
        puedeEditar={puedeEditar}
        cuerpoAlta={{ departamentoId }}
      />

      <Seccion
        titulo="Productos y servicios"
        descripcion="Lo que se registra en la bitácora y lo que se planifica."
        recurso="productos-servicio"
        filas={productos.data ?? []}
        error={productos.error}
        puedeEditar={puedeEditar}
        insumos={insumos.data ?? []}
      />

      <Seccion
        titulo="Gerencias requirientes"
        descripcion="Quién pidió el trabajo."
        recurso="gerencias-requirientes"
        filas={gerencias.data ?? []}
        error={gerencias.error}
        puedeEditar={puedeEditar}
        cuerpoAlta={{ departamentoId }}
      />
    </main>
  );
}

type FilaCatalogo = InsumoDto | ProductoServicioDto | GerenciaRequirienteDto;

function useCatalogoMutations(recurso: string) {
  const cliente = useQueryClient();
  const refrescar = () => cliente.invalidateQueries({ queryKey: ["actividades"] });
  const crear = useMutation<unknown, ApiError, Record<string, unknown>>({
    mutationFn: (cuerpo) => api(`/actividades/${recurso}`, { metodo: "POST", cuerpo }),
    onSuccess: refrescar,
  });
  const alternar = useMutation<unknown, ApiError, { id: number; activo: boolean }>({
    mutationFn: ({ id, activo }) =>
      api(`/actividades/${recurso}/${id}`, { metodo: "PATCH", cuerpo: { activo } }),
    onSuccess: refrescar,
  });
  return { crear, alternar };
}

function Seccion({
  titulo,
  descripcion,
  recurso,
  filas,
  error,
  puedeEditar,
  cuerpoAlta,
  insumos,
}: {
  titulo: string;
  descripcion: string;
  recurso: string;
  filas: FilaCatalogo[];
  error: ApiError | null;
  puedeEditar: boolean;
  cuerpoAlta?: Record<string, unknown>;
  /** Sólo para productos: hay que elegir de qué insumo cuelgan. */
  insumos?: InsumoDto[];
}) {
  const { crear, alternar } = useCatalogoMutations(recurso);
  const [nombre, setNombre] = useState("");
  const [insumoId, setInsumoId] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const base = insumos === undefined ? cuerpoAlta : { insumoId: Number(insumoId) };
    crear.mutate({ ...base, nombre: nombre.trim() }, { onSuccess: () => setNombre("") });
  };

  return (
    <section className="mt-6">
      <h2 className="text-sm font-medium">{titulo}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>

      {puedeEditar ? (
        <form onSubmit={enviar} className="mt-3 flex flex-wrap items-end gap-3">
          {insumos !== undefined ? (
            <div className="space-y-1.5">
              <Label htmlFor={`insumo-${recurso}`}>Insumo</Label>
              <Select
                id={`insumo-${recurso}`}
                required
                value={insumoId}
                onChange={(e) => setInsumoId(e.target.value)}
                className="w-64"
              >
                <option value="">Elegir…</option>
                {insumos
                  .filter((i) => i.activo)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre}
                    </option>
                  ))}
              </Select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor={`nombre-${recurso}`}>Nombre</Label>
            <Input
              id={`nombre-${recurso}`}
              required
              className="w-80"
              placeholder="Nombre nuevo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? "Agregando…" : "Agregar"}
          </Button>
        </form>
      ) : null}

      {crear.error || alternar.error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{(crear.error ?? alternar.error)?.message}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {filas.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className={f.activo ? "text-sm" : "text-sm text-muted-foreground line-through"}>
                {f.nombre}
                {"insumo" in f ? (
                  <span className="ml-2 text-xs text-muted-foreground">{f.insumo.nombre}</span>
                ) : null}
              </span>
              {puedeEditar ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={alternar.isPending}
                  onClick={() => alternar.mutate({ id: f.id, activo: !f.activo })}
                >
                  {f.activo ? "Desactivar" : "Reactivar"}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
