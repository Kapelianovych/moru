import { relative } from "node:path";

import { normalizePath, type Plugin } from "vite";

import type { Environment } from "./environment.js";

export class Bundler implements Plugin {
  name = "@moru/bundler";
  enforce = "post" as const;

  generateBundle = (
    _: unknown,
    bundle: Record<string, { fileName: string }>,
  ): void => {
    // We expect these files to be the ones populated by the environment plugin.
    const entryFiles = this.environment.viteConfiguration.build.rollupOptions
      .input as Array<string>;

    for (const file of entryFiles) {
      const path = normalizePath(
        relative(this.environment.viteConfiguration.root, file),
      );
      const fileName = bundle[path].fileName;

      bundle[path].fileName = normalizePath(
        fileName.replace(this.environment.pluginOptions.entries.suffix, ""),
      );
    }
  };

  constructor(private environment: Environment) {}
}
