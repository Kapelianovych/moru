/** @import { Plugin, UserConfig, ResolvedConfig } from "vite"; */

/**
 * @import { DeepPartial } from "./utilities.js";
 * @import { MoruEntries, PluginOptions } from "./plugin-options.js";
 */

import { join } from "node:path";

import { globSync } from "glob";
import { mergeConfig } from "vite";

/** @type {MoruEntries} */
const DEFAULT_ENTRIES_SETTINGS = {
  suffix: ".page",
  include: [""],
  exclude: ["node_modules/**"],
};

/**
 * @implements {Plugin}
 */
export class Environment {
  /** @readonly */
  name = "@moru/environment";
  enforce = /** @type {const} */ ("pre");
  /** @type {PluginOptions} */
  pluginOptions;
  /** @type {ResolvedConfig} */
  // @ts-ignore - it will be set in the configResolved method.
  viteConfiguration;

  /**
   * @param {UserConfig} _config
   * @returns {UserConfig}
   */
  config = (_config) => {
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

  /**
   * @param {ResolvedConfig} config
   * @returns {void}
   */
  configResolved = (config) => {
    this.viteConfiguration = config;
  };

  /**
   * @param {DeepPartial<PluginOptions>} pluginOptions
   */
  constructor(pluginOptions) {
    this.pluginOptions = /** @type {PluginOptions} */ (
      mergeConfig({ entries: DEFAULT_ENTRIES_SETTINGS }, pluginOptions, true)
    );
  }
}
