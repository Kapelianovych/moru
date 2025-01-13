import type { Diagnostics } from "./diagnostics.js";
import type { VirtualFile } from "./virtual-file.js";

export type BuildStore = Map<PropertyKey, unknown>;

export interface Options {
  /** Data for the top-level HTML component. */
  properties: Record<string, unknown>;
  /** Store object for a single compilation unit.
   * It must not be shared between multiple units, though
   * it can be prepopulated with some values which are shared. */
  buildStore: BuildStore;
  diagnostics: Diagnostics;

  /** Resolves URLs when the current location is the same as URL of
   * the {@link currentFile}. When {@link relativeUrl} is `build`,
   * it **must not** resolve it, but return as is. */
  resolveUrl(currentFile: VirtualFile, relativeUrl: string): string;
  readFileContent(url: string): Promise<string>;
  dynamicallyImportJsFile(url: string): Promise<Record<string, unknown>>;
}
