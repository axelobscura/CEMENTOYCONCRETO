"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import logo from "@/app/icon.svg";

const FEATURES = [
  { icon: "🤖", title: "Asistente con IA", text: "Resuelve dudas de mezclas, colado, curado y grietas." },
  { icon: "🧮", title: "Cálculo de materiales", text: "Bultos de cemento, arena, grava y agua al instante." },
  { icon: "📈", title: "Resistencia y curado", text: "Sabe cuándo descimbrar o cargar tu losa." },
];

const APP_ROUTE = "/calculadora";

export default function Splash() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    router.prefetch(APP_ROUTE);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") setLeaving(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  // With cacheComponents, Next hides this page (React <Activity>) instead of
  // unmounting it, so `leaving` would survive navigation and replay the exit
  // animation — and its redirect — on return. Reset it when the page is hidden.
  useLayoutEffect(() => () => setLeaving(false), []);

  return (
    <div
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && leaving) router.push(APP_ROUTE);
      }}
      className={`relative flex min-h-dvh flex-1 overflow-x-hidden bg-stone-950 px-6 py-12 text-stone-100 ${
        leaving ? "animate-splash-out" : ""
      }`}
    >
      {/* Background photo + overlays for legibility */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <Image
          src="/splash-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-kenburns object-cover"
        />
        <div className="absolute inset-0 bg-stone-950/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-transparent to-stone-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgb(12_10_9/0.85)_90%)]" />
        <div className="absolute -top-40 left-1/2 size-[min(36rem,120vw)] -translate-x-1/2 rounded-full bg-orange-600/25 blur-3xl animate-glow" />
      </div>

      <div className="relative m-auto flex w-full max-w-4xl flex-col items-center text-center">
        <Image
          src={logo}
          alt="Cemento y Concreto"
          width={80}
          height={80}
          priority
          className="animate-rise mb-8 rounded-3xl shadow-2xl shadow-orange-900/50 ring-1 ring-white/20"
        />

        <span className="animate-rise mb-5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-orange-300 backdrop-blur [animation-delay:80ms]">
          CEMENTO Y CONCRETO · IA
        </span>

        <h1 className="animate-rise text-balance text-5xl font-bold tracking-tight sm:text-7xl [animation-delay:160ms] uppercase">
          Construye con{" "}
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            precisión
          </span>
        </h1>

        <p className="animate-rise mt-6 max-w-2xl text-pretty text-lg text-stone-400 [animation-delay:240ms]">
          Tu asistente de obra para calcular, mezclar, colar y curar concreto. Respuestas claras y números exactos, en segundos.
        </p>

        <button
          onClick={() => setLeaving(true)}
          className="animate-rise group mt-10 inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-900/40 transition hover:bg-orange-500 hover:shadow-orange-700/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/50 [animation-delay:320ms] uppercase"
        >
          Comenzar
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>

        <div className="mt-14 grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{ animationDelay: `${420 + i * 90}ms` }}
              className="animate-rise rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur transition hover:border-orange-500/40 hover:bg-white/[0.07]"
            >
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-stone-400">{f.text}</p>
            </div>
          ))}
        </div>

        <p className="animate-rise mt-10 text-xs text-stone-500 [animation-delay:700ms] uppercase">
          Los cálculos son una guía. Para trabajos estructurales consulta a un ingeniero.
        </p>

        <a
          href="https://www.pexels.com/photo/selective-focus-photography-cement-2219024/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-[11px] text-stone-500 transition hover:text-stone-300 sm:fixed sm:bottom-3 sm:right-4 sm:mt-0"
        >
          Foto: Rodolfo Quirós · Pexels
        </a>
      </div>
    </div>
  );
}
