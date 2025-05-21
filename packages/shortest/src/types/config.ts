import { BrowserContextOptions } from "playwright";
import { z } from "zod";

export const cliOptionsSchema = z.object({
  headless: z.boolean().optional(),
  baseUrl: z.string().optional().default("http://localhost:3000"),
  testPattern: z.string().optional().default("**/*.test.ts"),
  noCache: z.boolean().optional(),
});
export type CLIOptions = z.infer<typeof cliOptionsSchema>;

/**
 * List of Anthropic models that are supported by the AI client.
 *
 * @see https://sdk.vercel.ai/providers/ai-sdk-providers/anthropic#model-capabilities
 * @see https://docs.anthropic.com/en/docs/about-claude/models/all-models
 */
export const ANTHROPIC_MODELS = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-latest",
  "claude-3-7-sonnet-20250219",
  "claude-3-7-sonnet-latest",
] as const;
export const anthropicModelSchema = z.enum(ANTHROPIC_MODELS);
export type AnthropicModel = z.infer<typeof anthropicModelSchema>;

// Schema for Anthropic AI Configuration
const anthropicAISchema = z
  .object({
    provider: z.literal("anthropic"),
    apiKey: z
      .string()
      .default(
        () =>
          process.env[getShortestEnvName("ANTHROPIC_API_KEY")] ||
          process.env.ANTHROPIC_API_KEY!,
      ),
    model: anthropicModelSchema.default(ANTHROPIC_MODELS[0]),
  })
  .strict();

// Schema for Ollama AI Configuration
const ollamaAISchema = z
  .object({
    provider: z.literal("ollama"),
    model: z.string().default("llama3"), // Default Ollama model
    ollamaBaseUrl: z.string().url().optional(),
  })
  .strict();

// Union of AI provider schemas
const aiSchema = z.discriminatedUnion("provider", [
  anthropicAISchema,
  ollamaAISchema,
]);
export type AIConfig = z.infer<typeof aiSchema>;

const cachingSchema = z
  .object({
    enabled: z.boolean().default(true),
  })
  .strict();
export type CachingConfig = z.infer<typeof cachingSchema>;

const mailosaurSchema = z
  .object({
    apiKey: z.string(),
    serverId: z.string(),
  })
  .optional();

export const testPatternSchema = z.string().default("**/*.test.ts");

const browserSchema = z.object({
  /**
   * @see https://playwright.dev/docs/api/class-browser#browser-new-context
   */
  contextOptions: z.custom<BrowserContextOptions>().optional(),
});

export const configSchema = z
  .object({
    headless: z.boolean().default(true),
    baseUrl: z.string().url("must be a valid URL"),
    browser: browserSchema.strict().partial().default(browserSchema.parse({})),
    testPattern: testPatternSchema,
    anthropicKey: z.string().optional(), // This seems like a legacy/deprecated field, consider removing if not used
    ai: aiSchema,
    mailosaur: mailosaurSchema.optional(),
    caching: cachingSchema.optional().default(cachingSchema.parse({})),
  })
  .strict();

export const userConfigSchema = configSchema.extend({
  browser: browserSchema.optional(),
  testPattern: testPatternSchema.optional(),
  // For user config, AI object itself is optional, and its contents are partial.
  // We need to make the union itself optional, and then make each member of the union partial.
  // This is a bit tricky with discriminated unions.
  // A common approach is to make the entire AI block optional and then use .partial() on each part of the union for the user config.
  ai: z
    .discriminatedUnion("provider", [
      anthropicAISchema.partial(),
      ollamaAISchema.partial(),
    ])
    .optional(),
  caching: cachingSchema.strict().partial().optional(),
});

const SHORTEST_ENV_PREFIX = "SHORTEST_";

const getShortestEnvName = (key: string) => `${SHORTEST_ENV_PREFIX}${key}`;

// User-provided config type - allows partial/optional AI settings
// Used when reading config from shortest.config.ts
export type ShortestConfig = z.infer<typeof userConfigSchema>;

// Internal fully-validated config type with required fields
// Used after config validation and defaults are applied
export type ShortestStrictConfig = z.infer<typeof configSchema>;
