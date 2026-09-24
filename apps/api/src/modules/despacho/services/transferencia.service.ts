import type {
  FilaTransferenciaDto,
  HistorialEntryDto,
  LecturaTransferenciaDto,
  Paginated,
  TipoCorte,
} from "@sicog/shared-types";
import type { CreateTransferenciaInput } from "@sicog/shared-validators";
import { NotFoundError, ValidationError } from "../../../shared/errors.js";
import { paginate, singlePage } from "../../../shared/http.js";
import { dateToFecha } from "../repositories/lectura-balance.repository.js";
import {
  transferenciaRepository,
  type FilaTransferencia,
  type HistorialTransferenciaRow,
  type ITransferenciaRepository,
  type LecturaTransferenciaRow,
} from "../repositories/transferencia.repository.js";

const toLecturaDto = (row: LecturaTransferenciaRow): LecturaTransferenciaDto => ({
  id: row.id.toString(),
  puntoId: row.puntoId,
  fecha: dateToFecha(row.fecha),
  tipoCorte: row.tipoCorte,
  mmpced: row.mmpced.toNumber(),
  usuarioId: row.usuarioId,
});

const toFilaDto = (fila: FilaTransferencia): FilaTransferenciaDto => ({
  punto: fila.punto,
  lectura: fila.lectura ? toLecturaDto(fila.lectura) : null,
  correcciones: fila.correcciones,
});

const toHistorialDto = (row: HistorialTransferenciaRow): HistorialEntryDto => ({
  id: row.id.toString(),
  valorAnterior: row.mmpcedAnt.toNumber(),
  // Las transferencias no tienen hora de lectura ni edición del historial
  // (fuera de alcance): los campos existen en el DTO compartido con
  // balance/fuentes/quema.
  horaAnterior: null,
  editadoPor: null,
  procesadoAnterior: null,
  desvioAnterior: null,
  editadoEn: null,
  usuarioId: row.usuarioId,
  usuarioNombre: row.usuario.nombre,
  modificadoEn: row.modificadoEn.toISOString(),
});

export class TransferenciaService {
  constructor(private readonly repo: ITransferenciaRepository) {}

  /** Cinco puntos: la grilla viene entera, envuelta igual en `Paginated<T>`. */
  async obtenerGrilla(
    fecha: string,
    tipoCorte: TipoCorte,
  ): Promise<Paginated<FilaTransferenciaDto>> {
    return singlePage((await this.repo.findGrid(fecha, tipoCorte)).map(toFilaDto));
  }

  async registrar(
    input: CreateTransferenciaInput,
    usuarioId: number,
  ): Promise<LecturaTransferenciaDto> {
    const punto = await this.repo.findPunto(input.puntoId);
    if (!punto) throw new NotFoundError(`No existe el punto de transferencia ${input.puntoId}`);
    this.exigirSignoValido(punto.bidireccional, punto.nombre, input.mmpced);
    return toLecturaDto(await this.repo.create({ ...input, usuarioId }));
  }

  async corregir(
    id: bigint,
    mmpced: number,
    usuarioId: number,
  ): Promise<LecturaTransferenciaDto> {
    const actual = await this.obtenerOFallar(id);
    const punto = await this.repo.findPunto(actual.puntoId);
    if (punto) this.exigirSignoValido(punto.bidireccional, punto.nombre, mmpced);
    return toLecturaDto(await this.repo.corregir(id, mmpced, usuarioId));
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

  /**
   * El negativo sólo vale en un punto bidireccional.
   *
   * El schema del borde acepta signo porque no puede saber de qué punto se
   * trata; quien lo sabe es el Service, y un aporte a EYP en negativo sería un
   * gas que vuelve de otra división, no una dirección contraria.
   */
  private exigirSignoValido(bidireccional: boolean, nombre: string, mmpced: number): void {
    if (!bidireccional && mmpced < 0) {
      throw new ValidationError(`"${nombre}" no es bidireccional: el volumen no puede ser negativo`);
    }
  }

  private async obtenerOFallar(id: bigint): Promise<LecturaTransferenciaRow> {
    const fila = await this.repo.findById(id);
    if (!fila) throw new NotFoundError(`No existe la transferencia ${id}`);
    return fila;
  }
}

export const transferenciaService = new TransferenciaService(transferenciaRepository);
