/** @import { Document } from "domhandler"; */

import render from "dom-serializer";

/**
 * @param {Document} document
 * @returns {string}
 */
export function generateHtml(document) {
  return render(document);
}
