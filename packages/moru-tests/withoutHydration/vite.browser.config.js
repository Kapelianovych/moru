import { defineConfig } from "vitest/config";

import viteCommonConfig from "../shared.vite.js";

export default defineConfig({
  test: {
    include: ["**/*.browser.test.{js,jsx}"],
    environment: "jsdom",
  },
  resolve: {
    conditions: ["browser"],
  },
  ...viteCommonConfig,
});
