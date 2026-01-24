import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "./controller",
  esbuild: {
    target: "es2024",
    include: /\.js$/,
    exclude: [],
    keepNames: true,
  },
  test: {
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: "webkit" }],
    },
  },
});
