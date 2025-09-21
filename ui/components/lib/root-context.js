/**
 * @import { BuildStore } from "@moru/core";
 */

import { useContextGetter } from "@moru/core/context-provider";

export const ROOT_CONTEXT = Symbol("root context");

/**
 * @typedef {Object} RootContext
 * @property {string} headPortalName
 * @property {string} fallbackFontFamily
 * @property {string | number} defaultFontSize
 * @property {string} [defaultFontFamily]
 * @property {number} [defaultRealTextHeightRatio]
 * @property {number} [defaultTextSideOffsetCorrection]
 * @property {number} fallbackRealTextHeightRatio
 * @property {number | string} fallbackTextSideOffsetCorrection
 */

/**
 * @param {Partial<RootContext>} initial
 * @returns {RootContext}
 */
export function createRootContext(initial) {
  return {
    headPortalName: initial.headPortalName ?? "head",
    fallbackFontFamily:
      'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    defaultFontSize: initial.defaultFontSize ?? "0.8un",
    defaultFontFamily: initial.defaultFontFamily,
    defaultRealTextHeightRatio: initial.defaultRealTextHeightRatio,
    defaultTextSideOffsetCorrection: initial.defaultTextSideOffsetCorrection,
    fallbackRealTextHeightRatio: 0.74,
    fallbackTextSideOffsetCorrection: "0.0625un",
  };
}

/**
 * @param {BuildStore} buildStore
 * @returns {RootContext}
 */
export function useRootContext(buildStore) {
  const getContext = useContextGetter(buildStore);

  return getContext(ROOT_CONTEXT);
}
