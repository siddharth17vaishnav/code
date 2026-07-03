import dotenv from "dotenv";

dotenv.config();

export const config = {
  projectPath: process.env.PROJECT_PATH!,
  storageDir: "./storage",
  lanceDbDir: "./storage/lancedb",
  manifestPath: "./storage/manifest.json",

  ollama: {
    llm: process.env.LLM_MODEL!,
    embedding: process.env.EMBED_MODEL!,
    baseUrl: process.env.OLLAMA_BASE_URL!,
  },

  chunking: {
    maxLines: 80,
    overlap: 20,
  },

  retrieval: {
    topK: 8,
  },

  watch: {
    debounceMs: 2000,
  },

  agent: {
    maxSteps: 8,
    maxHistoryTurns: 10,
  },

  preview: {
    enabled: true,
    host: "127.0.0.1",
    port: 3847,
    timeoutMs: 5 * 60 * 1000,
  },

  include: [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "**/*.json",
    "**/*.md",
    "**/*.css",
    "**/*.scss",
    "**/*.html",
  ],

  exclude: [
    "**/node_modules/**",
    "**/.git/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/.turbo/**",
    "**/.cache/**",
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.gif",
    "**/*.svg",
    "**/*.ico",
    "**/*.lock",
    "**/package-lock.json",
    "**/pnpm-lock.yaml",
    "**/yarn.lock",
  ],
};