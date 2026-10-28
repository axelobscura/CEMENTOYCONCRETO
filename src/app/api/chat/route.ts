import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { makeTools } from "@/lib/tools";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are "Maestro", an expert assistant for cement and concrete construction: mix design, estimating materials, formwork, reinforcement basics, placing, finishing, curing, cold/hot weather concreting, testing (slump, cylinders), and troubleshooting defects (cracking, scaling, honeycombing, efflorescence).

How to work:
- Reply in Spanish by default. If the user writes in another language (e.g. English), reply in that language instead.
- When the user gives dimensions or asks "how much concrete/cement/sand/gravel", use the tools instead of doing arithmetic in your head. Convert imperial units to meters before calling tools, and report results in the user's units as well (yd³, ft³, 94 lb bags) when they used imperial.
- Show a short, scannable answer: the key numbers first, then the assumptions (mix class, waste %, bag size), then practical tips.
- Be honest about limits: nominal mixes and rules of thumb are fine for sidewalks, small slabs and DIY work; for structural elements, suspended slabs, retaining walls or anything governed by code, say a licensed engineer and local code (ACI 318, NSR-10, NTC, Eurocode 2, etc.) must govern.
- Include safety notes when relevant: wet cement is alkaline and causes chemical burns — gloves, eye protection, long sleeves.`;

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) }))
    .min(1)
    .max(60),
});

const client = new Anthropic();

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      const tools = makeTools((call) => send({ type: "tool", ...call }));

      try {
        const runner = client.beta.messages.toolRunner({
          model: "claude-opus-5-5",
          max_tokens: 64000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "medium" },
          system: SYSTEM_PROMPT,
          tools,
          messages: parsed.data.messages,
          stream: true,
        });

        for await (const messageStream of runner) {
          for await (const event of messageStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              send({ type: "text", text: event.delta.text });
            } else if (event.type === "content_block_start" && event.content_block.type === "thinking") {
              send({ type: "thinking" });
            }
          }
          const message = await messageStream.finalMessage();
          const hasToolUse = message.content.some((b) => b.type === "tool_use");
          if (message.stop_reason === "max_tokens" && hasToolUse) {
            send({ type: "error", message: "La respuesta se cortó a mitad del cálculo. Intenta con una pregunta más corta." });
            break;
          }
          if (message.stop_reason === "refusal") {
            send({ type: "error", message: "El asistente no pudo responder a esta solicitud." });
            break;
          }
          // Separate text from consecutive turns of the tool loop.
          if (hasToolUse) send({ type: "text", text: "\n\n" });
        }
      } catch (err) {
        send({ type: "error", message: describeError(err) });
      } finally {
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache" },
  });
}

function describeError(err: unknown): string {
  console.error(err);
  if (err instanceof Anthropic.AuthenticationError) {
    return "Credenciales de Anthropic faltantes o inválidas. Configura ANTHROPIC_API_KEY en .env.local y reinicia el servidor.";
  }
  if (err instanceof Anthropic.RateLimitError) return "Demasiadas solicitudes. Espera un momento e intenta de nuevo.";
  if (err instanceof Anthropic.APIConnectionError) return "No se pudo conectar con la API de Anthropic. Revisa tu conexión a internet.";
  if (err instanceof Anthropic.APIError) return `Error de la API (${err.status ?? "desconocido"}). Intenta de nuevo.`;
  if (err instanceof Error && /credentials|api key|apiKey/i.test(err.message)) {
    return "No se encontró la clave de API de Anthropic. Configura ANTHROPIC_API_KEY en .env.local y reinicia el servidor.";
  }
  return "Algo salió mal. Intenta de nuevo.";
}
