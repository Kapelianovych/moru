import { type Element, isText } from "domhandler";

import type { Options } from "./options.js";
import type { HtmlNodesCollection } from "./collect-html-nodes.js";
import type { VirtualFile } from "./virtual-file.js";
import { resolveUrl } from "./location.js";
import { getLocationOfHtmlNode } from "./html-nodes.js";
import {
  createInvalidChildOfExecutableScriptMessage,
  createInvalidChildOfStyleElementMessage,
} from "./diagnostics.js";

const SRCSET_SEGMENT = /(\S*[^,\s])(?:\s+([\d.]+)(x|w))?/g;
const ONE_OR_MORE_WHITESPACES = /\s+/;
const HTTP_EQUIV_REFRESH_CONTENT =
  /^\s*(\d+)(?:\s*;(?:\s*url\s*=)?\s*(?:["']\s*(.*?)\s*['"]|(.*?)))?\s*$/i;
const ESMODULE_DECLARATION_OR_EXPRESSION_WITH_STATIC_SOURCE =
  /import.+?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const CSS_URL_DEFINITION = /url\s*\(\s*['"]?([^)\s]+)['"]?\s*\)/g;

const COMMON_REBASEABLE_ATTRIBUTES = ["itemtype"];
const REBASEABLE_ELEMENT_MAP: Record<
  string,
  Record<string, (node: Element) => boolean>
> = {
  a: {
    href() {
      return true;
    },
    ping() {
      return true;
    },
  },
  area: {
    href() {
      return true;
    },
    ping() {
      return true;
    },
  },
  audio: {
    src() {
      return true;
    },
  },
  base: {
    href() {
      return true;
    },
  },
  blockquote: {
    cite() {
      return true;
    },
  },
  button: {
    formaction() {
      return true;
    },
  },
  del: {
    cite() {
      return true;
    },
  },
  embed: {
    src() {
      return true;
    },
  },
  form: {
    action() {
      return true;
    },
  },
  html: {
    manifest() {
      return true;
    },
  },
  iframe: {
    src() {
      return true;
    },
  },
  img: {
    src() {
      return true;
    },
    srcset() {
      return true;
    },
  },
  input: {
    formaction() {
      return true;
    },
    src() {
      return true;
    },
  },
  ins: {
    cite() {
      return true;
    },
  },
  link: {
    href() {
      return true;
    },
  },
  meta: {
    content(node) {
      return node.attribs["http-equiv"] === "refresh";
    },
  },
  object: {
    data() {
      return true;
    },
  },
  q: {
    cite() {
      return true;
    },
  },
  script: {
    src() {
      return true;
    },
  },
  source: {
    src() {
      return true;
    },
    srcset() {
      return true;
    },
  },
  track: {
    src() {
      return true;
    },
  },
  video: {
    poster() {
      return true;
    },
    src() {
      return true;
    },
  },
};

export function isHtmlElementRebaseable(node: Element): boolean {
  return (
    node.tagName in REBASEABLE_ELEMENT_MAP ||
    COMMON_REBASEABLE_ATTRIBUTES.some((name) => name in node.attribs)
  );
}

export function rebaseUrls(
  collection: HtmlNodesCollection,
  file: VirtualFile,
  options: Options,
): void {
  for (const element of collection.rebaseableElements) {
    const rebaseableAttributesSettings =
      REBASEABLE_ELEMENT_MAP[element.tagName];
    const attributesToRebase = COMMON_REBASEABLE_ATTRIBUTES.concat(
      Object.keys(rebaseableAttributesSettings),
    );

    for (const attributeName of attributesToRebase) {
      if (
        rebaseableAttributesSettings[attributeName]?.(element) ??
        /* itemtype */ true
      ) {
        const currentAttributeValue = element.attribs[attributeName]?.trim();

        if (currentAttributeValue) {
          switch (attributeName) {
            case "ping": {
              element.attribs[attributeName] = rebasePingAttribute(
                currentAttributeValue,
                file,
              );
              break;
            }
            case "content": {
              element.attribs[attributeName] = rebaseContentAttribute(
                currentAttributeValue,
                file,
              );
              break;
            }
            case "srcset": {
              element.attribs[attributeName] = rebaseSrcsetAttribute(
                currentAttributeValue,
                file,
              );
              break;
            }
            default:
              element.attribs[attributeName] = resolveUrl(
                file,
                currentAttributeValue,
              );
          }
        } else {
          // Just do nothing.
        }
      }
    }
  }

  for (const clientScriptElement of collection.clientScripts) {
    const child = clientScriptElement.firstChild;

    if (child) {
      if (!isText(child)) {
        options.diagnostics.publish(
          createInvalidChildOfExecutableScriptMessage({
            sourceFile: file,
            location: getLocationOfHtmlNode(clientScriptElement),
          }),
        );
      } else {
        const matches = child.data.matchAll(
          ESMODULE_DECLARATION_OR_EXPRESSION_WITH_STATIC_SOURCE,
        );

        for (const [fullMatch, declarationUrl, expressionUrl] of matches) {
          const newImport = declarationUrl
            ? fullMatch.replace(
                declarationUrl,
                resolveUrl(file, declarationUrl),
              )
            : fullMatch.replace(expressionUrl, resolveUrl(file, expressionUrl));

          child.data = child.data.replace(fullMatch, newImport);
        }
      }
    } else {
      // It's okay for a client script to not have a child.
    }
  }

  for (const styleElement of collection.styles) {
    const child = styleElement.firstChild;

    if (child) {
      if (isText(child)) {
        const matches = child.data.matchAll(CSS_URL_DEFINITION);

        for (const [fullMatch, url] of matches) {
          child.data = child.data.replace(
            fullMatch,
            fullMatch.replace(url, resolveUrl(file, url)),
          );
        }
      } else {
        options.diagnostics.publish(
          createInvalidChildOfStyleElementMessage({
            sourceFile: file,
            location: getLocationOfHtmlNode(styleElement),
          }),
        );
      }
    } else {
      // It's okay for a style to not have a child.
    }
  }

  collection.styles.length = 0;
  collection.rebaseableElements.length = 0;
}

function rebasePingAttribute(value: string, file: VirtualFile): string {
  return value
    .split(ONE_OR_MORE_WHITESPACES)
    .map((url) => resolveUrl(file, url))
    .join(" ");
}

function rebaseContentAttribute(value: string, file: VirtualFile): string {
  const values = HTTP_EQUIV_REFRESH_CONTENT.exec(value);

  if (values) {
    const [_, timeout, url = values[3]] = values;

    return `${timeout}; url=${resolveUrl(file, url)}`;
  } else {
    return value;
  }
}

function rebaseSrcsetAttribute(value: string, file: VirtualFile): string {
  return Array.from(value.matchAll(SRCSET_SEGMENT))
    .map(([_, url, quantity, units]) => {
      return resolveUrl(file, url) + (units ? quantity + units : "");
    })
    .join(", ");
}
