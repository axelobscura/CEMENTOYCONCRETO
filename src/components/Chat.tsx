"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ToolCall = { name: string; input: unknown; result: unknown };
type Message = {
  role: "user" | "assistant";
  content: string;
  tools?: ToolCall[];
  error?: string;
};

const SUGGESTIONS = [
  "¿Cuántos bultos de cemento necesito para un patio de 6 m × 4 m y 10 cm de espesor?",
  "Voy a colar 8 columnas redondas de 30 cm de diámetro y 2.8 m de alto. ¿Cuánto concreto M20 necesito?",
  "¿Cuándo puedo descimbrar una losa de 25 MPa?",
  "¿Por qué se agrieta mi losa de concreto y cómo lo evito?",
];

const TOOL_LABELS: Record<string, string> = {
  calculate_concrete_volume: "Cálculo de volumen",
  calculate_mix_materials: "Materiales de la mezcla",
  estimate_strength_gain: "Ganancia de resistencia",
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    // Only completed text turns go back to the API.
    const history = [...messages, { role: "user" as const, content: question }];
    const payload = history
      .filter((m) => m.content.trim())
      .map(({ role, content }) => ({ role, content }));

    setMessages([...history, { role: "assistant", content: "", tools: [] }]);
    setInput("");
    setBusy(true);
    setThinking(true);

    const update = (fn: (m: Message) => Message) =>
      setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      if (!res.ok || !res.body) throw new Error(`La solicitud falló (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "text") {
            setThinking(false);
            update((m) => ({ ...m, content: m.content + event.text }));
          } else if (event.type === "thinking") {
            setThinking(true);
          } else if (event.type === "tool") {
            update((m) => ({ ...m, tools: [...(m.tools ?? []), event] }));
          } else if (event.type === "error") {
            update((m) => ({ ...m, error: event.message }));
          }
        }
      }
    } catch (err) {
      update((m) => ({ ...m, error: err instanceof Error ? err.message : "La solicitud falló" }));
    } finally {
      setBusy(false);
      setThinking(false);
    }
  }

  return (
    <section className="flex h-full min-h-[70vh] flex-col rounded-2xl border border-stone-200 bg-white/85 shadow-sm backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/80">
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Pregúntale al Maestro lo que quieras sobre concreto</h2>
              <p className="text-sm text-stone-500">
                Cálculo de materiales, proporciones de mezcla, curado, acabados, grietas — en español o inglés.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-stone-200 p-3 text-left text-sm hover:border-orange-400 hover:bg-orange-50 dark:border-stone-700 dark:hover:bg-stone-800"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "user" ? (
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-stone-800 px-4 py-2 text-white dark:bg-stone-700">
                {m.content}
              </div>
            ) : (
              <div className="space-y-3">
                {m.tools?.map((t, j) => (
                  <details key={j} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs dark:border-orange-900 dark:bg-stone-800">
                    <summary className="cursor-pointer font-medium text-orange-700 dark:text-orange-400">
                      🧮 {TOOL_LABELS[t.name] ?? t.name}
                    </summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-stone-700 dark:text-stone-300">
                      {JSON.stringify(t.result, null, 2)}
                    </pre>
                  </details>
                ))}
                {m.content && (
                  <div className="prose prose-stone max-w-none text-[15px] dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                )}
                {m.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                    {m.error}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {busy && thinking && (
          <p className="animate-pulse text-sm text-stone-500">El Maestro está calculando…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-stone-200 p-3 dark:border-stone-800"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ej. Cochera de 12 m × 3 m × 12 cm — ¿cuánto concreto necesito?"
          className="flex-1 resize-none rounded-xl border border-stone-300 bg-transparent px-3 py-2 outline-none focus:border-orange-500 dark:border-stone-700"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-orange-600 px-4 font-medium text-white hover:bg-orange-700 disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
