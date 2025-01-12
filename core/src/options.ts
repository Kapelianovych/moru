import type { Diagnostics } from "./diagnostics.js";
import type { VirtualFile } from "./virtual-file.js";

export type BuildStore = Map<PropertyKey, unknown>;

export interface Options {
  properties: Record<string, unknown>;
  buildStore: BuildStore;
  diagnostics: Diagnostics;

  resolveUrl(currentFile: VirtualFile, relativeUrl: string): string;
  readFileContent(url: string): Promise<string>;
  dynamicallyImportJsFile(url: string): Promise<Record<string, unknown>>;
}
