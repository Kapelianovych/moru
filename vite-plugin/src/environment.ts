import { join } from "node:path";

import { globSync } from "glob";
import {
  mergeConfig,
  type Plugin,
  type ResolvedConfig,
  type UserConfig,
} from "vite";

import type { DeepPartial } from "./utilities.js";
import type { MoruEntries, PluginOptions } from "./plugin-options.js";

const DEFAULT_ENTRIES_SETTINGS: MoruEntries = {
  suffix: ".page",
  include: [""],
  exclude: ["node_modules/**"],
};

export class Environment implements Plugin {
  name = "@moru/environment";
  enforce = "pre" as const;
  pluginOptions: PluginOptions;
  viteConfiguration!: ResolvedConfig;

  config = (_config: UserConfig): UserConfig => {
    const foldersToStart = this.pluginOptions.entries.include.join(",").trim();
    const htmlFiles = globSync(
      join(
        foldersToStart ? "{" + foldersToStart + "}" : "",
        "**",
        `*${this.pluginOptions.entries.suffix}.html`,
      ),
      { ignore: this.pluginOptions.entries.exclude },
    );

    return {
      optimizeDeps: { exclude: ["build"] },
      build: {
        rollupOptions: {
          input: htmlFiles,
        },
      },
    };
  };

  configResolved = (config: ResolvedConfig): void => {
    this.viteConfiguration = config;
  };

  constructor(pluginOptions: DeepPartial<PluginOptions>) {
    this.pluginOptions = mergeConfig<PluginOptions, DeepPartial<PluginOptions>>(
      { entries: DEFAULT_ENTRIES_SETTINGS },
      pluginOptions,
      true,
    ) as PluginOptions;
  }
}
