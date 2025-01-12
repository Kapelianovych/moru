import type { Diagnostics } from "./diagnostics.js";

export type BuildStore = Map<PropertyKey, unknown>;

export interface Options {
  properties: Record<string, unknown>;
  diagnostics: Diagnostics;
  buildStore: BuildStore;
  readFileContent(url: string): Promise<string>;
  dynamicallyImportJsFile(url: string): Promise<Record<string, unknown>>;
}
