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
  title: "SICOG — Control Operacional de Gas",
  description: "Sistema de Control Operacional de Gas, PDVSA Gas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `dark` fijo: el sistema es de sala de control y no tiene tema claro.
    <html
      lang="es"
      className={`dark ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
