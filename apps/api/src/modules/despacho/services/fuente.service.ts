import type { FuenteDto, Paginated } from "@sicog/shared-types";
import type {
  CreateFuenteInput,
  ListFuentesQuery,
  UpdateFuenteInput,
} from "@sicog/shared-validators";
import { NotFoundError } from "../../../shared/errors.js";
import { paginate } from "../../../shared/http.js";
import { fuenteRepository, type IFuenteRepository } from "../repositories/fuente.repository.js";

/** Mismo trato que `ClienteService`: paginado obligatorio, por §11.1. */
export class FuenteService {
  constructor(private readonly repo: IFuenteRepository) {}

  async listar(query: ListFuentesQuery): Promise<Paginated<FuenteDto>> {
    const { page, pageSize, ...filtros } = query;
    const [filas, totalItems] = await Promise.all([
      this.repo.list({ ...filtros, skip: (page - 1) * pageSize, take: pageSize }),
      this.repo.count(filtros),
    ]);
    return paginate(filas, totalItems, page, pageSize);
  }

  async obtener(id: number): Promise<FuenteDto> {
    const fuente = await this.repo.findById(id);
    if (!fuente) throw new NotFoundError(`No existe la fuente ${id}`);
    return fuente;
  }

  crear(input: CreateFuenteInput): Promise<FuenteDto> {
    return this.repo.create(input);
  }

  async actualizar(id: number, input: UpdateFuenteInput): Promise<FuenteDto> {
    await this.obtener(id);
    return this.repo.update(id, input);
  }
}

export const fuenteService = new FuenteService(fuenteRepository);
