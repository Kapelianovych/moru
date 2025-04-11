/**
 * @import { BuildStore } from "@moru/core";
 * @import { TransformOptions} from "lightningcss";
 */

import { transform, composeVisitors } from "lightningcss";

import { createUnitVisitor } from "./visitors/unit-visitor.js";

const Encoder = new TextEncoder();
const Decoder = new TextDecoder();

const STYLE_BLOCK_SYMBOLS_RE = /@|{/;
const PLACEHOLDER_PROPERTY_RE = /@value/g;

/**
 * @typedef {Object} DefaultCustomAtRules
 * @property {{ prelude: '*' }} value
 */

/**
 * @callback PropertyCompiler
 * @param {string} name
 * @param {string} text
 * @param {Pick<TransformOptions<DefaultCustomAtRules>, 'visitor'>} [options]
 * @returns {string}
 */

/**
 * @param {BuildStore} buildStore
 * @returns {PropertyCompiler}
 */
export function usePropertyCompiler(buildStore) {
  const unitVisitor = createUnitVisitor(buildStore);

  return (name, text, options = {}) => {
    if (!text) {
      return "";
    }

    if (
      !STYLE_BLOCK_SYMBOLS_RE.test(text) &&
      !PLACEHOLDER_PROPERTY_RE.test(text)
    ) {
      text = "@value " + text;
    }

    const cssCode = `& { ${text} }`;

    const { code } = transform({
      filename: `${name}.css`,
      code: Encoder.encode(cssCode),
      minify: false,
      sourceMap: false,
      customAtRules: {
        value: {
          prelude: "*",
        },
      },
      visitor: composeVisitors([unitVisitor, options.visitor ?? {}]),
    });

    return Decoder.decode(code);
  };
}
