/**
 * @import { PluginOption } from "vite";
 *
 * @import { DeepPartial } from "./utilities.js";
 * @import { PluginOptions } from "./plugin-options.js";
 */

import { Bundler } from "./bundler.js";
import { Compiler } from "./compiler.js";
import { DevServer } from "./dev-server.js";
import { Environment } from "./environment.js";

/**
 * @param {DeepPartial<PluginOptions>} options
 * @returns {PluginOption}
 */
export function moru(options = {}) {
  const environment = new Environment(options);

  return [
    environment,
    new Compiler(environment),
    new DevServer(environment),
    new Bundler(environment),
  ];
}
