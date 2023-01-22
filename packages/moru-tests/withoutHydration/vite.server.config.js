import { defineConfig } from "vitest/config";

import viteCommonConfig from "../shared.vite.js";

export default defineConfig({
  test: {
    include: ["**/*.server.test.{js,jsx}"],
  },
  ...viteCommonConfig,
});
