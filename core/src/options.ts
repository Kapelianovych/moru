import type { Diagnostics } from "./diagnostics.js";

export interface Options {
  properties: Record<string, unknown>;
  diagnostics: Diagnostics;
  buildStore: Map<PropertyKey, unknown>;
  readFileContent(url: string): Promise<string>;
  dynamicallyImportJsFile<M extends Record<string, unknown>>(
    url: string,
  ): Promise<M>;
}
