"use client";

import type { NovedadOperativaDto } from "@sicog/shared-types";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  isoALocal,
  localAIso,
  useActualizarNovedad,
  useCrearNovedad,
  useTiposNovedad,
  useTodasLasFuentes,
  useTodosLosClientes,
} from "@/lib/despacho";

const AREA =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface Borrador {
  origen: string;
  tipo: string;
  impacto: string;
  inicio: string;
  fin: string;
  causa: string;
  mmpcedAfectados: string;
}

const vacio = (): Borrador => ({
  origen: "",
  tipo: "",
  impacto: "",
  inicio: "",
  fin: "",
  causa: "",
  mmpcedAfectados: "",
});

const desde = (n: NovedadOperativaDto): Borrador => ({
  origen: n.cliente ? `c:${n.cliente.id}` : n.fuente ? `f:${n.fuente.id}` : "",
  tipo: n.tipo,
  impacto: n.impacto,
  inicio: isoALocal(n.inicio),
  fin: n.fin ? isoALocal(n.fin) : "",
  causa: n.causa,
  mmpcedAfectados: String(n.mmpcedAfectados),
});

/**
 * Alta y edición de una novedad, el mismo formulario para las dos.
 *
 * La diferencia real es el **origen**: al crear se elige cliente o fuente, y
 * al editar no se puede mover (`updateNovedadSchema` omite los dos campos).
 * Cambiar de origen sería otra novedad, no una corrección de esta, así que el
 * selector se muestra deshabilitado en vez de desaparecer: quien edita tiene
 * que seguir viendo de qué es la novedad.
 */
export function FormularioNovedad({
  novedad,
  onListo,
  onCancelar,
}: {
  /** `undefined` para un alta. */
  novedad?: NovedadOperativaDto;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const editando = novedad !== undefined;
  const [b, setB] = useState<Borrador>(() => (novedad ? desde(novedad) : vacio()));
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const clientes = useTodosLosClientes();
  const fuentes = useTodasLasFuentes();
  const tipos = useTiposNovedad();
  const crear = useCrearNovedad();
  const actualizar = useActualizarNovedad(novedad?.id ?? "");
  const enviando = crear.isPending || actualizar.isPending;
  const errorServidor = (crear.error ?? actualizar.error)?.message ?? null;

  const campo = <K extends keyof Borrador>(k: K, v: Borrador[K]) => {
    setB((actual) => ({ ...actual, [k]: v }));
    setErrorLocal(null);
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();

    // El "exactamente uno" lo exige el backend y el CHECK de la base; acá se
    // atrapa antes para no gastar un 422 en lo que la pantalla ya sabe.
    if (!editando && b.origen === "") {
      setErrorLocal("Elegí el cliente o la fuente de la novedad.");
      return;
    }
    if (b.inicio === "") {
      setErrorLocal("Falta la hora de inicio.");
      return;
    }
    if (b.fin !== "" && new Date(b.fin).getTime() < new Date(b.inicio).getTime()) {
      setErrorLocal("El fin no puede ser anterior al inicio.");
      return;
    }
    const mmpced = Number(b.mmpcedAfectados.trim().replace(",", "."));
    if (!Number.isFinite(mmpced) || mmpced < 0) {
      setErrorLocal("Los MMPCED afectados tienen que ser un número no negativo.");
      return;
    }

    const comunes = {
      tipo: b.tipo.trim(),
      impacto: b.impacto.trim(),
      inicio: localAIso(b.inicio),
      fin: b.fin === "" ? null : localAIso(b.fin),
      causa: b.causa.trim(),
      mmpcedAfectados: mmpced,
    };

    if (editando) {
      actualizar.mutate(comunes, { onSuccess: onListo });
      return;
    }
    const [clase, id] = b.origen.split(":");
    crear.mutate(
      {
        ...comunes,
        ...(clase === "c" ? { clienteId: Number(id) } : { fuenteId: Number(id) }),
      },
      { onSuccess: onListo },
    );
  };

  return (
    <form onSubmit={enviar} className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium">
        {editando ? "Editar novedad" : "Nueva novedad"}
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="origen">Origen</Label>
          <Select
            id="origen"
            value={b.origen}
            disabled={editando}
            onChange={(e) => campo("origen", e.target.value)}
            className="disabled:opacity-60"
            aria-describedby={editando ? "origen-fijo" : undefined}
          >
            <option value="">Elegir cliente o fuente…</option>
            <optgroup label="Clientes">
              {(clientes.data ?? []).map((c) => (
                <option key={`c${c.id}`} value={`c:${c.id}`}>
                  {c.nombre}
                </option>
              ))}
            </optgroup>
            <optgroup label="Fuentes">
              {(fuentes.data ?? []).map((f) => (
                <option key={`f${f.id}`} value={`f:${f.id}`}>
                  {f.nombre}
                </option>
              ))}
            </optgroup>
          </Select>
          {editando ? (
            <p id="origen-fijo" className="text-xs text-muted-foreground">
              El origen no se puede cambiar: sería otra novedad, no una corrección de
              esta.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <Input
            id="tipo"
            list="tipos-novedad"
            required
            maxLength={120}
            value={b.tipo}
            onChange={(e) => campo("tipo", e.target.value)}
            placeholder="Corrida de Pig"
          />
          {/* Sugerencias de lo ya escrito por el área. El catálogo cerrado de
              `tipo` sigue sin definirse (§9.2 #4), así que no se inventa uno. */}
          <datalist id="tipos-novedad">
            {(tipos.data?.data ?? []).map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mmpced">MMPCED afectados</Label>
          <Input
            id="mmpced"
            inputMode="decimal"
            required
            value={b.mmpcedAfectados}
            onChange={(e) => campo("mmpcedAfectados", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inicio">Inicio</Label>
          <Input
            id="inicio"
            type="datetime-local"
            required
            value={b.inicio}
            onChange={(e) => campo("inicio", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fin">Fin</Label>
          <Input
            id="fin"
            type="datetime-local"
            value={b.fin}
            onChange={(e) => campo("fin", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Dejalo vacío si todavía no terminó.
          </p>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="causa">Causa</Label>
          <textarea
            id="causa"
            required
            rows={2}
            value={b.causa}
            onChange={(e) => campo("causa", e.target.value)}
            className={AREA}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="impacto">Impacto</Label>
          <textarea
            id="impacto"
            required
            rows={2}
            value={b.impacto}
            onChange={(e) => campo("impacto", e.target.value)}
            className={AREA}
          />
        </div>
      </div>

      {errorLocal ?? errorServidor ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{errorLocal ?? errorServidor}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Registrar novedad"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
