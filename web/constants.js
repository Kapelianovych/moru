export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
export const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

export const SelfClosedElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
  "img",
  "link",
  "input",
]);

/**
 * Signals that the current runtime is browser.
 */
export const isClient = $CLIENT;
/**
 * Signals that the current runtime is server.
 */
export const isServer = !$CLIENT;
