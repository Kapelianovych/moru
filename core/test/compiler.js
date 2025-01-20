/**
 * @import { Options } from '../src/options.js';
 * @import { VirtualFile } from '../src/virtual-file.js';
 */

import { parseHtml, compileHtml, generateHtml } from "../src/index.js";

/** @type {Options} */
const DEFAULT_OPTIONS = {
  exports: {},
  properties: {},
  diagnostics: { publish() {} },
  buildStore: new Map(),
  resolveUrl() {
    return "";
  },
  async readFileContent() {
    return "";
  },
  async dynamicallyImportJsFile() {
    return {};
  },
};

/**
 * @package
 * @typedef {Partial<Options> & { fileUrl?: string; }} CompileOptions
 */

/**
 *
 * @param {string} text
 * @param {CompileOptions} options
 * @returns {Promise<string>}
 */
export async function compile(text, options = {}) {
  /** @type {VirtualFile} */
  const file = {
    url: options.fileUrl ?? "/index.html",
    content: text,
  };
  delete options.fileUrl;

  const ast = parseHtml(file);
  await compileHtml(ast, file, { ...DEFAULT_OPTIONS, ...options });
  return generateHtml(ast);
}
