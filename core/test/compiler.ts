import {
  parseHtml,
  compileHtml,
  generateHtml,
  type Options,
  type VirtualFile,
} from "../src/index.js";

const DEFAULT_OPTIONS: Options = {
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
