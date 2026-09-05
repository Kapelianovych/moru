import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import vitestDecoratorPlugin from "./vitest.decorator.plugin.js";

export default defineConfig({
  root: "./controller",
  plugins: [vitestDecoratorPlugin],
  test: {
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: "webkit" }],
      screenshotFailures: false,
    },
  },
});
