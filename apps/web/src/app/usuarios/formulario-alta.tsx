"use client";

import type { CatalogosUsuarioDto } from "@sicog/shared-types";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCrearUsuario } from "@/lib/usuarios";
import type { UsuarioConPasswordTemporalDto } from "@sicog/shared-types";

const claseSelect =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function FormularioAlta({
  catalogos,
  onCreado,
}: {
  catalogos: CatalogosUsuarioDto;
  onCreado: (r: UsuarioConPasswordTemporalDto) => void;
}) {
  const crear = useCrearUsuario();
  const [nombre, setNombre] = useState("");
  const [puestoId, setPuestoId] = useState(String(catalogos.puestos.at(-1)?.id ?? ""));
  const [departamentoId, setDepartamentoId] = useState("");
  const [esSuperadmin, setEsSuperadmin] = useState(false);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    crear.mutate(
      {
        nombre: nombre.trim().toLowerCase(),
        puestoId: Number(puestoId),
        departamentoId: departamentoId === "" ? null : Number(departamentoId),
        supervisorId: null,
        esSuperadmin,
      },
      {
        onSuccess: (r) => {
          onCreado(r);
          setNombre("");
          setDepartamentoId("");
          setEsSuperadmin(false);
        },
      },
    );
  };

  return (
    <form onSubmit={enviar} className="mt-4 rounded-lg border border-border bg-card p-4">
      <h2 className="font-medium">Crear usuario</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="nuevo-nombre">Nombre de usuario</Label>
          <Input
            id="nuevo-nombre"
            required
            placeholder="nombre.apellido"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Sólo letras, números, punto, guion y guion bajo. Se guarda en minúsculas.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nuevo-puesto">Puesto</Label>
          <select
            id="nuevo-puesto"
            value={puestoId}
            onChange={(e) => setPuestoId(e.target.value)}
            className={claseSelect}
          >
            {catalogos.puestos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nuevo-departamento">Departamento</Label>
          <select
            id="nuevo-departamento"
            value={departamentoId}
            onChange={(e) => setDepartamentoId(e.target.value)}
            className={claseSelect}
          >
            <option value="">Ninguno</option>
            {catalogos.departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Obligatorio salvo para Gerente y superadmin.
          </p>
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={esSuperadmin}
          onChange={(e) => setEsSuperadmin(e.target.checked)}
          className="size-4 accent-primary"
        />
        Superadmin — administra cuentas, no datos operativos
      </label>

      {crear.error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{crear.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" className="mt-4" disabled={crear.isPending}>
        {crear.isPending ? "Creando…" : "Crear usuario"}
      </Button>
    </form>
  );
}
