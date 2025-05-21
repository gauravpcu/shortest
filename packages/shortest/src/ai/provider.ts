import { createAnthropic } from "@ai-sdk/anthropic";
import { azure } from "@ai-sdk/azure";
import { LanguageModelV1 } from "ai";
import { AIConfig } from "@/types";
import { AIError } from "@/utils/errors";

/**
 * Creates a custom AI provider based on the provided configuration.
 *
 * @private
 */
export const createProvider = (aiConfig: AIConfig): LanguageModelV1 => {
  switch (aiConfig.provider) {
    case "anthropic":
      const anthropic = createAnthropic({ apiKey: aiConfig.apiKey });
      return anthropic(aiConfig.model) as LanguageModelV1;
    case "azure":
      if (!aiConfig.endpoint || !aiConfig.deployment) {
        throw new AIError(
          "unsupported-provider",
          "Azure OpenAI requires endpoint and deployment configuration."
        );
      }
      const azureOpenAI = azure({
        apiKey: aiConfig.apiKey,
        endpoint: aiConfig.endpoint,
        deployment: aiConfig.deployment
      });
      return azureOpenAI() as LanguageModelV1;
    default:
      throw new AIError(
        "unsupported-provider",
        `${aiConfig.provider} is not supported.`,
      );
  }
};
