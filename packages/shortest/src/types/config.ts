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

const aiSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("anthropic"),
    apiKey: z
      .string()
      .default(
        () =>
          process.env[getShortestEnvName("ANTHROPIC_API_KEY")] ||
          process.env.ANTHROPIC_API_KEY!,
      ),
    model: z.enum(ANTHROPIC_MODELS).default(ANTHROPIC_MODELS[0]),
  }).strict(),
  z.object({
    provider: z.literal("azure"),
    apiKey: z
      .string()
      .default(
        () =>
          process.env[getShortestEnvName("AZURE_API_KEY")] ||
          process.env.AZURE_API_KEY!,
      ),
    endpoint: z
      .string()
      .url("must be a valid URL")
      .default(
        () =>
          process.env[getShortestEnvName("AZURE_OPENAI_ENDPOINT")] ||
          process.env.AZURE_OPENAI_ENDPOINT!,
      ),
    deployment: z
      .string()
      .default(
        () =>
          process.env[getShortestEnvName("AZURE_OPENAI_DEPLOYMENT")] ||
          process.env.AZURE_OPENAI_DEPLOYMENT!,
      ),
  }).strict(),
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
    anthropicKey: z.string().optional(),
    ai: aiSchema,
    mailosaur: mailosaurSchema.optional(),
    caching: cachingSchema.optional().default(cachingSchema.parse({})),
  })
  .strict();

export const userConfigSchema = configSchema.extend({
  browser: browserSchema.optional(),
  testPattern: testPatternSchema.optional(),
  ai: z.union([
    aiSchema,
    z.object({
      provider: z.enum(["anthropic", "azure"]),
      apiKey: z.string().optional(),
      model: z.enum(ANTHROPIC_MODELS).optional(),
      endpoint: z.string().optional(),
      deployment: z.string().optional(),
    }),
  ]).optional(),
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
