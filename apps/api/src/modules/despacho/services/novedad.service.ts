import type { NovedadOperativaDto, Paginated } from "@sicog/shared-types";
import type {
  CreateNovedadInput,
  ListNovedadesQuery,
  UpdateNovedadInput,
} from "@sicog/shared-validators";
import { NotFoundError, ValidationError } from "../../../shared/errors.js";
import { paginate, singlePage } from "../../../shared/http.js";
import {
  novedadRepository,
  type INovedadRepository,
  type NovedadRow,
} from "../repositories/novedad.repository.js";

const toDto = (row: NovedadRow): NovedadOperativaDto => ({
  id: row.id.toString(),
  cliente: row.cliente,
  fuente: row.fuente,
  tipo: row.tipo,
  impacto: row.impacto,
  inicio: row.inicio.toISOString(),
  fin: row.fin ? row.fin.toISOString() : null,
  causa: row.causa,
  mmpcedAfectados: row.mmpcedAfectados.toNumber(),
  usuarioId: row.usuarioId,
  usuarioNombre: row.usuario.nombre,
});

export class NovedadService {
  constructor(private readonly repo: INovedadRepository) {}

  async listar(query: ListNovedadesQuery): Promise<Paginated<NovedadOperativaDto>> {
    const { page, pageSize, ...filtros } = query;
    const [filas, totalItems] = await Promise.all([
      this.repo.list({ ...filtros, skip: (page - 1) * pageSize, take: pageSize }),
      this.repo.count(filtros),
    ]);
    return paginate(filas.map(toDto), totalItems, page, pageSize);
  }

  async obtener(id: bigint): Promise<NovedadOperativaDto> {
    return toDto(await this.obtenerOFallar(id));
  }

  /**
   * El "exactamente uno de cliente/fuente" y el rango `fin >= inicio` los
   * valida `createNovedadSchema` en el borde. Acá no se repiten: de la
   * validación para adentro el Service confía en los tipos.
   */
  crear(input: CreateNovedadInput, usuarioId: number): Promise<NovedadOperativaDto> {
    return this.repo.create({ ...input, usuarioId }).then(toDto);
  }

  /**
   * El rango se verifica contra el **estado resultante**, no contra lo que
   * llega.
   *
   * `updateNovedadSchema` es parcial, así que mandar sólo `fin` deja a zod sin
   * el `inicio` con el que compararlo y su `refine` no puede correr. Editar el
   * fin de una novedad para ponerlo antes de su propio inicio pasaría el
   * borde. Mismo criterio que §13.2 usa para el departamento de un usuario.
   */
  async actualizar(
    id: bigint,
    input: UpdateNovedadInput,
    usuarioId: number,
  ): Promise<NovedadOperativaDto> {
    const actual = await this.obtenerOFallar(id);

    const inicio = input.inicio === undefined ? actual.inicio : new Date(input.inicio);
    const fin =
      input.fin === undefined ? actual.fin : input.fin === null ? null : new Date(input.fin);

    if (fin !== null && fin.getTime() < inicio.getTime()) {
      throw new ValidationError("`fin` no puede ser anterior a `inicio`");
    }

    return toDto(await this.repo.update(id, input, usuarioId));
  }

  /** Sugerencias para el campo `tipo`, que sigue siendo texto libre (§9.2 #4). */
  async listarTipos(): Promise<Paginated<string>> {
    return singlePage(await this.repo.listTipos());
  }

  private async obtenerOFallar(id: bigint): Promise<NovedadRow> {
    const fila = await this.repo.findById(id);
    if (!fila) throw new NotFoundError(`No existe la novedad ${id}`);
    return fila;
  }
}

export const novedadService = new NovedadService(novedadRepository);
