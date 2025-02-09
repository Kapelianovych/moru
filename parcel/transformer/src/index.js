/** @import { VirtualFile } from "@moru/core"; */

import { fileURLToPath } from "node:url";
import { sep, resolve, dirname, normalize } from "node:path";

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
      url: normaliseToUrl(asset.filePath),
      content: await asset.getCode(),
    };
    /** @type {Array<string>} */
    const absoluteDependenciesPaths = [];
    const ast = parseHtml(file);

    await compileHtml(ast, file, {
      exports: {},
      properties: {},
      buildStore: new Map(),
      diagnostics,
      dynamicallyImportJsFile,
      resolveUrl(currentFile, relativeUrl) {
        if (
          NON_RESOLVEABLE_URL_PREFIX.test(relativeUrl) ||
          relativeUrl === "build"
        ) {
          return relativeUrl;
        } else {
          const absoluteFilePath = resolveLocalUrl(currentFile, relativeUrl);

          absoluteDependenciesPaths.push(absoluteFilePath);

          return absoluteFilePath;
        }
      },
      async readFileContent(url) {
        const normalisedPath = normalize(url);

        return options.inputFS.readFile(
          await resolve(options.projectRoot, normalisedPath),
          "utf8",
        );
      },
    });

    asset.setCode(generateHtml(ast));

    absoluteDependenciesPaths.forEach((dependencyPath) => {
      asset.invalidateOnFileChange(dependencyPath);
    });

    return [asset];
  },
});

/**
 * @param {VirtualFile} currentFile
 * @param {string} relativeUrl
 * @returns {string}
 */
function resolveLocalUrl(currentFile, relativeUrl) {
  if (relativeUrl.startsWith(".")) {
    return normaliseToUrl(resolve(dirname(currentFile.url), relativeUrl));
  } else {
    return normaliseToUrl(fileURLToPath(import.meta.resolve(relativeUrl)));
  }
}

/**
 * @param {string} url
 * @returns {Promise<Record<string, unknown>>}
 */
function dynamicallyImportJsFile(url) {
  return import(url);
}

/**
 * @param {string} path
 * @returns {string}
 */
function normaliseToUrl(path) {
  return path.replace(sep, "/");
}
