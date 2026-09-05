/**
 * @template {new (...args: Array<any>) => object} O
 * @overload
 * @param {O} constructor
 * @param {ConstructorParameters<O>} args
 * @returns {Omit<O, new (...args: ConstructorParameters<O>) => InstanceType<O>> & (new () => InstanceType<O>)}
 *
 * @param {new (...args: Array<any>) => object} constructor
 * @param {Array<any>} args
 * @returns {new () => object}
 */
export function factory(constructor, args) {
  return class {
    static get [Symbol.metadata]() {
      return constructor[Symbol.metadata];
    }

    constructor() {
      return new constructor(...args);
    }
  };
}
