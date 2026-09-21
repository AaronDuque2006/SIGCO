const MS_POR_DIA = 86_400_000;

/** Hoy, anclado a UTC igual que las columnas `@db.Date` (§11.1). */
export const hoyUtc = (): Date => {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
};

/** Días que lleva caída una estación. Incluye el día de inicio, que es como lo
 *  cuenta el área: una falla que empezó hoy lleva un día, no cero. */
export const diasEntre = (desde: Date, hasta: Date): number =>
  Math.max(1, Math.floor((hasta.getTime() - desde.getTime()) / MS_POR_DIA) + 1);

/**
 * Los lunes de cada semana ISO del año, que son las fechas sobre las que se
 * evalúa la serie semanal. El archivo real rotula "SEMANA 1..52"; acá la semana
 * n es la que contiene el n-ésimo lunes a partir del primer lunes del año.
 */
export const lunesDelAnio = (anio: number): Date[] => {
  const enero1 = new Date(Date.UTC(anio, 0, 1));
  // getUTCDay: 0 domingo, 1 lunes. Retrocede al lunes de esa semana y avanza
  // uno si quedó en el año anterior.
  const diaSemana = enero1.getUTCDay();
  const offset = diaSemana === 1 ? 0 : ((8 - diaSemana) % 7 || 7);
  const primerLunes = new Date(enero1.getTime() + offset * MS_POR_DIA);

  const lunes: Date[] = [];
  for (let f = primerLunes; f.getUTCFullYear() === anio; f = new Date(f.getTime() + 7 * MS_POR_DIA)) {
    lunes.push(f);
  }
  return lunes;
};
