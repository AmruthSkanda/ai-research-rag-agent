import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { config } from "dotenv";

// Load environment variables from .env files
config({ path: ".env.local" });
config({ path: ".env" });

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OPENROUTER_API_KEY: z.string().min(1, "OpenRouter API key is required"),
    DATABASE_URL: z.string().optional(),
  },
  client: {
    // Add any client-side environment variables here if needed
  },
  experimental__runtimeEnv: {
    // Add any runtime environment variables here if needed
  },
});
