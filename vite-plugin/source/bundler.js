/**
 * @import { Plugin } from "vite";
 *
 * @import { Environment } from "./environment.js";
 */

import { relative } from "node:path";

import { normalizePath } from "vite";

/**
 * @implements {Plugin}
 */
export class Bundler {
  /**
   * @type {Environment}
   */
  #environment;

  /**
   * @readonly
   */
  name = "@moru/bundler";
  enforce = /** @type {const} */ ("post");

  /**
   * @param {unknown} _
   * @param {Record<string, { fileName: string }>} bundle
   * @returns {void}
   */
  generateBundle = (_, bundle) => {
    // We expect these files to be the ones populated by the environment plugin.
    const entryFiles = /** @type {Array<string>} */ (
      this.#environment.viteConfiguration.build.rollupOptions.input
    );

    for (const file of entryFiles) {
      const path = normalizePath(
        relative(this.#environment.viteConfiguration.root, file),
      );
      const fileName = bundle[path].fileName;

      bundle[path].fileName = normalizePath(
        fileName.replace(this.#environment.pluginOptions.entries.suffix, ""),
      );
    }
  };

  /**
   * @param {Environment} environment
   */
  constructor(environment) {
    this.#environment = environment;
  }
}
