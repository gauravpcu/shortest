import type { ShortestConfig } from "@antiwork/shortest";

export default {
  headless: false,
  baseUrl: "http://buyer.procurementpartners.com",
  testPattern: "app/**/*.test.ts",
  ai: {
    provider: "anthropic",
  },
  mailosaur: {
    apiKey: process.env.MAILOSAUR_API_KEY!,
    serverId: process.env.MAILOSAUR_SERVER_ID!,
  },
} satisfies ShortestConfig;
