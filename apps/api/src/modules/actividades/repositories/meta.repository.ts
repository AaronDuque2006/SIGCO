import { Prisma } from "@sicog/db";
import type { MatrizMetasDto, ParticipacionDto, PlanVsRealDto } from "@sicog/shared-types";
import type { CeldaMetaInput } from "@sicog/shared-validators";
import { prisma } from "../../../shared/prisma-client.js";
import { traducirEscritura } from "../../../shared/prisma-errores.js";

/** El estatus que **no** cuenta en el REAL (decisión #83): una tarea asignada
 *  y sin empezar no es trabajo hecho. `EN PROCESO` sí cuenta, que es lo que el
 *  workbook prueba. */
const ESTATUS_SIN_EJECUTAR = "RECIBIDO";

export interface IMetaActividadRepository {
  matriz(anio: number, departamentoId?: number): Promise<MatrizMetasDto>;
  reemplazarAnio(anio: number, departamentoId: number, celdas: CeldaMetaInput[]): Promise<void>;
  actualizarCelda(
    id: bigint,
    datos: { cantidadMeta?: number; hhMeta?: number },
  ): Promise<{ id: bigint }>;
  departamentoDeCelda(id: bigint): Promise<number | null>;
  departamentosDeProductos(ids: number[]): Promise<Map<number, number>>;
  planVsReal(anio: number, departamentoId?: number): Promise<PlanVsRealDto>;
  participacion(anio: number, mes: number, departamentoId?: number): Promise<ParticipacionDto>;
}

const productoSelect = {
  id: true,
  nombre: true,
  descripcionActividad: true,
  activo: true,
  insumo: {
    select: {
      id: true,
      nombre: true,
      activo: true,
      departamento: { select: { id: true, nombre: true } },
    },
  },
} as const;

type FilaProducto = Prisma.ProductoServicioGetPayload<{ select: typeof productoSelect }>;

const aProducto = (p: FilaProducto) => ({
  id: p.id,
  insumo: {
    id: p.insumo.id,
    departamento: p.insumo.departamento,
    nombre: p.insumo.nombre,
    activo: p.insumo.activo,
  },
  nombre: p.nombre,
  descripcionActividad: p.descripcionActividad,
  activo: p.activo,
});

/** Una fila agregada del REAL, tal como la devuelve la consulta. */
interface FilaReal {
  producto_servicio_id: number;
  mes: number;
  cantidad: bigint | number;
  hh: Prisma.Decimal | null;
}

export class PrismaMetaActividadRepository implements IMetaActividadRepository {
  async matriz(anio: number, departamentoId?: number): Promise<MatrizMetasDto> {
    const productos = await prisma.productoServicio.findMany({
      where: departamentoId === undefined ? {} : { insumo: { departamentoId } },
      select: productoSelect,
      orderBy: [{ insumo: { nombre: "asc" } }, { nombre: "asc" }],
    });

    const metas = await prisma.actividadMeta.findMany({
      where: { anio, productoServicioId: { in: productos.map((p) => p.id) } },
      select: { id: true, productoServicioId: true, mes: true, cantidadMeta: true, hhMeta: true },
      orderBy: { mes: "asc" },
    });

    const porProducto = new Map<number, typeof metas>();
    for (const m of metas) {
      const lista = porProducto.get(m.productoServicioId) ?? [];
      lista.push(m);
      porProducto.set(m.productoServicioId, lista);
    }

    return {
      anio,
      filas: productos.map((p) => ({
        productoServicio: aProducto(p),
        // Los meses sin fila **no se rellenan en cero**: un mes sin plan y un
        // mes planificado en cero son cosas distintas, y el cumplimiento
        // necesita distinguirlos para no inventar un incumplimiento donde
        // nunca hubo meta.
        meses: (porProducto.get(p.id) ?? []).map((m) => ({
          id: String(m.id),
          mes: m.mes,
          cantidadMeta: m.cantidadMeta,
          hhMeta: Number(m.hhMeta),
        })),
      })),
    };
  }

  /**
   * El año se reemplaza entero, en una transacción.
   *
   * No es un parche incremental porque el plan es una pieza: cargarlo de a
   * celdas dejaría un año a medias si algo falla en el medio, y el reporte de
   * cumplimiento estaría comparando contra un plan que nadie terminó de
   * escribir.
   */
  async reemplazarAnio(
    anio: number,
    departamentoId: number,
    celdas: CeldaMetaInput[],
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const delDepartamento = await tx.productoServicio.findMany({
          where: { insumo: { departamentoId } },
          select: { id: true },
        });
        await tx.actividadMeta.deleteMany({
          where: { anio, productoServicioId: { in: delDepartamento.map((p) => p.id) } },
        });
        await tx.actividadMeta.createMany({
          data: celdas.map((c) => ({
            productoServicioId: c.productoServicioId,
            anio,
            mes: c.mes,
            cantidadMeta: c.cantidadMeta,
            hhMeta: c.hhMeta,
          })),
        });
      });
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "El plan trae dos veces el mismo producto y mes",
        noExiste: "Algún producto/servicio del plan no existe",
      });
    }
  }

  async actualizarCelda(
    id: bigint,
    datos: { cantidadMeta?: number; hhMeta?: number },
  ): Promise<{ id: bigint }> {
    try {
      return await prisma.actividadMeta.update({ where: { id }, data: datos, select: { id: true } });
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ya existe esa meta",
        noExiste: "No existe la meta",
      });
    }
  }

  async departamentoDeCelda(id: bigint): Promise<number | null> {
    const f = await prisma.actividadMeta.findUnique({
      where: { id },
      select: { productoServicio: { select: { insumo: { select: { departamentoId: true } } } } },
    });
    return f?.productoServicio.insumo.departamentoId ?? null;
  }

  async departamentosDeProductos(ids: number[]): Promise<Map<number, number>> {
    const filas = await prisma.productoServicio.findMany({
      where: { id: { in: ids } },
      select: { id: true, insumo: { select: { departamentoId: true } } },
    });
    return new Map(filas.map((f) => [f.id, f.insumo.departamentoId]));
  }

  /**
   * El REAL agregado por producto y por mes.
   *
   * **Se agrupa por `fecha_hasta`**, que es la regla que salió de la auditoría
   * (§14.4): la columna `MES` del workbook difiere del mes de `DESDE` en 2 de
   * 176 filas, y en las dos coincide con el de `HASTA`. Agrupar por
   * `fecha_desde` daría números distintos de los que el área maneja.
   *
   * `$queryRaw` parametrizado —nunca concatenación (§3)— porque es una
   * agregación con `GROUP BY` que Prisma no expresa sin varias vueltas.
   */
  private async realPorMes(anio: number, departamentoId?: number): Promise<FilaReal[]> {
    return prisma.$queryRaw<FilaReal[]>`
      SELECT r.producto_servicio_id,
             EXTRACT(MONTH FROM r.fecha_hasta)::int AS mes,
             SUM(r.cantidad)::bigint                AS cantidad,
             COALESCE(SUM(r.hh), 0)                 AS hh
        FROM actividades_registro r
        JOIN productos_servicio p ON p.id = r.producto_servicio_id
        JOIN insumos i           ON i.id = p.insumo_id
       WHERE EXTRACT(YEAR FROM r.fecha_hasta) = ${anio}
         AND r.estatus <> ${ESTATUS_SIN_EJECUTAR}
         AND (${departamentoId ?? null}::int IS NULL OR i.departamento_id = ${departamentoId ?? null}::int)
       GROUP BY r.producto_servicio_id, EXTRACT(MONTH FROM r.fecha_hasta)
    `;
  }

  async planVsReal(anio: number, departamentoId?: number): Promise<PlanVsRealDto> {
    const [matriz, reales] = await Promise.all([
      this.matriz(anio, departamentoId),
      this.realPorMes(anio, departamentoId),
    ]);

    const real = new Map<string, { cantidad: number; hh: number }>();
    for (const r of reales) {
      real.set(`${r.producto_servicio_id}|${r.mes}`, {
        cantidad: Number(r.cantidad),
        hh: r.hh === null ? 0 : Number(r.hh),
      });
    }

    // Porcentaje, no fracción. `null` cuando no hay meta o la meta es cero:
    // el workbook no ofrece respuesta para ese caso porque la división no
    // existe, así que inventar un 100% o un infinito sería peor que decir que
    // no hay con qué comparar.
    const cumplimiento = (real: number, meta: number | null): number | null =>
      meta === null || meta === 0 ? null : Math.round((real / meta) * 1000) / 10;

    return {
      anio,
      filas: matriz.filas.map((fila) => {
        const porMes = new Map(fila.meses.map((m) => [m.mes, m]));
        const meses = Array.from({ length: 12 }, (_, i) => {
          const mes = i + 1;
          const meta = porMes.get(mes);
          const r = real.get(`${fila.productoServicio.id}|${mes}`) ?? { cantidad: 0, hh: 0 };
          return {
            mes,
            cantidadMeta: meta?.cantidadMeta ?? null,
            hhMeta: meta?.hhMeta ?? null,
            cantidadReal: r.cantidad,
            hhReal: r.hh,
            cumplimientoCantidad: cumplimiento(r.cantidad, meta?.cantidadMeta ?? null),
            cumplimientoHh: cumplimiento(r.hh, meta?.hhMeta ?? null),
          };
        });

        const sumar = (leer: (m: (typeof meses)[number]) => number | null): number =>
          meses.reduce((t, m) => t + (leer(m) ?? 0), 0);

        return {
          productoServicio: fila.productoServicio,
          meses,
          cantidadMetaAnual: sumar((m) => m.cantidadMeta),
          hhMetaAnual: Math.round(sumar((m) => m.hhMeta) * 100) / 100,
          cantidadRealAnual: sumar((m) => m.cantidadReal),
          hhRealAnual: Math.round(sumar((m) => m.hhReal) * 100) / 100,
        };
      }),
    };
  }

  /**
   * Cuánto pesa cada actividad sobre el total del mes.
   *
   * Es el **único** porcentaje que el workbook sí tiene (`D6/$D$18`), pero ahí
   * está tecleado a mano en una hoja que no está enlazada y que lista 12
   * actividades contra 32 de la hoja de plan — una tercera lista que puede
   * discrepar de las otras dos sin que nadie lo note. Acá se calcula.
   */
  async participacion(
    anio: number,
    mes: number,
    departamentoId?: number,
  ): Promise<ParticipacionDto> {
    const [reales, productos] = await Promise.all([
      this.realPorMes(anio, departamentoId),
      prisma.productoServicio.findMany({
        where: departamentoId === undefined ? {} : { insumo: { departamentoId } },
        select: productoSelect,
      }),
    ]);

    const delMes = reales.filter((r) => r.mes === mes);
    const totalCantidad = delMes.reduce((t, r) => t + Number(r.cantidad), 0);
    const totalHh = delMes.reduce((t, r) => t + (r.hh === null ? 0 : Number(r.hh)), 0);
    const porId = new Map(productos.map((p) => [p.id, p]));

    const parte = (valor: number, total: number): number =>
      total === 0 ? 0 : Math.round((valor / total) * 1000) / 10;

    return {
      anio,
      mes,
      totalCantidad,
      totalHh: Math.round(totalHh * 100) / 100,
      // Sólo las actividades **con movimiento** en el mes, como el workbook:
      // rellenar con ceros los 32 productos inventaría filas que el área no ve.
      filas: delMes
        .filter((r) => porId.has(r.producto_servicio_id))
        .map((r) => {
          const cantidad = Number(r.cantidad);
          const hh = r.hh === null ? 0 : Number(r.hh);
          return {
            productoServicio: aProducto(porId.get(r.producto_servicio_id)!),
            cantidad,
            hh: Math.round(hh * 100) / 100,
            participacionCantidad: parte(cantidad, totalCantidad),
            participacionHh: parte(hh, totalHh),
          };
        })
        .sort((a, b) => b.cantidad - a.cantidad),
    };
  }
}

export const metaActividadRepository = new PrismaMetaActividadRepository();
