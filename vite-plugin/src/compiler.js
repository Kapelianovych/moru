/**
 * @import { IndexHtmlTransform, Plugin } from "vite";
 * @import { Diagnostics, VirtualFile } from "@moru/core";
 */

/** @import  { Environment } from "./environment.js"; */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isAbsolute, normalize, sep, resolve, dirname } from "node:path";

import { compileHtml, generateHtml, parseHtml } from "@moru/core";

import { DiagnosticsReporter } from "./diagnostics-reporter.js";

const NON_RESOLVEABLE_URL_PREFIX = /^(?:https?:|#|\/|data:)/;

/**
 * @implements {Plugin}
 */
export class Compiler {
  /** @readonly */
  name = "@moru/compiler";
  enforce = /** @type {const} */ ("pre");
  /** @type {Diagnostics} */
  diagnostics;

  /** @type {IndexHtmlTransform} */
  transformIndexHtml = {
    order: "pre",
    handler: async (html, context) => {
      /** @type {VirtualFile} */
      const virtualFile = {
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

  /**
   * @param {Environment} environment
   */
  constructor(environment) {
    this.diagnostics = new DiagnosticsReporter(environment);
  }

  /**
   *
   * @param {VirtualFile} currentFile
   * @param {string} relativeUrl
   * @returns {string}
   */
  #resolveUrl(currentFile, relativeUrl) {
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

  /**
   * @param {string} url
   * @returns {Promise<string>}
   */
  #readFileContent(url) {
    const normalisedPath = normalize(url);

    return readFile(
      isAbsolute(normalisedPath)
        ? normalisedPath
        : // Leverages Node's resolution algorithm.
          fileURLToPath(import.meta.resolve(normalisedPath)),
      "utf8",
    );
  }

  /**
   * @param {string} url
   * @returns {Promise<Record<string, unknown>>}
   */
  #dynamicallyImportJsFile(url) {
    return import(url);
  }
}
