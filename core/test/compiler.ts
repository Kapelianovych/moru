import { fileURLToPath } from "node:url";
import { resolve, dirname, sep } from "node:path";

import {
  parseHtml,
  compileHtml,
  generateHtml,
  type Options,
  type VirtualFile,
} from "../src/index.js";

const DEFAULT_OPTIONS: Options = {
  properties: {},
  diagnostics: { publish(message) {} },
  buildStore: new Map(),
  resolveUrl(currentFile, relativeUrl) {
    if (relativeUrl.startsWith(".")) {
      return resolve(dirname(currentFile.url), relativeUrl).replace(sep, "/");
    } else {
      try {
        return fileURLToPath(import.meta.resolve(relativeUrl)).replace(
          sep,
          "/",
        );
      } catch {
        return relativeUrl;
      }
    }
  },
  async readFileContent(url) {
    return "";
  },
  async dynamicallyImportJsFile(url) {
    return {};
  },
};

export interface CompileOptions extends Partial<Options> {
  fileUrl?: string;
}

export async function compile(
  text: string,
  options: CompileOptions = {},
): Promise<string> {
  const file: VirtualFile = {
    url: options.fileUrl ?? "/index.html",
    content: text,
  };
  delete options.fileUrl;

  const ast = parseHtml(file);
  await compileHtml(ast, file, { ...DEFAULT_OPTIONS, ...options });
  return generateHtml(ast);
}
