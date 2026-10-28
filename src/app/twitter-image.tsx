import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — Calculadora y asistente de obra`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0c0a09 0%, #292524 60%, #7c2d12 100%)",
          color: "#f5f5f4",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, color: "#fdba74" }}>CEMENTO Y CONCRETO · IA</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 80, fontWeight: 700, lineHeight: 1.05 }}>
          CONSTRUYE CON&nbsp;<span style={{ color: "#fb923c" }}>PRECISIÓN</span>
        </div>
        <div style={{ marginTop: 32, fontSize: 32, color: "#a8a29e", maxWidth: 900 }}>
          Calcula cemento, arena, grava y agua. Mezcla, cuela y cura concreto con ayuda de IA.
        </div>
      </div>
    ),
    size,
  );
}
