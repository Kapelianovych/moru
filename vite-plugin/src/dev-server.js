/** @import { Plugin, HmrContext, ModuleNode, ViteDevServer } from "vite"; */

/** @import { Environment } from "./environment.js"; */

import { extname, normalize } from "node:path";

/**
 * @implements {Plugin}
 */
export class DevServer {
  /** @type {Environment} */
  #environment;

  /** @readonly */
  name = "@moru/dev-server";

  /**
   * @param {ViteDevServer} server
   * @returns {VoidFunction}
   */
  configureServer = (server) => {
    return () => {
      server.middlewares.use((req, _res, next) => {
        const url = new URL(req.originalUrl ?? "", "https://localhost");
        const isFolderAccess = url.pathname.endsWith("/");

        if (isFolderAccess || !extname(normalize(url.pathname))) {
          url.pathname =
            url.pathname +
            `${isFolderAccess ? "" : "/"}index${this.#environment.pluginOptions.entries.suffix}.html`;
          req.originalUrl = req.url = url.pathname + url.search + url.hash;
        }

        next();
      });
    };
  };

  /**
   * @param {HmrContext} context
   * @returns {Array<ModuleNode>}
   */
  handleHotUpdate = (context) => {
    context.server.ws.send({ type: "full-reload" });
    return [];
  };

  /**
   * @param {Environment} environment
   */
  constructor(environment) {
    this.#environment = environment;
  }
}
