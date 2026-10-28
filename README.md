# Cemento y Concreto · AI

A Next.js app for cement and concrete construction:

- **Maestro**, an AI assistant powered by Claude (`claude-opus-5-5`). It answers questions about mix design, estimating, placing, finishing and curing concrete, and fixing defects, in Spanish by default (or English if the user writes in English). The interface is in Spanish. It calls calculation tools for the numbers, so it doesn't do the math in its head.
- **Quick calculator**: works instantly in the browser to estimate volume, cement bags, sand, gravel and water.

## Setup

```bash
npm install
cp .env.example .env.local   # then add your Anthropic API key
npm run dev
```

Open http://localhost:3000. The home page (`/`) is a splash screen, and **Comenzar** takes you to the assistant and calculator at `/calculadora`.

## How it works

| File | Purpose |
|---|---|
| `src/app/page.tsx` → `src/components/Splash.tsx` | Home page / splash screen (background photo by Rodolfo Quirós on Pexels) |
| `src/app/calculadora/page.tsx` | Assistant and calculator page (background photo by SMC on Pexels) |
| `src/app/icon.svg` | Favicon, also used as the logo |
| `src/lib/concrete.ts` | Calculations: volumes, nominal mixes (M10–M25), and ACI 209 strength gain |
| `src/lib/tools.ts` | The calculations wrapped as Claude tools (`betaZodTool`) |
| `src/app/api/chat/route.ts` | Streams the chat and runs the tool loop with `client.beta.messages.toolRunner`, sending results as NDJSON |
| `src/components/Chat.tsx` | Chat UI that renders markdown and shows each tool calculation |
| `src/components/Calculator.tsx` | Offline material calculator |

Server-side refusal fallbacks (`fallbacks: "default"`) are on. Effort is set to `medium`. You can change it in `route.ts`.

> Estimates are for small jobs and guidance only. Structural work needs an engineered mix design and must follow local code.
