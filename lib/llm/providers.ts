import "server-only";
import { z } from "zod";
import { env } from "../env";
import { decisionSchema } from "../football/types";
import type { LLMProvider, MessiScenarioInput } from "./provider";
import { SYSTEM_PROMPT, buildPrompt, outputSchema } from "./prompt";
async function post(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Provider HTTP ${r.status}`);
  return r.json() as Promise<unknown>;
}
export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  readonly model = env.GEMINI_MODEL;
  async decideScenario(input: MessiScenarioInput) {
    const raw = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
      {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseJsonSchema: outputSchema,
        },
      },
      { "x-goog-api-key": env.GEMINI_API_KEY! },
    );
    const envelope = z
      .object({
        candidates: z
          .array(
            z.object({
              content: z.object({
                parts: z.array(
                  z.object({
                    text: z.string().optional(),
                    thought: z.boolean().optional(),
                  }),
                ),
              }),
            }),
          )
          .min(1),
      })
      .parse(raw);
    const text = envelope.candidates[0].content.parts
      .filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("");
    return decisionSchema.parse(JSON.parse(text));
  }
}
export class GroqProvider implements LLMProvider {
  readonly name = "groq";
  readonly model = env.GROQ_MODEL;
  async decideScenario(input: MessiScenarioInput) {
    const raw = await post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: this.model,
        temperature: 0.2,
        max_completion_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(input) },
        ],
      },
      { Authorization: `Bearer ${env.GROQ_API_KEY}` },
    );
    const envelope = z
      .object({
        choices: z
          .array(z.object({ message: z.object({ content: z.string() }) }))
          .min(1),
      })
      .parse(raw);
    return decisionSchema.parse(
      JSON.parse(envelope.choices[0].message.content),
    );
  }
}
export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  readonly model = env.OLLAMA_MODEL!;
  async decideScenario(input: MessiScenarioInput) {
    const raw = await post(
      `${env.OLLAMA_BASE_URL.replace(/\/$/, "")}/api/chat`,
      {
        model: this.model,
        stream: false,
        format: outputSchema,
        options: { temperature: 0.2, num_predict: 700 },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(input) },
        ],
      },
    );
    const envelope = z
      .object({ message: z.object({ content: z.string() }) })
      .parse(raw);
    return decisionSchema.parse(JSON.parse(envelope.message.content));
  }
}
export function configuredProvider(): LLMProvider | null {
  if (env.LLM_PROVIDER === "gemini" && env.GEMINI_API_KEY)
    return new GeminiProvider();
  if (env.LLM_PROVIDER === "groq" && env.GROQ_API_KEY)
    return new GroqProvider();
  if (env.LLM_PROVIDER === "ollama" && env.OLLAMA_MODEL)
    return new OllamaProvider();
  return null;
}
