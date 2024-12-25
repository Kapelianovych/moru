import type { VirtualFile } from "./virtual-file.js";

const NON_RESOLVEABLE_URL_PREFIX = /^(?:https?:|#|\/|data:)/;
const PACKAGE_URL_FIRST_CHARACTER = /^[^./]/;

export function getFileNameFrom(
  url: string,
  extension: string,
): string | undefined {
  return new RegExp(`\\/?([^/]+)\.${extension}$`).exec(url)?.[1];
}

export function resolveUrl(relativeTo: VirtualFile, url: string): string {
  if (NON_RESOLVEABLE_URL_PREFIX.test(url)) {
    return url;
  } else if (PACKAGE_URL_FIRST_CHARACTER.test(url)) {
    const urlFragments: Array<string> = [];

    for (const urlFragment of url.split("/")) {
      switch (urlFragment) {
        case ".":
          break;
        case "..":
          urlFragments.length = urlFragments.length - 1;
          break;
        default:
          urlFragments.push(urlFragment);
      }
    }

    return urlFragments.join("/");
  } else {
    let stepsUp: number = 0;
    const realUrlFragments: Array<string> = [];

    for (const urlFragment of url.split("/")) {
      if (urlFragment === "..") {
        if (realUrlFragments.length) {
          realUrlFragments.length = realUrlFragments.length - 1;
        } else {
          // We will have to add it to a negative value later, so we count in negative numbers.
          stepsUp--;
        }
      } else if (urlFragment !== ".") {
        realUrlFragments.push(urlFragment);
      }
    }

    return relativeTo.url
      .split("/")
      .slice(
        0,
        // If relativeTo is a directory (ends with /), then the last item will be an empty
        // string, otherwise - file's name. We should discard both of them in any case.
        // Also we remove any additional folders.
        stepsUp - 1,
      )
      .concat(realUrlFragments)
      .join("/");
  }
}

/** A URL resolver function with a predefined relative point. */
export interface UrlCreator {
  (relativeUrl: string): string;
  /** URL of the file relative to which any URL is resolved
   * by this {@link UrlCreator}. */
  current: string;
}

export function createUrlCreator(file: VirtualFile): UrlCreator {
  const urlCreator = (relativeUrl: string): string =>
    resolveUrl(file, relativeUrl);
  urlCreator.current = file.url;
  return urlCreator;
}
