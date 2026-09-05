import { defineConfig } from "vitest/config";

import vitestDecoratorPlugin from "./vitest.decorator.plugin.js";

export default defineConfig({
  root: "./server",
  plugins: [vitestDecoratorPlugin],
});
