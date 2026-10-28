// Shared site details for metadata, sitemap, robots and structured data.
// Set NEXT_PUBLIC_SITE_URL to the production domain so absolute URLs are correct.
export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  name: "Cemento y Concreto · IA",
  shortName: "Cemento y Concreto",
  description:
    "Asistente de obra con inteligencia artificial y calculadora de concreto: calcula bultos de cemento, arena, grava y agua, dosifica mezclas, y aprende a colar, curar y reparar grietas.",
  keywords: [
    "calculadora de concreto",
    "calcular cemento",
    "bultos de cemento",
    "dosificación de concreto",
    "mezcla de concreto",
    "proporciones cemento arena grava",
    "cálculo de materiales de construcción",
    "losa de concreto",
    "curado de concreto",
    "resistencia del concreto",
    "grietas en concreto",
    "asistente de construcción con IA",
  ],
  locale: "es_MX",
  themeColor: "#0c0a09",
};
