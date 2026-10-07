import "server-only";
import { z } from "zod";
const optional = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);
const url = z.preprocess((v) => (v === "" ? undefined : v), z.url().optional());
const schema = z
  .object({
    SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: optional,
    GEMINI_API_KEY: optional,
    GROQ_API_KEY: optional,
    LLM_PROVIDER: z.enum(["gemini", "groq", "ollama"]).default("gemini"),
    GEMINI_MODEL: z.string().default("gemini-3.5-flash-lite"),
    GROQ_MODEL: z.string().default("openai/gpt-oss-20b"),
    OLLAMA_BASE_URL: z.url().default("http://localhost:11434"),
    OLLAMA_MODEL: optional,
  })
  .superRefine((v, c) => {
    if (v.SUPABASE_SERVICE_ROLE_KEY && !v.SUPABASE_URL)
      c.addIssue({
        code: "custom",
        message: "SUPABASE_SERVICE_ROLE_KEY requires SUPABASE_URL",
      });
  });
export const env = schema.parse(process.env);
