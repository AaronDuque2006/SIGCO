"use client";

import type { CatalogosUsuarioDto, UsuarioDto } from "@sicog/shared-types";
import type { ActualizarUsuarioInput } from "@sicog/shared-validators";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useActualizarUsuario, useCandidatosSupervisor } from "@/lib/usuarios";

/**
 * `UsuarioDto` trae el puesto y el departamento por **nombre**, no por id
 * (§13), así que para arrancar los desplegables hay que buscarlos en el
 * catálogo. Funciona porque los dos catálogos tienen nombres distintos entre
 * sí, que es el mismo supuesto del que ya depende el hub para decidir quién
 * edita qué (decisión #59).
 */
const idPorNombre = (opciones: { id: number; nombre: string }[], nombre: string | null) =>
  nombre === null ? null : (opciones.find((o) => o.nombre === nombre)?.id ?? null);

export function FormularioEdicion({
  usuario,
  catalogos,
  esYo,
  onCerrar,
}: {
  usuario: UsuarioDto;
  catalogos: CatalogosUsuarioDto;
  esYo: boolean;
  onCerrar: () => void;
}) {
  const actualizar = useActualizarUsuario();
  const candidatos = useCandidatosSupervisor();

  const puestoActual = idPorNombre(catalogos.puestos, usuario.puesto);
  const departamentoActual = idPorNombre(catalogos.departamentos, usuario.departamento);
  const supervisorActual = usuario.supervisor?.id ?? null;

  const [puestoId, setPuestoId] = useState(String(puestoActual ?? ""));
  const [departamentoId, setDepartamentoId] = useState(String(departamentoActual ?? ""));
  const [supervisorId, setSupervisorId] = useState(String(supervisorActual ?? ""));
  const [esSuperadmin, setEsSuperadmin] = useState(usuario.esSuperadmin);

  const aId = (v: string) => (v === "" ? null : Number(v));

  // Sólo viaja lo que cambió: el PATCH es parcial y rechaza un cuerpo vacío
  // ("No hay nada que actualizar"). Mandar los cuatro campos siempre también
  // funcionaría, pero dejaría escrituras que no cambian nada.
  const cambios: ActualizarUsuarioInput = {};
  if (aId(puestoId) !== puestoActual && puestoId !== "") cambios.puestoId = Number(puestoId);
  if (aId(departamentoId) !== departamentoActual) cambios.departamentoId = aId(departamentoId);
  if (aId(supervisorId) !== supervisorActual) cambios.supervisorId = aId(supervisorId);
  if (esSuperadmin !== usuario.esSuperadmin) cambios.esSuperadmin = esSuperadmin;

  const hayCambios = Object.keys(cambios).length > 0;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hayCambios) return;
    actualizar.mutate({ id: usuario.id, datos: cambios }, { onSuccess: onCerrar });
  };

  return (
    <form onSubmit={enviar} className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-medium">
        Editar <span className="font-mono">{usuario.nombre}</span>
      </h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`puesto-${usuario.id}`}>Puesto</Label>
          <Select
            id={`puesto-${usuario.id}`}
            value={puestoId}
            onChange={(e) => setPuestoId(e.target.value)}
          >
            {catalogos.puestos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`departamento-${usuario.id}`}>Departamento</Label>
          <Select
            id={`departamento-${usuario.id}`}
            value={departamentoId}
            onChange={(e) => setDepartamentoId(e.target.value)}
          >
            <option value="">Ninguno</option>
            {catalogos.departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Obligatorio salvo para Gerente y superadmin.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`supervisor-${usuario.id}`}>Supervisor</Label>
          <Select
            id={`supervisor-${usuario.id}`}
            value={supervisorId}
            onChange={(e) => setSupervisorId(e.target.value)}
            disabled={candidatos.isPending}
          >
            <option value="">Ninguno</option>
            {(candidatos.data ?? [])
              .filter((c) => c.id !== usuario.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.puesto}
                </option>
              ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            {candidatos.isPending ? "Cargando…" : "De quién depende en la cadena de mando."}
          </p>
        </div>
      </div>

      {/* Nadie puede quitarse a sí mismo el superadmin (§13.2): con esa regla y
          la de no bloquear la propia cuenta es imposible dejar al sistema sin
          ningún superadmin activo. El backend lo hace cumplir igual. */}
      <label
        className="mt-3 flex items-center gap-2 text-sm"
        title={esYo ? "No puede quitarse a sí mismo el superadmin" : undefined}
      >
        <input
          type="checkbox"
          checked={esSuperadmin}
          disabled={esYo}
          onChange={(e) => setEsSuperadmin(e.target.checked)}
          className="size-4 accent-primary disabled:opacity-50"
        />
        Superadmin — administra cuentas, no datos operativos
      </label>

      {actualizar.error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{actualizar.error.message}</AlertDescription>
        </Alert>
      ) : null}
      {candidatos.error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>
            No se pudo cargar la lista de supervisores: {candidatos.error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={!hayCambios || actualizar.isPending}>
          {actualizar.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
