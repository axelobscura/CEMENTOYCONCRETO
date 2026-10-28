"use client";

import { useState } from "react";
import { MIX_CLASSES, type MixClass, mixMaterials, volumeM3 } from "@/lib/concrete";

type ShapeKind = "rectangular" | "cylinder";

// Approximate retail prices in Mexico (MXN, 2026). Vary a lot by region — editable in the UI.
const DEFAULT_PRICES = { cementPer50kgBag: 260, sandPerM3: 650, gravelPerM3: 720 };

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export default function Calculator() {
  const [shape, setShape] = useState<ShapeKind>("rectangular");
  const [length, setLength] = useState(4);
  const [width, setWidth] = useState(3);
  const [depthCm, setDepthCm] = useState(10);
  const [diameterCm, setDiameterCm] = useState(30);
  const [height, setHeight] = useState(2.5);
  const [qty, setQty] = useState(1);
  const [mix, setMix] = useState<MixClass>("M20");
  const [waste, setWaste] = useState(5);
  const [bagKg, setBagKg] = useState(50);
  const [cementPrice, setCementPrice] = useState(DEFAULT_PRICES.cementPer50kgBag);
  const [sandPrice, setSandPrice] = useState(DEFAULT_PRICES.sandPerM3);
  const [gravelPrice, setGravelPrice] = useState(DEFAULT_PRICES.gravelPerM3);

  const volume =
    shape === "rectangular"
      ? volumeM3({ kind: "rectangular", lengthM: length, widthM: width, depthM: depthCm / 100 }, qty)
      : volumeM3({ kind: "cylinder", diameterM: diameterCm / 100, heightM: height }, qty);
  const r = mixMaterials(volume || 0, mix, waste, bagKg);

  const costs = [
    { label: `Cemento (${r.cementBags} bultos)`, value: r.cementBags * (cementPrice || 0) },
    { label: `Arena (${r.sandM3} m³)`, value: r.sandM3 * (sandPrice || 0) },
    { label: `Grava (${r.gravelM3} m³)`, value: r.gravelM3 * (gravelPrice || 0) },
  ];
  const total = costs.reduce((sum, c) => sum + c.value, 0);
  const perM3 = r.orderVolumeM3 > 0 ? total / r.orderVolumeM3 : 0;

  return (
    <aside className="space-y-4 rounded-2xl border border-stone-200 bg-white/85 p-5 shadow-sm backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/80">
      <div>
        <h2 className="text-lg font-semibold">Calculadora rápida</h2>
        <p className="text-sm text-stone-500">Cálculo instantáneo, sin IA.</p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 text-sm dark:bg-stone-800">
        {(["rectangular", "cylinder"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setShape(k)}
            className={`rounded-lg py-1.5 ${shape === k ? "bg-white font-medium shadow dark:bg-stone-700" : "text-stone-500"}`}
          >
            {k === "rectangular" ? "Losa / zapata / muro" : "Columna redonda"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shape === "rectangular" ? (
          <>
            <Field label="Largo (m)" value={length} onChange={setLength} />
            <Field label="Ancho (m)" value={width} onChange={setWidth} />
            <Field label="Espesor (cm)" value={depthCm} onChange={setDepthCm} />
          </>
        ) : (
          <>
            <Field label="Diámetro (cm)" value={diameterCm} onChange={setDiameterCm} />
            <Field label="Altura (m)" value={height} onChange={setHeight} />
          </>
        )}
        <Field label="Cantidad" value={qty} onChange={setQty} step={1} />
        <Field label="Desperdicio (%)" value={waste} onChange={setWaste} step={1} />
        <label className="text-xs text-stone-500">
          Tamaño del bulto
          <select
            value={bagKg}
            onChange={(e) => {
              const next = Number(e.target.value);
              // Keep the bag price proportional to its weight.
              setCementPrice((p) => Math.round((p * next) / bagKg));
              setBagKg(next);
            }}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-transparent px-2 py-1.5 text-sm text-stone-900 dark:border-stone-700 dark:text-stone-100"
          >
            <option value={50}>50 kg</option>
            <option value={42.5}>42.5 kg (94 lb)</option>
            <option value={25}>25 kg</option>
          </select>
        </label>
      </div>

      <label className="block text-xs text-stone-500">
        Tipo de mezcla
        <select
          value={mix}
          onChange={(e) => setMix(e.target.value as MixClass)}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-transparent px-2 py-1.5 text-sm text-stone-900 dark:border-stone-700 dark:text-stone-100"
        >
          {Object.entries(MIX_CLASSES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </label>

      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
        <Stat label="Concreto a pedir" value={`${r.orderVolumeM3} m³`} sub={`${(r.orderVolumeM3 * 1.30795).toFixed(2)} yd³`} />
        <Stat label="Cemento" value={`${r.cementBags} bultos`} sub={`${r.cementKg} kg`} highlight />
        <Stat label="Arena" value={`${r.sandM3} m³`} />
        <Stat label="Grava" value={`${r.gravelM3} m³`} />
        <Stat label="Agua" value={`${r.waterLiters} L`} sub={`w/c ${r.waterCementRatio}`} />
        <Stat label="Proporción" value={r.ratio.split(" (")[0]} sub="cemento:arena:grava" />
      </dl>
      <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900/60 dark:bg-orange-950/20">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Costo aproximado de materiales</span>
          <span className="text-xs text-stone-500">{mxn.format(perM3)}/m³</span>
        </div>
        <p className="text-3xl font-bold tracking-tight text-orange-600">{mxn.format(total)}</p>
        <ul className="space-y-1 text-sm">
          {costs.map((c) => (
            <li key={c.label} className="flex justify-between gap-2">
              <span className="text-stone-500">{c.label}</span>
              <span className="font-medium tabular-nums">{mxn.format(c.value)}</span>
            </li>
          ))}
        </ul>
        <details className="group text-sm">
          <summary className="cursor-pointer select-none text-xs font-medium text-orange-700 hover:text-orange-600 dark:text-orange-400">
            Editar precios unitarios (MXN)
          </summary>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Field label={`Bulto ${bagKg} kg`} value={cementPrice} onChange={setCementPrice} step={1} />
            <Field label="Arena / m³" value={sandPrice} onChange={setSandPrice} step={1} />
            <Field label="Grava / m³" value={gravelPrice} onChange={setGravelPrice} step={1} />
          </div>
        </details>
        <p className="text-[11px] leading-snug text-stone-500">
          Precios de referencia en México (2026). Varían por región y proveedor; no incluye mano de obra, cimbra, acero ni flete.
        </p>
      </div>

      <p className="text-xs text-stone-500">
        Mezclas nominales por volumen para obras pequeñas. Los trabajos estructurales requieren un diseño de mezcla y revisión del reglamento local.
      </p>
    </aside>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="text-xs text-stone-500">
      {label}
      <input
        type="number"
        min={0}
        step={step}
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className="mt-1 w-full rounded-lg border border-stone-300 bg-transparent px-2 py-1.5 text-sm text-stone-900 outline-none focus:border-orange-500 dark:border-stone-700 dark:text-stone-100"
      />
    </label>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className={`text-lg font-semibold ${highlight ? "text-orange-600" : ""}`}>{value}</dd>
      {sub && <dd className="text-xs text-stone-500">{sub}</dd>}
    </div>
  );
}
