/**
 * @import { IndexHtmlTransform, Plugin } from "vite";
 * @import { Diagnostics, VirtualFile } from "@moru/core";
 *
 * @import  { Environment } from "./environment.js";
 */

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
  /**
   * @readonly
   */
  name = "@moru/compiler";

  enforce = /** @type {const} */ ("pre");

  /**
   * @type {Diagnostics}
   */
  diagnostics;

  /**
   * @type {Environment}
   */
  environment;

  /**
   * @type {IndexHtmlTransform | undefined}
   */
  transformIndexHtml;

  /**
   * @param {Environment} environment
   */
  constructor(environment) {
    this.environment = environment;
    this.diagnostics = new DiagnosticsReporter(environment);
    this.#initialiseHtmlTransform();
  }

  #initialiseHtmlTransform() {
    const self = this;

    this.transformIndexHtml = {
      order: "pre",
      async handler(html, context) {
        /**
         * @type {VirtualFile}
         */
        const virtualFile = {
          url: context.filename.split(sep).join("/"),
          content: html,
        };

        const tree = parseHtml(virtualFile);
        await compileHtml(tree, virtualFile, {
          exports: {},
          properties: {},
          buildStore: new Map(),
          diagnostics: self.diagnostics,
          resolveUrl: self.#resolveUrlAndMarkDependency.bind(
            self,
            // @ts-expect-error vite injects this method but does not expose its presense :(
            this.addWatchFile?.bind(this),
          ),
          readFileContent: self.#readFileContent,
          dynamicallyImportJsFile: self.#dynamicallyImportJsFile,
        });
        if (self.environment.pluginOptions.transform) {
          await self.environment.pluginOptions.transform(tree, {
            url: context.path
              .split(sep)
              .join("/")
              .replace(self.environment.pluginOptions.entries.suffix, ""),
            filePath: context.filename,
          });
        }
        return generateHtml(tree);
      },
    };
  }

  /**
   * @param {undefined | function(string): void} addWatchFile
   * @param {VirtualFile} currentFile
   * @param {string} relativeUrl
   * @returns {string}
   */
  #resolveUrlAndMarkDependency(addWatchFile, currentFile, relativeUrl) {
    const filePath = this.#resolveUrl(currentFile, relativeUrl);

    // Adding additional files to Vite's watcher is possible only in watch mode.
    if (addWatchFile) {
      const watchedRootDirectoryByVite = resolve(
        this.environment.viteConfiguration.root,
      );

      if (
        filePath.startsWith(watchedRootDirectoryByVite) &&
        (filePath.endsWith(".html") || filePath.endsWith(".svg"))
      ) {
        addWatchFile(filePath);
      }
    }

    return filePath;
  }

  /**
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
