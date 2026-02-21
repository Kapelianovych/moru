/**
 * @import { IndexHtmlTransform, Plugin } from "vite";
 * @import { Diagnostics, VirtualFile } from "@moru/core";
 *
 * @import  { Environment } from "./environment.js";
 */

import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { isAbsolute, normalize, sep, resolve, dirname, join } from "node:path";

import { compileHtml, generateHtml, parseHtml } from "@moru/core";

import { DiagnosticsReporter } from "./diagnostics-reporter.js";

const NON_RESOLVEABLE_URL_PREFIX = /^(?:tel:|mailto:|https?:|#|\/|data:)/;

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
  #diagnostics;

  /**
   * @type {Environment}
   */
  #environment;

  /**
   * @type {IndexHtmlTransform | undefined}
   */
  transformIndexHtml;

  /**
   * @type {Map<string, string>}
   */
  #writtenFilesCache = new Map();

  /**
   * @param {string} id
   * @returns {Promise<string | null>}
   */
  load = async (id) => {
    const temporaryFilePath = this.#writtenFilesCache.get(id);

    if (temporaryFilePath) {
      return readFile(temporaryFilePath, "utf8");
    } else {
      return null;
    }
  };

  closeBundle = async () => {
    await Promise.all(
      this.#writtenFilesCache.values().map((path) => {
        return rm(path);
      }),
    );
  };

  /**
   * @param {Environment} environment
   */
  constructor(environment) {
    this.#environment = environment;
    this.#diagnostics = new DiagnosticsReporter(environment);
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
          diagnostics: self.#diagnostics,
          resolveUrl: self.#resolveUrlAndMarkDependency.bind(
            self,
            // @ts-expect-error vite injects this method but does not expose its presense :(
            this.addWatchFile?.bind(this),
          ),
          readFileContent: self.#readFileContent,
          writeFileContent: self.#writeFileContent.bind(self),
          dynamicallyImportJsFile: self.#dynamicallyImportJsFile,
        });

        if (self.#environment.pluginOptions.transform) {
          await self.#environment.pluginOptions.transform(tree, {
            url: context.path
              .split(sep)
              .join("/")
              .replace(self.#environment.pluginOptions.entries.suffix, ""),
            filePath: context.filename,
          });
        }
        // await self.#removeWrittenFiles();
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
        this.#environment.viteConfiguration.root,
      );

      if (filePath.startsWith(watchedRootDirectoryByVite)) {
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
   * @param {string} content
   * @returns {Promise<void>}
   */
  async #writeFileContent(url, content) {
    const temporaryDirectoryPath = await mkdtemp(join(tmpdir(), "moru_core-"));

    const temporaryFilePath = join(
      temporaryDirectoryPath,
      `m-${crypto.randomUUID()}-${url.replaceAll("/", "_")}`,
    );

    await writeFile(temporaryFilePath, content, "utf-8");

    this.#writtenFilesCache.set(url, temporaryFilePath);
  }

  /**
   * @param {string} url
   * @returns {Promise<Record<string, unknown>>}
   */
  #dynamicallyImportJsFile(url) {
    return import(url);
  }
}
