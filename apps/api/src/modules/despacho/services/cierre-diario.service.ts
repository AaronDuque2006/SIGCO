import { Prisma } from "@sicog/db";
import {
  cierreDiarioRepository,
  type ICierreDiarioRepository,
  type ValoresDelDia,
} from "../repositories/cierre-diario.repository.js";

// Si el proceso estuvo caído mucho tiempo, encadenar el carry-forward día por
// día generaría una montaña de filas inventadas. Se corta y se avisa: es
// preferible que alguien mire qué pasó a rellenar meses en silencio.
const MAX_DIAS_A_RECUPERAR = 31;

export interface ResumenCierre {
  diasAbiertos: string[];
  diasCerrados: string[];
  cierresCreados: number;
  cierresRecalculados: number;
  truncado: boolean;
}

export const sumarDias = (fecha: string, dias: number): string => {
  const d = new Date(`${fecha}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

// El día operativo es el de Venezuela, no el del reloj del servidor.
export const hoyEn = (timeZone: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

// Media aritmética simple, sin ponderar por cuánto tiempo estuvo vigente cada
// valor (decisión #34). Se calcula en Decimal, no en float, y se redondea a
// las 4 posiciones que admite la columna.
const media = (valores: Prisma.Decimal[]): Prisma.Decimal =>
  valores
    .reduce((acc, v) => acc.add(v), new Prisma.Decimal(0))
    .dividedBy(valores.length)
    .toDecimalPlaces(4);

export class CierreDiarioService {
  constructor(private readonly repo: ICierreDiarioRepository) {}

  async ejecutarPendientes(hoy: string): Promise<ResumenCierre> {
    const resumen: ResumenCierre = {
      diasAbiertos: [],
      diasCerrados: [],
      cierresCreados: 0,
      cierresRecalculados: 0,
      truncado: false,
    };

    const truncado = await this.abrirDiasFaltantes(hoy, resumen);
    resumen.truncado = truncado;

    // Sólo se cierran días ya completos: el de hoy todavía puede cambiar.
    for (const fecha of await this.repo.fechasConPuntualHasta(sumarDias(hoy, -1))) {
      const cambios = await this.cerrarDia(fecha);
      if (cambios.creados > 0 || cambios.recalculados > 0) resumen.diasCerrados.push(fecha);
      resumen.cierresCreados += cambios.creados;
      resumen.cierresRecalculados += cambios.recalculados;
    }

    return resumen;
  }

  private async abrirDiasFaltantes(hoy: string, resumen: ResumenCierre): Promise<boolean> {
    const ultima = await this.repo.ultimaFechaConPuntual();
    if (!ultima || ultima >= hoy) return false;

    let desde = ultima;
    let recuperados = 0;
    while (desde < hoy) {
      if (recuperados >= MAX_DIAS_A_RECUPERAR) {
        console.warn(
          `[cierre] Se detuvo el carry-forward tras ${MAX_DIAS_A_RECUPERAR} días (último con datos: ${ultima}). Revisar manualmente.`,
        );
        return true;
      }
      const hacia = sumarDias(desde, 1);
      const creadas = await this.repo.copiarPuntualAlDiaSiguiente(desde, hacia);
      if (creadas > 0) resumen.diasAbiertos.push(hacia);
      desde = hacia;
      recuperados++;
    }
    return false;
  }

  private async cerrarDia(fecha: string): Promise<{ creados: number; recalculados: number }> {
    const [valoresPorCliente, existentes] = await Promise.all([
      this.repo.valoresPuntualDelDia(fecha),
      this.repo.cierresDelDia(fecha),
    ]);
    const porCliente = new Map(existentes.map((c) => [c.clienteId, c]));

    const nuevos: { clienteId: number; volumenMmpced: Prisma.Decimal; usuarioId: number }[] = [];
    const correcciones: { id: bigint; volumenMmpced: Prisma.Decimal; usuarioId: number }[] = [];

    for (const fila of valoresPorCliente) {
      const valor = media(fila.valores);
      const existente = porCliente.get(fila.clienteId);
      if (!existente) {
        nuevos.push({ clienteId: fila.clienteId, volumenMmpced: valor, usuarioId: fila.usuarioId });
      } else if (!existente.volumenMmpced.equals(valor)) {
        // Sólo si cambió: correr el job de nuevo con los mismos datos no debe
        // ensuciar el historial con filas idénticas.
        correcciones.push({ id: existente.id, volumenMmpced: valor, usuarioId: fila.usuarioId });
      }
    }

    await this.repo.guardarCierres(fecha, nuevos, correcciones);
    await this.cerrarQuema(fecha);

    return { creados: nuevos.length, recalculados: correcciones.length };
  }

  // Mismo mecanismo para la quema nacional (decisiones #14 y #34).
  private async cerrarQuema(fecha: string): Promise<void> {
    const puntual: ValoresDelDia | null = await this.repo.quemaValoresDelDia(fecha);
    if (!puntual) return;

    const valor = media(puntual.valores);
    const existente = await this.repo.quemaCierreDelDia(fecha);
    if (existente?.mmpced.equals(valor)) return;

    await this.repo.guardarQuemaCierre(fecha, valor, puntual.usuarioId, existente);
  }
}

export const cierreDiarioService = new CierreDiarioService(cierreDiarioRepository);
