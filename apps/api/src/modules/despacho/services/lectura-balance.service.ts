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
import { cierreDiarioService, hoyEn, sumarDias } from "./cierre-diario.service.js";
import { env } from "../../../shared/env.js";

// Tope de seguridad: una cadena de copias intactas no debería pasar de un año.
const MAX_DIAS_PROPAGACION = 366;
import { dateToHora } from "../../../shared/fechas.js";
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
  horaLectura: dateToHora(row.horaLectura),
  usuarioId: row.usuarioId,
  usuarioNombre: row.usuario.nombre,
  editadoPor: row.editadoPor?.nombre ?? null,
  editadoEn: row.editadoEn?.toISOString() ?? null,
});

const toFilaDto = (fila: FilaGrid): FilaBalanceDiarioDto => ({
  cliente: fila.cliente,
  lectura: fila.lectura ? toLecturaDto(fila.lectura) : null,
  correcciones: fila.correcciones,
  valorAnterior: fila.valorAnterior?.toNumber() ?? null,
});

const toHistorialDto = (row: HistorialRow): HistorialEntryDto => ({
  id: row.id.toString(),
  valorAnterior: row.volumenMmpcedAnt.toNumber(),
  horaAnterior: dateToHora(row.horaLecturaAnt),
  editadoPor: row.editadoPor?.nombre ?? null,
  editadoEn: row.editadoEn?.toISOString() ?? null,
  // Sólo `lecturas-fuente` tiene "procesado" y "desvío" (decisiones #98/#107).
  procesadoAnterior: null,
  desvioAnterior: null,
  usuarioId: row.usuarioId,
  usuarioNombre: row.usuario.nombre,
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
    input: {
      clienteId: number;
      fecha: string;
      volumenMmpced: number;
      horaLectura?: string | null;
    },
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
  async corregir(
    id: bigint,
    volumenMmpced: number,
    horaLectura: string | null | undefined,
    usuarioId: number,
  ): Promise<LecturaBalanceDto> {
    const previa = await this.obtenerOFallar(id);
    const corregida = await this.repo.corregir(id, volumenMmpced, horaLectura, usuarioId);

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
  //
  // La hora no se propaga: es un dato de "cuándo se midió", propio de cada
  // día, y el carry-forward de la decisión #43 nunca la copió hacia adelante.
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

      await this.repo.corregir(siguiente.id, corregida.volumenMmpced.toNumber(), undefined, usuarioId);
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

  /**
   * Corrige un valor ya guardado en el historial (decisión pendiente de
   * numerar, amplía la #3): si el analista tecleó 500 por error, ese 500
   * entraba en la media del `CIERRE_PROMEDIO` aunque lo hubiera corregido
   * enseguida. Editarlo **pisa** el número original y deja como rastro quién
   * lo retocó y cuándo.
   *
   * Si el día ya tenía cierre se recalcula de inmediato: no tiene sentido
   * arreglar el valor y dejar el promedio viejo hasta la medianoche.
   */
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

  /**
   * Corrige el valor **vigente** en el lugar, desde la cuadrícula del
   * historial: pisa el número sin bajar el viejo al historial, que es lo que
   * lo distingue de `corregir`.
   *
   * Existe porque un valor mal tecleado entraba igual en la media del
   * `CIERRE_PROMEDIO` (decisión #34) — corregirlo por el camino normal lo
   * mandaba al historial, donde seguía contando. Acá desaparece del cálculo,
   * y el rastro que queda es quién lo editó y cuándo.
   *
   * **No propaga** a los días siguientes, a diferencia de `corregir`
   * (decisión #45): es un arreglo de tipeo sobre un día concreto, no una
   * corrección del dato operativo.
   */
  async editarValorVigente(id: bigint, valor: number, usuarioId: number): Promise<void> {
    const lectura = await this.obtenerOFallar(id);
    await this.repo.editarValorVigente(id, valor, usuarioId);

    const hoy = hoyEn(env.CIERRE_DIARIO_TZ);
    await cierreDiarioService.recalcularCierreDe(dateToFecha(lectura.fecha), hoy);
  }

  private async obtenerOFallar(id: bigint): Promise<LecturaBalanceRow> {
    const lectura = await this.repo.findById(id);
    if (!lectura) throw new NotFoundError(`No existe la lectura ${id}`);
    return lectura;
  }
}

export const lecturaBalanceService = new LecturaBalanceService(lecturaBalanceRepository);
