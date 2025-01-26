/** @import { VirtualFile } from "@moru/core"; */

import { fileURLToPath } from "node:url";
import { sep, resolve, dirname, normalize, isAbsolute } from "node:path";

import { Transformer } from "@parcel/plugin";
import { parseHtml, compileHtml, generateHtml } from "@moru/core";

import { createDiagnostics } from "./diagnostics.js";

const NON_RESOLVEABLE_URL_PREFIX = /^(?:https?:|#|\/|data:)/;

export default new Transformer({
  loadConfig({ logger }) {
    return createDiagnostics(logger);
  },
  async transform({ options, asset, config: diagnostics, resolve }) {
    /** @type {VirtualFile} */
    const file = {
      url: asset.filePath.split(sep).join("/"),
      content: await asset.getCode(),
    };

    const ast = parseHtml(file);
    await compileHtml(ast, file, {
      exports: {},
      properties: {},
      buildStore: new Map(),
      diagnostics,
      resolveUrl,
      dynamicallyImportJsFile,
      async readFileContent(url) {
        const normalisedPath = normalize(url);

        return options.inputFS.readFile(
          isAbsolute(normalisedPath)
            ? normalisedPath
            : await resolve(options.projectRoot, normalisedPath),
          "utf8",
        );
      },
    });
    asset.setCode(generateHtml(ast));

    return [asset];
  },
});

/**
 * @param {VirtualFile} currentFile
 * @param {string} relativeUrl
 * @returns {string}
 */
function resolveUrl(currentFile, relativeUrl) {
  if (NON_RESOLVEABLE_URL_PREFIX.test(relativeUrl) || relativeUrl === "build") {
    return relativeUrl;
  } else if (relativeUrl.startsWith(".")) {
    return resolve(dirname(currentFile.url), relativeUrl).replace(sep, "/");
  } else {
    return fileURLToPath(import.meta.resolve(relativeUrl)).replace(sep, "/");
  }
}

/**
 * @param {string} url
 * @returns {Promise<Record<string, unknown>>}
 */
function dynamicallyImportJsFile(url) {
  return import(url);
}
