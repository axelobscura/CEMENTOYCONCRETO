import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import {
  MIX_CLASSES,
  type MixClass,
  mixMaterials,
  strengthCurve,
  volumeM3,
} from "./concrete";

const mixClassEnum = z.enum(Object.keys(MIX_CLASSES) as [MixClass, ...MixClass[]]);

export type ToolEvent = { name: string; input: unknown; result: unknown };

// Tools are built per request so each call can be reported to the UI.
export function makeTools(onCall: (e: ToolEvent) => void) {
  const report = (name: string, input: unknown, result: unknown) => {
    onCall({ name, input, result });
    return JSON.stringify(result);
  };

  const calculateVolume = betaZodTool({
    name: "calculate_concrete_volume",
    description:
      "Compute the wet volume of concrete (m³) for one or more pours. Use 'rectangular' for slabs, footings, walls and beams; 'cylinder' for round columns, piers and sonotubes. All dimensions in meters — convert from feet/inches/cm before calling.",
    inputSchema: z.object({
      pours: z
        .array(
          z.object({
            label: z.string().describe("Short name, e.g. 'garage slab'"),
            shape: z.enum(["rectangular", "cylinder"]),
            length_m: z.number().positive().optional(),
            width_m: z.number().positive().optional(),
            depth_m: z.number().positive().optional().describe("Thickness/depth for rectangular shapes"),
            diameter_m: z.number().positive().optional(),
            height_m: z.number().positive().optional(),
            quantity: z.number().int().positive().default(1),
          }),
        )
        .min(1),
    }),
    eager_input_streaming: true,
    run: ({ pours }) => {
      const items = pours.map((p) => {
        if (p.shape === "rectangular") {
          if (!p.length_m || !p.width_m || !p.depth_m)
            return { label: p.label, error: "rectangular needs length_m, width_m and depth_m" };
          const v = volumeM3({ kind: "rectangular", lengthM: p.length_m, widthM: p.width_m, depthM: p.depth_m }, p.quantity);
          return { label: p.label, volume_m3: +v.toFixed(3) };
        }
        if (!p.diameter_m || !p.height_m)
          return { label: p.label, error: "cylinder needs diameter_m and height_m" };
        const v = volumeM3({ kind: "cylinder", diameterM: p.diameter_m, heightM: p.height_m }, p.quantity);
        return { label: p.label, volume_m3: +v.toFixed(3) };
      });
      const total = items.reduce((sum, i) => sum + ("volume_m3" in i ? (i.volume_m3 ?? 0) : 0), 0);
      return report("calculate_concrete_volume", { pours }, {
        items,
        total_m3: +total.toFixed(3),
        total_yd3: +(total * 1.30795).toFixed(3),
      });
    },
  });

  const calculateMix = betaZodTool({
    name: "calculate_mix_materials",
    description:
      "Estimate cement bags, sand, gravel and water for a given wet volume using a nominal volumetric mix. Classes: " +
      Object.entries(MIX_CLASSES)
        .map(([k, v]) => `${k} = ${v.label}`)
        .join("; ") +
      ". Use for site-mixed or small jobs; recommend ready-mix and an engineered design for large or structural pours.",
    inputSchema: z.object({
      volume_m3: z.number().positive(),
      mix_class: mixClassEnum.default("M20"),
      waste_percent: z.number().min(0).max(30).default(5),
      bag_kg: z.number().positive().default(50).describe("Cement bag size in kg (50 typical; 42.5 kg = 94 lb US bag; 25 kg)"),
    }),
    eager_input_streaming: true,
    run: (input) =>
      report(
        "calculate_mix_materials",
        input,
        mixMaterials(input.volume_m3, input.mix_class, input.waste_percent, input.bag_kg),
      ),
  });

  const strengthGain = betaZodTool({
    name: "estimate_strength_gain",
    description:
      "Estimate compressive strength over time for moist-cured ordinary Portland cement concrete (ACI 209 curve, ~20 °C). Useful for formwork stripping, opening a slab to traffic, or loading decisions.",
    inputSchema: z.object({
      f28_mpa: z.number().positive().describe("Specified 28-day strength in MPa (psi ÷ 145)"),
      ages_days: z.array(z.number().positive()).optional(),
    }),
    eager_input_streaming: true,
    run: (input) =>
      report("estimate_strength_gain", input, {
        assumptions: "Cemento Portland ordinario (CPO/Tipo I), curado húmedo continuo a ~20 °C. El clima frío, la ceniza volante o la escoria retrasan la ganancia temprana.",
        curve: strengthCurve(input.f28_mpa, input.ages_days),
      }),
  });

  return [calculateVolume, calculateMix, strengthGain];
}
