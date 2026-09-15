import type { ClienteDto, Paginated } from "@sicog/shared-types";
import type {
  CreateClienteInput,
  ListClientesQuery,
  UpdateClienteInput,
} from "@sicog/shared-validators";
import { NotFoundError } from "../../../shared/errors.js";
import { paginate } from "../../../shared/http.js";
import {
  clienteRepository,
  type IClienteRepository,
} from "../repositories/cliente.repository.js";

/**
 * Paginado **obligatorio**, a diferencia de la grilla diaria.
 *
 * La grilla trae el día entero a propósito (decisión #60): el trabajo es
 * digitar cien clientes de corrido y cortarlo en páginas costaría lo no
 * guardado. Este listado es otra cosa —administrar el catálogo— y crece sin
 * techo a medida que el área da de alta clientes, así que va paginado desde el
 * principio como manda §11.1.
 */
export class ClienteService {
  constructor(private readonly repo: IClienteRepository) {}

  async listar(query: ListClientesQuery): Promise<Paginated<ClienteDto>> {
    const { page, pageSize, ...filtros } = query;
    const [filas, totalItems] = await Promise.all([
      this.repo.list({ ...filtros, skip: (page - 1) * pageSize, take: pageSize }),
      this.repo.count(filtros),
    ]);
    return paginate(filas, totalItems, page, pageSize);
  }

  async obtener(id: number): Promise<ClienteDto> {
    const cliente = await this.repo.findById(id);
    if (!cliente) throw new NotFoundError(`No existe el cliente ${id}`);
    return cliente;
  }

  // La existencia de región, sistema y sector no se verifica acá: el
  // Repository traduce la violación de clave foránea a NOT_FOUND. Consultarlas
  // antes serían tres viajes a la base en el camino feliz, y seguirían siendo
  // una carrera si el catálogo cambiara en el medio.
  crear(input: CreateClienteInput): Promise<ClienteDto> {
    return this.repo.create(input);
  }

  async actualizar(id: number, input: UpdateClienteInput): Promise<ClienteDto> {
    await this.obtener(id);
    return this.repo.update(id, input);
  }
}

export const clienteService = new ClienteService(clienteRepository);
