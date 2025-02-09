/**
 * @import { BuildStore } from "../src/index.js";
 */

import { CONTEXTS } from "./lib/symbols.js";
import { getFromNamespace } from "./lib/namespace.js";

/**
 * @template A
 * @callback ContextGetter
 * @param {PropertyKey} key
 * @returns {A}
 */

/**
 * @template A
 * @param {BuildStore} buildStore
 * @returns {ContextGetter<A>}
 */
export function useContextGetter(buildStore) {
  return (key) => {
    const contexts = /** @type {Map<PropertyKey, A> | undefined} */ (
      getFromNamespace(buildStore, CONTEXTS)
    );
    /** @type {A | undefined} */
    let value;

    if (contexts) {
      value = getFromNamespace(contexts, key);
    }

    if (value === undefined) {
      throw new Error(
        `"getContext" is called outside of the <context-provider> with key: "${String(key)}".`,
      );
    } else {
      return value;
    }
  };
}
