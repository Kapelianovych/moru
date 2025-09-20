const FILL_KEYWORD_RE = /\bfill|full\b/g;

/**
 * @param {string} css
 * @returns {string}
 */
export function replaceFillKeyword(css) {
  return css.replaceAll(FILL_KEYWORD_RE, "100%");
}
