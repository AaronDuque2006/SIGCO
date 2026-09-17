/**
 * El ancho de la aplicación, en un solo lugar.
 *
 * Vive acá porque estaba escrito en cuatro archivos y ya había divergido: el
 * encabezado se centraba más angosto que el contenido, así que "SICOG" no
 * alineaba con el menú lateral en las seis vistas de uso diario.
 *
 * **1760px y no 1152px**: medido contra el monitor real de la sala (1920 de
 * ancho). Con el ancho anterior sobraban 370px de margen a cada lado y, peor,
 * la columna Sistema quedaba tan angosta que "Anaco - Caracas - Barquisimeto -
 * Río Seco" partía en dos líneas — cada fila de la grilla pasaba de 46 a 66
 * píxeles de alto, así que el margen que no se usaba a los lados se pagaba en
 * filas que no se veían. El tope existe igual para que en un monitor
 * ultra-ancho la grilla no se estire hasta ser ilegible.
 */
export const CONTENEDOR = "mx-auto w-full max-w-[110rem]";
