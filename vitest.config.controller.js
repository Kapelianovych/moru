import babel from "@rolldown/plugin-babel";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "./controller",
  plugins: [
    babel({
      presets: [
        {
          preset() {
            return {
              plugins: [
                ["@babel/plugin-proposal-decorators", { version: "2023-11" }],
              ],
            };
          },
          rolldown: {
            // Only run this transform if the file contains a decorator.
            filter: {
              code: "@",
            },
          },
        },
      ],
    }),
  ],
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
