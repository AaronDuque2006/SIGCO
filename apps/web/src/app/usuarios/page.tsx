"use client";

import type { UsuarioConPasswordTemporalDto, UsuarioDto } from "@sicog/shared-types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Encabezado } from "@/components/encabezado";
import { GuardiaSesion } from "@/components/guardia-sesion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSesion } from "@/lib/sesion";
import {
  useCatalogosUsuario,
  useEstablecerBloqueo,
  useListaUsuarios,
  useReiniciarPassword,
} from "@/lib/usuarios";
import { CredencialTemporal } from "./credencial-temporal";
import { FormularioAlta } from "./formulario-alta";

export default function UsuariosPage() {
  return (
    <GuardiaSesion>
      <Usuarios />
    </GuardiaSesion>
  );
}

function Usuarios() {
  const { sesion } = useSesion();
  const router = useRouter();

  // La puerta real es el 403 de `requireSuperadmin`, que además deja registro
  // en LOG_INTENTO_NO_AUTORIZADO. Esto sólo evita mostrarle una pantalla rota a
  // quien no corresponde.
  useEffect(() => {
    if (sesion && !sesion.esSuperadmin) router.replace("/");
  }, [sesion, router]);

  const [busqueda, setBusqueda] = useState("");
  const [soloBloqueados, setSoloBloqueados] = useState(false);
  const [page, setPage] = useState(1);
  const [credencial, setCredencial] = useState<UsuarioConPasswordTemporalDto | null>(null);

  const catalogos = useCatalogosUsuario();
  const lista = useListaUsuarios({ page, busqueda, soloBloqueados });

  if (!sesion?.esSuperadmin) return null;

  const paginacion = lista.data?.pagination;

  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-5xl p-4">
        <h1 className="mt-4 text-lg font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Las cuentas no se borran: dar de baja es bloquear, porque cada persona tiene
          auditoría e historial colgando.
        </p>

        {credencial ? (
          <CredencialTemporal resultado={credencial} onCerrar={() => setCredencial(null)} />
        ) : null}

        {catalogos.data ? (
          <FormularioAlta catalogos={catalogos.data} onCreado={setCredencial} />
        ) : null}

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="buscar">Buscar</Label>
            <Input
              id="buscar"
              placeholder="Nombre de usuario"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <label className="flex h-8 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soloBloqueados}
              onChange={(e) => {
                setSoloBloqueados(e.target.checked);
                setPage(1);
              }}
              className="size-4 accent-primary"
            />
            Sólo bloqueados
          </label>
        </div>

        {lista.error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{lista.error.message}</AlertDescription>
          </Alert>
        ) : lista.isPending ? (
          <p className="mt-6 text-sm text-muted-foreground" role="status">
            Cargando…
          </p>
        ) : (
          <Tabla
            usuarios={lista.data.data}
            yoId={sesion.id}
            onCredencial={setCredencial}
          />
        )}

        {paginacion && paginacion.totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Página {paginacion.page} de {paginacion.totalPages} · {paginacion.totalItems}{" "}
              usuarios
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={paginacion.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={paginacion.page >= paginacion.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}

function Tabla({
  usuarios,
  yoId,
  onCredencial,
}: {
  usuarios: UsuarioDto[];
  yoId: number;
  onCredencial: (r: UsuarioConPasswordTemporalDto) => void;
}) {
  const bloqueo = useEstablecerBloqueo();
  const reinicio = useReiniciarPassword();

  if (usuarios.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">Ningún usuario coincide.</p>;
  }

  return (
    <>
      {bloqueo.error || reinicio.error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            {(bloqueo.error ?? reinicio.error)?.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-card text-left text-xs text-muted-foreground">
              <th scope="col" className="px-3 py-2 font-medium">Usuario</th>
              <th scope="col" className="px-3 py-2 font-medium">Puesto</th>
              <th scope="col" className="px-3 py-2 font-medium">Departamento</th>
              <th scope="col" className="px-3 py-2 font-medium">Estado</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const yo = u.id === yoId;
              return (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    {u.nombre}
                    {u.esSuperadmin ? (
                      <span className="ml-2 rounded-md bg-accent-soft px-1.5 py-0.5 text-xs text-primary">
                        Superadmin
                      </span>
                    ) : null}
                    {yo ? <span className="ml-2 text-xs text-muted-foreground">(usted)</span> : null}
                  </th>
                  <td className="px-3 py-2 text-muted-foreground">{u.puesto}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.departamento ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Estado usuario={u} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reinicio.isPending}
                        onClick={() =>
                          reinicio.mutate(u.id, { onSuccess: onCredencial })
                        }
                      >
                        Reiniciar clave
                      </Button>
                      {/* No puede bloquearse a sí mismo: con esa regla y la de no
                          quitarse el superadmin, es imposible dejar al sistema sin
                          ningún superadmin activo. */}
                      <Button
                        variant={u.bloqueado ? "outline" : "destructive"}
                        size="sm"
                        disabled={yo || bloqueo.isPending}
                        title={yo ? "No puede bloquear su propia cuenta" : undefined}
                        onClick={() =>
                          bloqueo.mutate({ id: u.id, bloqueado: !u.bloqueado })
                        }
                      >
                        {u.bloqueado ? "Desbloquear" : "Bloquear"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Estado({ usuario }: { usuario: UsuarioDto }) {
  if (usuario.bloqueado) {
    return (
      <span className="rounded-md bg-danger-soft px-1.5 py-0.5 text-xs text-destructive">
        Bloqueado
      </span>
    );
  }
  if (usuario.debeCambiarPassword) {
    return (
      <span className="rounded-md bg-warn-soft px-1.5 py-0.5 text-xs text-warn">
        Clave temporal
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">Activo</span>;
}
