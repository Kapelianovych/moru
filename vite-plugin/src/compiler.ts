import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isAbsolute, normalize, sep, resolve, dirname } from "node:path";

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

const NON_RESOLVEABLE_URL_PREFIX = /^(?:https?:|#|\/|data:)/;

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
        exports: {},
        properties: {},
        buildStore: new Map(),
        diagnostics: this.diagnostics,
        resolveUrl: this.#resolveUrl,
        readFileContent: this.#readFileContent,
        dynamicallyImportJsFile: this.#dynamicallyImportJsFile,
      });
      return generateHtml(tree);
    },
  };

  constructor(environment: Environment) {
    this.diagnostics = new DiagnosticsReporter(environment);
  }

  #resolveUrl(currentFile: VirtualFile, relativeUrl: string): string {
    if (
      NON_RESOLVEABLE_URL_PREFIX.test(relativeUrl) ||
      relativeUrl === "build"
    ) {
      return relativeUrl;
    } else if (relativeUrl.startsWith(".")) {
      return resolve(dirname(currentFile.url), relativeUrl).replace(sep, "/");
    } else {
      return fileURLToPath(import.meta.resolve(relativeUrl)).replace(sep, "/");
    }
  }

  #readFileContent(url: string): Promise<string> {
    const normalisedPath = normalize(url);

    return readFile(
      isAbsolute(normalisedPath)
        ? normalisedPath
        : // Leverages Node's resolution algorithm.
          fileURLToPath(import.meta.resolve(normalisedPath)),
      "utf8",
    );
  }

  #dynamicallyImportJsFile(url: string): Promise<Record<string, unknown>> {
    return import(url);
  }
}
