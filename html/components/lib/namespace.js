/**
 * @template A
 * @param {Map<PropertyKey, A> | Record<PropertyKey, A>} target
 * @param {PropertyKey} name
 * @param {function(): A} [initialise]
 * @return {A | undefined}
 */
export function getFromNamespace(target, name, initialise) {
  const isTargetMap = isMap(target);
  let namespace = isTargetMap ? target.get(name) : target[name];

  if (initialise && namespace === undefined) {
    namespace = initialise();
    isTargetMap ? target.set(name, namespace) : (target[name] = namespace);
  }

  return namespace;
}

/**
 * @template A
 * @param {unknown} value
 * @returns {value is Map<PropertyKey, A>}
 */
function isMap(value) {
  return value instanceof Map;
}
