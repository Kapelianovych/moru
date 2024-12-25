import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isAbsolute, normalize, sep } from "node:path";

import type { IndexHtmlTransform, Plugin } from "vite";
import {
  compileHtml,
  generateHtml,
  parseHtml,
  type Diagnostics,
  type VirtualFile,
} from "@moru/core";

import type { Environment } from "./environment.js";
import { DiagnosticsReporter } from "./diagnostics-reporter.js";

export class Compiler implements Plugin {
  name = "@moru/compiler";
  enforce = "pre" as const;
  diagnostics: Diagnostics;

  transformIndexHtml: IndexHtmlTransform = {
    order: "pre",
    handler: async (html, context) => {
      const virtualFile: VirtualFile = {
        url: context.filename.split(sep).join("/"),
        content: html,
      };

      const tree = parseHtml(virtualFile);
      await compileHtml(tree, virtualFile, {
        properties: {},
        buildStore: new Map(),
        diagnostics: this.diagnostics,
        readFileContent(url) {
          const normalisedPath = normalize(url);

          return readFile(
            isAbsolute(normalisedPath)
              ? normalisedPath
              : // Leverages Node's resolution algorithm.
                fileURLToPath(import.meta.resolve(normalisedPath)),
            "utf8",
          );
        },
        dynamicallyImportJsFile(url) {
          return import(url);
        },
      });
      return generateHtml(tree);
    },
  };

  constructor(environment: Environment) {
    this.diagnostics = new DiagnosticsReporter(environment);
  }
}
