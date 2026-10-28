import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Calculator from "@/components/Calculator";
import Chat from "@/components/Chat";
import logo from "@/app/icon.svg";
import { SITE } from "@/lib/site";

const TITLE = "Calculadora de concreto y asistente de obra";
const DESCRIPTION =
  "Calcula volumen, bultos de cemento, arena, grava y agua para losas, zapatas y columnas, y pregúntale al asistente con IA sobre mezclas, colado y curado.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/calculadora" },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    url: "/calculadora",
    title: TITLE,
    description: DESCRIPTION,
    // Overriding openGraph here drops the root's file-based image, so point at it explicitly.
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/twitter-image"],
  },
};

export default function CalculadoraPage() {
  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      {/* Background photo, toned down so panels and text stay readable */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Image src="/calculadora-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-stone-100/85 dark:bg-stone-950/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-100 dark:to-stone-950" />
      </div>

      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src={logo} alt="" width={40} height={40} className="rounded-xl" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cemento y Concreto · AI</h1>
            <p className="text-sm text-stone-500">Tu asistente de obra para calcular, mezclar, colar y curar concreto.</p>
          </div>
        </div>
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-stone-300 bg-white/85 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-md transition hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:bg-stone-900/80"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          Inicio
        </Link>
      </header>

      <main className="grid flex-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Chat />
        <Calculator />
      </main>

      <footer className="space-y-1 text-center text-xs text-stone-500">
        <p>
          Los cálculos son solo una guía. Sigue siempre el reglamento de construcción local y consulta a un ingeniero con cédula para trabajos estructurales.
        </p>
        <a
          href="https://www.pexels.com/photo/construction-workers-smoothing-fresh-concrete-outdoors-37121405/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[11px] transition hover:text-stone-700 dark:hover:text-stone-300"
        >
          Foto: SMC (betongsmcsg) · Pexels
        </a>
      </footer>
    </div>
  );
}
