/**
 * @import { Document } from "domhandler";
 * @import { Options } from "htmlparser2";
 *
 * @import { VirtualFile } from "./virtual-file.js";
 */

import { parseDocument } from "htmlparser2";

/** @type {Options} */
const parserOptions = {
  withEndIndices: true,
  withStartIndices: true,
  recognizeSelfClosing: true,
};

/**
 * @param {VirtualFile} file
 * @returns {Document}
 */
export function parseHtml(file) {
  return parseDocument(file.content, parserOptions);
}
