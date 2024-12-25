import type { Plugin } from "vite";

import { Bundler } from "./bundler.js";
import { Compiler } from "./compiler.js";
import { DevServer } from "./dev-server.js";
import { Environment } from "./environment.js";
import type { DeepPartial } from "./utilities.js";
import type { PluginOptions } from "./plugin-options.js";

export function moru(options: DeepPartial<PluginOptions> = {}): Array<Plugin> {
  const environment = new Environment(options);

  return [
    environment,
    new Compiler(environment),
    new DevServer(environment),
    new Bundler(environment),
  ];
}
