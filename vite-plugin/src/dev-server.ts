import { extname, normalize } from "node:path";

import type { HmrContext, ModuleNode, Plugin, ViteDevServer } from "vite";

import type { Environment } from "./environment.js";

export class DevServer implements Plugin {
  name = "@moru/dev-server";

  configureServer = (server: ViteDevServer): VoidFunction => {
    return () => {
      server.middlewares.use((req, _res, next) => {
        const url = new URL(req.originalUrl!, "https://localhost");
        const isFolderAccess = url.pathname.endsWith("/");

        if (isFolderAccess || !extname(normalize(url.pathname))) {
          url.pathname =
            url.pathname +
            `${
              isFolderAccess ? "" : "/"
            }index${this.environment.pluginOptions.entries.suffix}.html`;
          req.originalUrl = req.url = url.pathname + url.search + url.hash;
        }

        next();
      });
    };
  };

  handleHotUpdate = (context: HmrContext): Array<ModuleNode> => {
    // Ask for a page reload when some file inside the project changes.
    context.server.ws.send({ type: "full-reload" });
    return [];
  };

  constructor(private environment: Environment) {}
}
