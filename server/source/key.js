/**
 * @param {new (...args: Array<any>) => object} constructor
 * @param {RegExp} patternToGetRidOf
 * @returns {string}
 */
export function inferKeyFromClass(constructor, patternToGetRidOf) {
  const name = constructor.name.replace(patternToGetRidOf, "");
  if (name.length === 0) {
    return name;
  } else {
    return name[0].toLowerCase() + name.slice(1);
  }
}

/**
 * @param {ClassFieldDecoratorContext} context
 * @returns {string}
 */
export function inferKeyFromProperty(context) {
  const name = String(context.name);
  return context.private ? name.slice(1) : name;
}
