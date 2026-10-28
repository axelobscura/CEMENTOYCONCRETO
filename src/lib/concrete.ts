// Pure calculation helpers for concrete work. Everything is metric internally.
// These are rules of thumb for small jobs (nominal volumetric mixes), not a
// substitute for an engineered mix design on structural work.

export type Shape =
  | { kind: "rectangular"; lengthM: number; widthM: number; depthM: number }
  | { kind: "cylinder"; diameterM: number; heightM: number };

export function volumeM3(shape: Shape, quantity = 1): number {
  const single =
    shape.kind === "rectangular"
      ? shape.lengthM * shape.widthM * shape.depthM
      : Math.PI * (shape.diameterM / 2) ** 2 * shape.heightM;
  return single * quantity;
}

export const MIX_CLASSES = {
  M10: { label: "M10 / C8 (~100 kg/cm²) — plantillas, andadores, no estructural", ratio: [1, 3, 6], wc: 0.6, mpa: 10 },
  M15: { label: "M15 / C12 (~150 kg/cm²) — firmes, pisos sobre terreno, banquetas", ratio: [1, 2, 4], wc: 0.55, mpa: 15 },
  M20: { label: "M20 / C16 (~200 kg/cm²) — concreto armado: losas, vigas, columnas", ratio: [1, 1.5, 3], wc: 0.5, mpa: 20 },
  M25: { label: "M25 / C20 (~250 kg/cm²) — estructural de mayor carga, cocheras", ratio: [1, 1, 2], wc: 0.45, mpa: 25 },
} as const;

export type MixClass = keyof typeof MIX_CLASSES;

const DRY_VOLUME_FACTOR = 1.54; // wet → dry volume (voids + bulking)
const CEMENT_BULK_DENSITY = 1440; // kg/m³

export interface MixResult {
  mixClass: MixClass;
  description: string;
  ratio: string;
  wetVolumeM3: number;
  orderVolumeM3: number;
  cementKg: number;
  cementBags: number;
  bagKg: number;
  sandM3: number;
  gravelM3: number;
  waterLiters: number;
  waterCementRatio: number;
}

export function mixMaterials(
  wetVolumeM3: number,
  mixClass: MixClass = "M20",
  wastePercent = 5,
  bagKg = 50,
): MixResult {
  const mix = MIX_CLASSES[mixClass];
  const [c, s, g] = mix.ratio;
  const parts = c + s + g;
  const orderVolume = wetVolumeM3 * (1 + wastePercent / 100);
  const dry = orderVolume * DRY_VOLUME_FACTOR;
  const cementKg = ((dry * c) / parts) * CEMENT_BULK_DENSITY;
  return {
    mixClass,
    description: mix.label,
    ratio: `${c} : ${s} : ${g} (cemento : arena : grava)`,
    wetVolumeM3: round(wetVolumeM3, 3),
    orderVolumeM3: round(orderVolume, 3),
    cementKg: round(cementKg, 1),
    cementBags: Math.ceil(cementKg / bagKg),
    bagKg,
    sandM3: round((dry * s) / parts, 3),
    gravelM3: round((dry * g) / parts, 3),
    waterLiters: Math.round(cementKg * mix.wc),
    waterCementRatio: mix.wc,
  };
}

// ACI 209 strength-gain curve for moist-cured Type I (OPC) concrete:
// f(t) = t / (4 + 0.85 t) × f28. Assumes ~20 °C; cold weather slows this a lot.
export function strengthAtAge(days: number, f28Mpa: number) {
  const fraction = days / (4 + 0.85 * days);
  return {
    days,
    percentOf28Day: round(fraction * 100, 1),
    estimatedMpa: round(fraction * f28Mpa, 1),
  };
}

export function strengthCurve(f28Mpa: number, ages = [1, 3, 7, 14, 21, 28, 56]) {
  return ages.map((d) => strengthAtAge(d, f28Mpa));
}

function round(n: number, digits: number) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
