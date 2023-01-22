import { defineConfig } from "vitest/config";

import viteCommonConfig from "./shared.vite.js";

export default defineConfig({
  test: {
    include: ["*.common.test.{js,jsx}"],
  },
  ...viteCommonConfig,
});
