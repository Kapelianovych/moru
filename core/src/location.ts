import type { Options } from "./options.js";
import type { VirtualFile } from "./virtual-file.js";

export function getFileNameFrom(
  url: string,
  extension: string,
): string | undefined {
  return new RegExp(`\\/?([^/]+)\.${extension}$`).exec(url)?.[1];
}

/** A URL resolver function with a predefined relative point. */
export interface UrlCreator {
  (relativeUrl: string): string;
  /** URL of the file relative to which any URL is resolved
   * by this {@link UrlCreator}. */
  current: string;
}

export function createUrlCreator(
  file: VirtualFile,
  options: Options,
): UrlCreator {
  const urlCreator = (relativeUrl: string): string =>
    options.resolveUrl(file, relativeUrl);
  urlCreator.current = file.url;
  return urlCreator;
}
