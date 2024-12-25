import type { Document } from "domhandler";
import { type Options, parseDocument } from "htmlparser2";

import type { VirtualFile } from "./virtual-file.js";

const parserOptions: Options = {
  withEndIndices: true,
  withStartIndices: true,
  recognizeSelfClosing: true,
};

export function parseHtml(file: VirtualFile): Document {
  return parseDocument(file.content, parserOptions);
}
