import type {
  HistorialEntryDto,
  Paginated,
  QuemaNacionalDiaDto,
  QuemaNacionalDto,
  TipoCorte,
} from "@sicog/shared-types";
import type { CreateQuemaNacionalInput } from "@sicog/shared-validators";
import { env } from "../../../shared/env.js";
import { NotFoundError } from "../../../shared/errors.js";
import { dateToHora } from "../../../shared/fechas.js";
import { paginate } from "../../../shared/http.js";
import { dateToFecha } from "../repositories/lectura-balance.repository.js";
import {
  quemaNacionalRepository,
  type HistorialQuemaRow,
  type IQuemaNacionalRepository,
  type QuemaRow,
} from "../repositories/quema-nacional.repository.js";
import { cierreDiarioService, hoyEn } from "./cierre-diario.service.js";

const toDto = (row: QuemaRow): QuemaNacionalDto => ({
  id: row.id.toString(),
  fecha: dateToFecha(row.fecha),
  tipoCorte: row.tipoCorte,
  mmpced: row.mmpced.toNumber(),
  horaLectura: dateToHora(row.horaLectura),
  usuarioId: row.usuarioId,
  usuarioNombre: row.usuario.nombre,
  editadoPor: row.editadoPor?.nombre ?? null,
  editadoEn: row.editadoEn?.toISOString() ?? null,
});

const toHistorialDto = (row: HistorialQuemaRow): HistorialEntryDto => ({
  id: row.id.toString(),
  valorAnterior: row.mmpcedAnt.toNumber(),
  horaAnterior: dateToHora(row.horaLecturaAnt),
  editadoPor: row.editadoPor?.nombre ?? null,
  editadoEn: row.editadoEn?.toISOString() ?? null,
  procesadoAnterior: null,
  desvioAnterior: null,
  usuarioId: row.usuarioId,
  usuarioNombre: row.usuario.nombre,
  modificadoEn: row.modificadoEn.toISOString(),
});

export class QuemaNacionalService {
  constructor(private readonly repo: IQuemaNacionalRepository) {}

  /**
   * Siempre devuelve la misma forma, con `quema: null` cuando el día todavía
   * no se digitó. Un `404` obligaría a la pantalla a tratar un error como el
   * estado normal de la mañana.
   */
  async obtenerDelDia(fecha: string, tipoCorte: TipoCorte): Promise<QuemaNacionalDiaDto> {
    const fila = await this.repo.findDelDia(fecha, tipoCorte);
    return { fecha, tipoCorte, quema: fila ? toDto(fila) : null };
  }

  /** Sólo crea `PUNTUAL`: el input no acepta `tipoCorte` (decisiones #14/#34). */
  async registrar(input: CreateQuemaNacionalInput, usuarioId: number): Promise<QuemaNacionalDto> {
    return toDto(await this.repo.create({ ...input, usuarioId }));
  }

  /**
   * Cualquier analista puede corregir cualquier registro (decisión #3), y por
   * eso el historial lo escribe el repositorio en la misma transacción.
   * `usuarioId` pasa a ser el del corrector: la fila vigente dice siempre quién
   * es responsable del valor actual, y el historial guarda la cadena completa.
   *
   * Se admite corregir también un `CIERRE_PROMEDIO`, igual que en
   * `LECTURA_BALANCE`. Lo que **no** hay acá es propagación a los días
   * siguientes: el carry-forward de las decisiones #43 y #45 es de las lecturas
   * por cliente, y la quema nacional es un dato aislado de su día.
   */
  async corregir(
    id: bigint,
    mmpced: number,
    horaLectura: string | null | undefined,
    usuarioId: number,
  ): Promise<QuemaNacionalDto> {
    await this.obtenerOFallar(id);
    return toDto(await this.repo.corregir(id, mmpced, horaLectura, usuarioId));
  }

  async obtenerHistorial(
    id: bigint,
    page: number,
    pageSize: number,
  ): Promise<Paginated<HistorialEntryDto>> {
    await this.obtenerOFallar(id);
    const [filas, totalItems] = await Promise.all([
      this.repo.listHistorial(id, (page - 1) * pageSize, pageSize),
      this.repo.countHistorial(id),
    ]);
    return paginate(filas.map(toHistorialDto), totalItems, page, pageSize);
  }

  /** Ver `LecturaBalanceService.editarHistorial`: mismo mecanismo. */
  async editarHistorial(
    historialId: bigint,
    valorAnterior: number,
    usuarioId: number,
  ): Promise<void> {
    const fila = await this.repo.findHistorialById(historialId);
    if (!fila) throw new NotFoundError(`No existe la corrección ${historialId}`);

    await this.repo.editarHistorial(historialId, valorAnterior, usuarioId);

    const hoy = hoyEn(env.CIERRE_DIARIO_TZ);
    await cierreDiarioService.recalcularCierreDe(dateToFecha(fila.fecha), hoy);
  }

  /** Ver `LecturaBalanceService.editarValorVigente`: mismo mecanismo. */
  async editarValorVigente(id: bigint, valor: number, usuarioId: number): Promise<void> {
    const quema = await this.obtenerOFallar(id);
    await this.repo.editarValorVigente(id, valor, usuarioId);

    const hoy = hoyEn(env.CIERRE_DIARIO_TZ);
    await cierreDiarioService.recalcularCierreDe(dateToFecha(quema.fecha), hoy);
  }

  private async obtenerOFallar(id: bigint): Promise<QuemaRow> {
    const fila = await this.repo.findById(id);
    if (!fila) throw new NotFoundError(`No existe la quema nacional ${id}`);
    return fila;
  }
}

export const quemaNacionalService = new QuemaNacionalService(quemaNacionalRepository);
