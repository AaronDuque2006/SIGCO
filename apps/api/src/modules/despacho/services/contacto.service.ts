import type { ContactoDto, Paginated } from "@sicog/shared-types";
import type {
  CreateContactoInput,
  ListContactosQuery,
  UpdateContactoInput,
} from "@sicog/shared-validators";
import { NotFoundError } from "../../../shared/errors.js";
import { paginate } from "../../../shared/http.js";
import {
  contactoRepository,
  type ContactoRow,
  type IContactoRepository,
} from "../repositories/contacto.repository.js";

const toDto = (row: ContactoRow): ContactoDto => row;

export class ContactoService {
  constructor(private readonly repo: IContactoRepository) {}

  async listar(query: ListContactosQuery): Promise<Paginated<ContactoDto>> {
    const { page, pageSize, ...filtros } = query;
    const [filas, totalItems] = await Promise.all([
      this.repo.list({ ...filtros, skip: (page - 1) * pageSize, take: pageSize }),
      this.repo.count(filtros),
    ]);
    return paginate(filas.map(toDto), totalItems, page, pageSize);
  }

  async obtener(id: number): Promise<ContactoDto> {
    return toDto(await this.obtenerOFallar(id));
  }

  crear(input: CreateContactoInput): Promise<ContactoDto> {
    return this.repo.create(input).then(toDto);
  }

  async actualizar(id: number, input: UpdateContactoInput): Promise<ContactoDto> {
    await this.obtenerOFallar(id);
    return toDto(await this.repo.update(id, input));
  }

  /**
   * Borrado físico, el único del módulo (§11.2): un teléfono viejo no es dato
   * histórico, es ruido en una lista que se consulta con apuro. Se comprueba
   * que exista para responder `404` en vez de un error de Prisma.
   */
  async eliminar(id: number): Promise<void> {
    await this.obtenerOFallar(id);
    await this.repo.remove(id);
  }

  private async obtenerOFallar(id: number): Promise<ContactoRow> {
    const fila = await this.repo.findById(id);
    if (!fila) throw new NotFoundError(`No existe el contacto ${id}`);
    return fila;
  }
}

export const contactoService = new ContactoService(contactoRepository);
