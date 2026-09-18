import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Inter para texto y monoespaciada para números: en las grillas operativas los
// volúmenes tienen que alinearse por columna para poder compararlos de un
// vistazo, y una tipografía proporcional no lo permite.
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SICOG",
  description: "Sistema de Control Operacional de Gas, PDVSA Gas.",
};

/**
 * Corrige el tema **antes del primer pintado**.
 *
 * El servidor no puede saber qué eligió esta persona —la preferencia vive en su
 * navegador— así que renderiza el oscuro, que es el predeterminado, y este
 * script lo cambia mientras el navegador todavía está leyendo el HTML. Hacerlo
 * desde un `useEffect` evitaría el error de hidratación pero dejaría ver un
 * destello oscuro en cada carga, que en una pantalla clara a plena luz es
 * exactamente lo que molesta.
 *
 * El `try/catch` cubre el caso de `localStorage` bloqueado, donde simplemente
 * queda el predeterminado.
 */
const GUION_TEMA = `(function(){try{var t=localStorage.getItem("tema");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // El oscuro es el predeterminado: es la condición de la sala de control, y
    // el claro existe para el día, la preferencia personal y los PDF.
    // `suppressHydrationWarning` porque el script de arriba toca este mismo
    // elemento antes de que React hidrate.
    <html
      lang="es"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: GUION_TEMA }} />
      </head>
      {/* `suppressHydrationWarning` sólo acá, y por una razón concreta: varias
          extensiones de navegador le agregan atributos al `<body>` antes de que
          React hidrate —ColorZilla pone `cz-shortcut-listen`, los gestores de
          contraseñas ponen los suyos— y eso dispara un error de hidratación que
          no viene del código y que nadie puede arreglar desde acá.

          Es superficial: afecta a este elemento y no a sus hijos, y los
          atributos del `<body>` son constantes, así que no puede tapar una
          diferencia real. No usarlo en ningún otro lado sin este mismo nivel de
          justificación. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
