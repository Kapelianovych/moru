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
  async readFileContent(url) {
    return "";
  },
  async dynamicallyImportJsFile(url) {
    return {};
  },
};

export async function compile(
  text: string,
  options: Partial<Options> = {},
): Promise<string> {
  const file: VirtualFile = {
    url: "#",
    content: text,
  };
  const ast = parseHtml(file);
  await compileHtml(ast, file, { ...DEFAULT_OPTIONS, ...options });
  return generateHtml(ast);
}
