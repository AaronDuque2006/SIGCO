import type {
  FilaBalanceDiarioDto,
  HistorialEntryDto,
  LecturaBalanceDto,
  Paginated,
  TipoCorte,
} from "@sicog/shared-types";
import type { ListLecturasBalanceQuery } from "@sicog/shared-validators";
import { NotFoundError } from "../../../shared/errors.js";
import { paginate } from "../../../shared/http.js";
import { sumarDias } from "./cierre-diario.service.js";

// Tope de seguridad: una cadena de copias intactas no debería pasar de un año.
const MAX_DIAS_PROPAGACION = 366;
import {
  dateToFecha,
  lecturaBalanceRepository,
  type FilaGrid,
  type HistorialRow,
  type ILecturaBalanceRepository,
  type LecturaBalanceRow,
} from "../repositories/lectura-balance.repository.js";

const toLecturaDto = (row: LecturaBalanceRow): LecturaBalanceDto => ({
  id: row.id.toString(),
  clienteId: row.clienteId,
  fecha: dateToFecha(row.fecha),
  tipoCorte: row.tipoCorte,
  volumenMmpced: row.volumenMmpced.toNumber(),
  usuarioId: row.usuarioId,
});

const toFilaDto = (fila: FilaGrid): FilaBalanceDiarioDto => ({
  cliente: fila.cliente,
  lectura: fila.lectura ? toLecturaDto(fila.lectura) : null,
});

const toHistorialDto = (row: HistorialRow): HistorialEntryDto => ({
  id: row.id.toString(),
  valorAnterior: row.volumenMmpcedAnt.toNumber(),
  usuarioId: row.usuarioId,
  modificadoEn: row.modificadoEn.toISOString(),
});

export class LecturaBalanceService {
  constructor(private readonly repo: ILecturaBalanceRepository) {}

  async obtenerGrilla(query: ListLecturasBalanceQuery): Promise<Paginated<FilaBalanceDiarioDto>> {
    const { fecha, tipoCorte, sistemaId, regionId, page, pageSize } = query;
    const paginado = page !== undefined || pageSize !== undefined;
    const paginaActual = page ?? 1;
    const tamano = pageSize ?? 200;

    const [filas, totalItems] = await Promise.all([
      this.repo.findGrid({
        fecha,
        tipoCorte,
        sistemaId,
        regionId,
        ...(paginado ? { skip: (paginaActual - 1) * tamano, take: tamano } : {}),
      }),
      this.repo.countClientes({ sistemaId, regionId }),
    ]);

    const data = filas.map(toFilaDto);
    return paginado
      ? paginate(data, totalItems, paginaActual, tamano)
      : paginate(data, totalItems, 1, data.length || 1);
  }

  // Por la API sólo se digitan lecturas PUNTUAL: las de CIERRE_PROMEDIO las
  // genera el job de cierre (decisiones #34 y #42).
  async registrar(
    input: { clienteId: number; fecha: string; volumenMmpced: number },
    usuarioId: number,
  ): Promise<LecturaBalanceDto> {
    if (!(await this.repo.clienteExiste(input.clienteId))) {
      throw new NotFoundError(`No existe el cliente ${input.clienteId}`);
    }
    const tipoCorte: TipoCorte = "PUNTUAL";
    return toLecturaDto(await this.repo.create({ ...input, tipoCorte, usuarioId }));
  }

  // Cualquier analista puede corregir cualquier registro (decisión #3); por eso
  // el historial es obligatorio y lo escribe el repositorio en la misma
  // transacción. `usuarioId` pasa a ser el del corrector: la fila vigente
  // siempre dice quién es responsable del valor actual, y el historial guarda
  // la cadena completa.
  async corregir(id: bigint, volumenMmpced: number, usuarioId: number): Promise<LecturaBalanceDto> {
    const previa = await this.obtenerOFallar(id);
    const corregida = await this.repo.corregir(id, volumenMmpced, usuarioId);

    if (corregida.tipoCorte === "PUNTUAL") {
      await this.propagarACopiasIntactas(previa, corregida, usuarioId);
    }
    return toLecturaDto(corregida);
  }

  // Decisión #45: corregir un día viejo arrastra la corrección a los días
  // siguientes que siguen siendo copias intactas del carry-forward, y se
  // detiene en el primero que un analista fijó a mano.
  //
  // "Intacto" se detecta comparando el valor con el que se heredó, no por
  // "no tiene historial": la propia propagación escribe historial, así que ese
  // criterio se rompería en la segunda corrección de la misma cadena.
  private async propagarACopiasIntactas(
    previa: LecturaBalanceRow,
    corregida: LecturaBalanceRow,
    usuarioId: number,
  ): Promise<void> {
    const heredado = previa.volumenMmpced;
    if (heredado.equals(corregida.volumenMmpced)) return;

    let fecha = dateToFecha(corregida.fecha);
    for (let saltos = 0; saltos < MAX_DIAS_PROPAGACION; saltos++) {
      fecha = sumarDias(fecha, 1);
      const siguiente = await this.repo.findPuntualDe(corregida.clienteId, fecha);
      if (!siguiente || !siguiente.volumenMmpced.equals(heredado)) return;

      await this.repo.corregir(siguiente.id, corregida.volumenMmpced.toNumber(), usuarioId);
    }
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

  private async obtenerOFallar(id: bigint): Promise<LecturaBalanceRow> {
    const lectura = await this.repo.findById(id);
    if (!lectura) throw new NotFoundError(`No existe la lectura ${id}`);
    return lectura;
  }
}

export const lecturaBalanceService = new LecturaBalanceService(lecturaBalanceRepository);
