"use client";

import type { ContactoDto } from "@sicog/shared-types";
import { useState } from "react";
import { AvisoSoloConsulta } from "@/components/aviso-solo-consulta";
import { TablaDesplazable, TH } from "@/components/tabla-desplazable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEPARTAMENTO_DESPACHO,
  puedeEditarDespacho,
  useActualizarContacto,
  useContactos,
  useCrearContacto,
  useEliminarContacto,
  useTodasLasFuentes,
  useTodosLosClientes,
  type FiltrosContactos,
} from "@/lib/despacho";
import { useSesion } from "@/lib/sesion";
import { EncabezadoVista } from "@/components/encabezado-vista";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";

const CAMPO =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Directorio telefónico de clientes y fuentes.
 *
 * Es el único recurso del módulo con **borrado físico** (§11.2): un teléfono
 * viejo no es un dato operativo histórico que haya que conservar, es ruido en
 * una lista que se consulta con apuro. Por eso el borrado pide confirmación en
 * el lugar en vez de ejecutarse de una: es la única acción de Despacho que no
 * se puede deshacer.
 */
export default function ContactosPage() {
  const { sesion } = useSesion();
  const puedeEditar = puedeEditarDespacho(sesion);

  const [q, setQ] = useState("");
  const [origen, setOrigen] = useState("");
  const [page, setPage] = useState(1);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);

  const clientes = useTodosLosClientes();
  const fuentes = useTodasLasFuentes();

  const [clase, id] = origen === "" ? ["", ""] : origen.split(":");
  const filtros: FiltrosContactos = {
    q,
    clienteId: clase === "c" ? Number(id) : null,
    fuenteId: clase === "f" ? Number(id) : null,
    page,
  };
  const lista = useContactos(filtros);
  const paginacion = lista.data?.pagination;

  const filtrar = (aplicar: () => void) => {
    aplicar();
    setPage(1);
  };

  return (
    <main>
      <EncabezadoVista
        titulo="Contactos"
        meta={
          paginacion
            ? `${paginacion.totalItems} ${paginacion.totalItems === 1 ? "contacto" : "contactos"}`
            : undefined
        }
      >
        Teléfonos de los operadores de cada cliente y cada fuente.
      </EncabezadoVista>

      <AvisoSoloConsulta sesion={sesion} departamento={DEPARTAMENTO_DESPACHO} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="q">Buscar</Label>
          <Input
            id="q"
            value={q}
            onChange={(e) => filtrar(() => setQ(e.target.value))}
            placeholder="Operador, teléfono, cliente o fuente"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="origen">Origen</Label>
          <select
            id="origen"
            value={origen}
            onChange={(e) => filtrar(() => setOrigen(e.target.value))}
            className={CAMPO}
          >
            <option value="">Todos</option>
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
          </select>
        </div>
      </div>

      {puedeEditar && !creando ? (
        <div className="mt-4">
          <Button
            onClick={() => {
              setCreando(true);
              setEditando(null);
            }}
          >
            <IconPlus size={16} stroke={2} aria-hidden />
            Nuevo contacto
          </Button>
        </div>
      ) : null}

      {creando ? (
        <div className="mt-4">
          <Formulario onListo={() => setCreando(false)} onCancelar={() => setCreando(false)} />
        </div>
      ) : null}

      {lista.isPending ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          Cargando…
        </p>
      ) : lista.error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{lista.error.message}</AlertDescription>
        </Alert>
      ) : lista.data.data.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Ningún contacto coincide con la búsqueda.
        </p>
      ) : (
        <TablaDesplazable anchoMinimo="min-w-[40rem]">
          <thead>
            <tr className="bg-card text-left text-xs text-muted-foreground">
              <th scope="col" className={TH}>Operador</th>
              <th scope="col" className={TH}>Teléfono</th>
              <th scope="col" className={TH}>Pertenece a</th>
              <th scope="col" className={`${TH} text-right`}>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.data.data.map((c) => (
              <Fila
                key={c.id}
                contacto={c}
                puedeEditar={puedeEditar}
                editando={editando === c.id}
                onEditar={() => {
                  setEditando(c.id);
                  setCreando(false);
                }}
                onListo={() => setEditando(null)}
              />
            ))}
          </tbody>
        </TablaDesplazable>
      )}

      {paginacion && paginacion.totalPages > 1 ? (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginación">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {paginacion.page} de {paginacion.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= paginacion.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </nav>
      ) : null}
    </main>
  );
}

function Fila({
  contacto: c,
  puedeEditar,
  editando,
  onEditar,
  onListo,
}: {
  contacto: ContactoDto;
  puedeEditar: boolean;
  editando: boolean;
  onEditar: () => void;
  onListo: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const eliminar = useEliminarContacto();
  const actualizar = useActualizarContacto(c.id);
  const [operador, setOperador] = useState(c.nombreOperador);
  const [telefono, setTelefono] = useState(c.telefono);

  const pertenece = c.cliente?.nombre ?? c.fuente?.nombre ?? "—";
  const clase = c.cliente ? "Cliente" : "Fuente";

  if (editando) {
    return (
      <tr className="border-b border-border last:border-0">
        <td className="px-3 py-1.5">
          <Input
            value={operador}
            aria-label="Nombre del operador"
            onChange={(e) => setOperador(e.target.value)}
          />
        </td>
        <td className="px-3 py-1.5">
          <Input
            value={telefono}
            aria-label="Teléfono"
            onChange={(e) => setTelefono(e.target.value)}
          />
        </td>
        {/* El origen no se edita: `updateContactoSchema` lo omite. Un teléfono
            que pasa de un cliente a otro es otro contacto. */}
        <td className="px-3 py-1.5 text-muted-foreground">{pertenece}</td>
        <td className="px-3 py-1.5 text-right">
          <span className="inline-flex gap-2">
            <Button
              disabled={actualizar.isPending}
              onClick={() =>
                actualizar.mutate(
                  { nombreOperador: operador.trim(), telefono: telefono.trim() },
                  { onSuccess: onListo },
                )
              }
            >
              Guardar
            </Button>
            <Button variant="outline" onClick={onListo} disabled={actualizar.isPending}>
              Cancelar
            </Button>
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <th scope="row" className="px-3 py-1.5 text-left font-normal">
        {c.nombreOperador}
      </th>
      <td className="px-3 py-1.5 font-mono tabular-nums">{c.telefono}</td>
      <td className="px-3 py-1.5 text-muted-foreground">
        {pertenece} <span className="text-xs">({clase})</span>
      </td>
      <td className="px-3 py-1.5 text-right">
        {!puedeEditar ? null : confirmando ? (
          // Se confirma en el lugar porque es la única acción de Despacho que
          // no se puede deshacer: el borrado es físico, la fila no vuelve.
          //
          // Los pesos visuales van al revés de lo intuitivo: **la confirmación
          // lleva el estilo destructivo y la salida lleva el normal**. Quien
          // llegó hasta acá puede haber llegado de más, así que la opción segura
          // tiene que ser la fácil de elegir y la irreversible la que se ve.
          <span className="inline-flex flex-wrap items-center justify-end gap-2">
            {eliminar.error ? (
              <span className="text-xs text-destructive" role="alert">
                {eliminar.error.message}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">¿Borrar definitivamente?</span>
            )}
            <Button
              variant="destructive"
              disabled={eliminar.isPending}
              onClick={() => eliminar.mutate(c.id)}
            >
              {eliminar.isPending ? "Borrando…" : "Sí, borrar"}
            </Button>
            <Button
              variant="outline"
              disabled={eliminar.isPending}
              onClick={() => {
                setConfirmando(false);
                eliminar.reset();
              }}
            >
              No
            </Button>
          </span>
        ) : (
          <span className="inline-flex gap-2">
            {/* Editar es la acción habitual de un directorio y se queda con el
                peso; eliminar es excepcional y va en `ghost` para no competir
                con ella a igualdad de forma. */}
            <Button variant="outline" onClick={onEditar}>
              <IconPencil size={14} stroke={1.75} aria-hidden />
              Editar
            </Button>
            <Button variant="ghost" onClick={() => setConfirmando(true)}>
              <IconTrash size={14} stroke={1.75} aria-hidden />
              Eliminar
            </Button>
          </span>
        )}
      </td>
    </tr>
  );
}

function Formulario({ onListo, onCancelar }: { onListo: () => void; onCancelar: () => void }) {
  const [origen, setOrigen] = useState("");
  const [operador, setOperador] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const clientes = useTodosLosClientes();
  const fuentes = useTodasLasFuentes();
  const crear = useCrearContacto();

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (origen === "") {
      setErrorLocal("Elegí el cliente o la fuente a la que pertenece.");
      return;
    }
    setErrorLocal(null);
    const [clase, id] = origen.split(":");
    crear.mutate(
      {
        nombreOperador: operador.trim(),
        telefono: telefono.trim(),
        ...(clase === "c" ? { clienteId: Number(id) } : { fuenteId: Number(id) }),
      },
      { onSuccess: onListo },
    );
  };

  return (
    <form onSubmit={enviar} className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium">Nuevo contacto</h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="nuevo-origen">Pertenece a</Label>
          <select
            id="nuevo-origen"
            value={origen}
            onChange={(e) => {
              setOrigen(e.target.value);
              setErrorLocal(null);
            }}
            className={CAMPO}
          >
            <option value="">Elegir…</option>
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
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nuevo-operador">Operador</Label>
          <Input
            id="nuevo-operador"
            required
            maxLength={200}
            value={operador}
            onChange={(e) => setOperador(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nuevo-telefono">Teléfono</Label>
          <Input
            id="nuevo-telefono"
            required
            maxLength={80}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="0412-5551234"
          />
        </div>
      </div>

      {errorLocal ?? crear.error?.message ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{errorLocal ?? crear.error?.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={crear.isPending}>
          {crear.isPending ? "Guardando…" : "Registrar contacto"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancelar} disabled={crear.isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
