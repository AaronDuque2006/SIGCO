import type {
  FilaFuenteDiariaDto,
  HistorialEntryDto,
  LecturaFuenteDto,
  Paginated,
} from "@sicog/shared-types";
import type { ListLecturasFuenteQuery } from "@sicog/shared-validators";
import { NotFoundError } from "../../../shared/errors.js";
import { paginate } from "../../../shared/http.js";
import { dateToFecha } from "../repositories/lectura-balance.repository.js";
import {
  lecturaFuenteRepository,
  type FilaGridFuente,
  type HistorialFuenteRow,
  type ILecturaFuenteRepository,
  type LecturaFuenteRow,
} from "../repositories/lectura-fuente.repository.js";

const toLecturaDto = (row: LecturaFuenteRow): LecturaFuenteDto => ({
  id: row.id.toString(),
  fuenteId: row.fuenteId,
  fecha: dateToFecha(row.fecha),
  volumenMmpced: row.volumenMmpced.toNumber(),
  usuarioId: row.usuarioId,
});

const toFilaDto = (fila: FilaGridFuente): FilaFuenteDiariaDto => ({
  fuente: fila.fuente,
  lectura: fila.lectura ? toLecturaDto(fila.lectura) : null,
  correcciones: fila.correcciones,
});

const toHistorialDto = (row: HistorialFuenteRow): HistorialEntryDto => ({
  id: row.id.toString(),
  valorAnterior: row.volumenMmpcedAnt.toNumber(),
  usuarioId: row.usuarioId,
  usuarioNombre: row.usuario.nombre,
  modificadoEn: row.modificadoEn.toISOString(),
});

export class LecturaFuenteService {
  constructor(private readonly repo: ILecturaFuenteRepository) {}

  async obtenerGrilla(query: ListLecturasFuenteQuery): Promise<Paginated<FilaFuenteDiariaDto>> {
    const { fecha, sistemaId, page, pageSize } = query;
    const paginado = page !== undefined || pageSize !== undefined;
    const paginaActual = page ?? 1;
    const tamano = pageSize ?? 200;

    const [filas, totalItems] = await Promise.all([
      this.repo.findGrid({
        fecha,
        sistemaId,
        ...(paginado ? { skip: (paginaActual - 1) * tamano, take: tamano } : {}),
      }),
      this.repo.countFuentes({ sistemaId }),
    ]);

    const data = filas.map(toFilaDto);
    return paginado
      ? paginate(data, totalItems, paginaActual, tamano)
      : paginate(data, totalItems, 1, data.length || 1);
  }

  async registrar(
    input: { fuenteId: number; fecha: string; volumenMmpced: number },
    usuarioId: number,
  ): Promise<LecturaFuenteDto> {
    if (!(await this.repo.fuenteExiste(input.fuenteId))) {
      throw new NotFoundError(`No existe la fuente ${input.fuenteId}`);
    }
    return toLecturaDto(await this.repo.create({ ...input, usuarioId }));
  }

  /**
   * Cualquier analista puede corregir cualquier registro (decisión #3), y por
   * eso el historial lo escribe el repositorio en la misma transacción.
   *
   * A diferencia de `LECTURA_BALANCE`, acá **no hay propagación a días
   * siguientes**: el carry-forward de las decisiones #43 y #45 lo hace el job
   * de cierre, que no toca las fuentes. Una lectura de fuente corregida es un
   * dato aislado de su día.
   */
  async corregir(id: bigint, volumenMmpced: number, usuarioId: number): Promise<LecturaFuenteDto> {
    await this.obtenerOFallar(id);
    return toLecturaDto(await this.repo.corregir(id, volumenMmpced, usuarioId));
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

  private async obtenerOFallar(id: bigint): Promise<LecturaFuenteRow> {
    const fila = await this.repo.findById(id);
    if (!fila) throw new NotFoundError(`No existe la lectura de fuente ${id}`);
    return fila;
  }
}

export const lecturaFuenteService = new LecturaFuenteService(lecturaFuenteRepository);
