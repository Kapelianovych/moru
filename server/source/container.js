import { resolveSessionContext } from "./session.js";

/**
 * @typedef {Object} ContainerStoredInstanceMetadata
 * @property {string} key
 * @property {boolean} [singleton]
 */

/**
 * @typedef {Object} ContainerStoredInstance
 * @property {function(): void | Promise<void>} [dispose]
 */

/**
 * @template {ContainerStoredInstance} A
 * @typedef {new () => A} ContainerStoredInstanceConstructor
 */

/**
 * @typedef {[
 *   ContainerStoredInstanceConstructor<ContainerStoredInstance>,
 *   ContainerStoredInstanceConstructor<ContainerStoredInstance>
 * ]} ContainerStoredInstanceFactory
 */

export class Container {
  /**
   * @type {Map<string, ContainerStoredInstanceConstructor<ContainerStoredInstance>>}
   */
  #factories = new Map();
  /**
   * @type {Map<string, ContainerStoredInstance>}
   */
  #globalInstances = new Map();
  /**
   * @type {Map<string, Array<ContainerStoredInstance>>}
   */
  #sessionInstances = new Map();
  /**
   * @param {Array<ContainerStoredInstanceFactory>} factories
   */
  constructor(factories) {
    this.#assignFactories(factories);
  }
  /**
   * @template {ContainerStoredInstanceConstructor<ContainerStoredInstance>} A
   * @param {A} constructor
   * @returns {InstanceType<A>}
   */
  resolve(constructor) {
    const { sessionId } = resolveSessionContext();
    const { key, singleton = true } =
      this.extractStoredInstanceMetadata(constructor);

    let instance = singleton ? this.#globalInstances.get(key) : undefined;
    if (instance == null) {
      if (this.#factories.has(key)) {
        const replacementConstructor =
          /**
           * @type {A}
           */
          (this.#factories.get(key));
        constructor = replacementConstructor;
      }
      instance = new constructor();

      if (singleton) {
        this.#globalInstances.set(key, instance);
      } else {
        let instances = this.#sessionInstances.get(sessionId);
        if (instances == null) {
          this.#sessionInstances.set(sessionId, (instances = []));
        }
        instances.push(instance);
      }
    }

    return (
      /**
       * @type {InstanceType<A>}
       */
      (instance)
    );
  }
  /**
   * @param {(string & {}) | 'all'} what
   */
  dispose(what) {
    if (what === "all") {
      this.#sessionInstances.forEach((_, id) => {
        this.#disposeSessionInstances(id);
      });
      this.#globalInstances.forEach(this.#gracefullyDisposeInstance);
      this.#globalInstances.clear();
    } else {
      this.#disposeSessionInstances(what);
    }
  }
  /**
   * @param {ContainerStoredInstanceConstructor<ContainerStoredInstance>} containerStoredInstanceConstructor
   */
  extractStoredInstanceMetadata(containerStoredInstanceConstructor) {
    return (
      /**
       * @type {ContainerStoredInstanceMetadata}
       */
      (containerStoredInstanceConstructor[Symbol.metadata])
    );
  }
  /**
   * @param {Array<ContainerStoredInstanceFactory>} factories
   */
  #assignFactories(factories) {
    factories.forEach(([original, replacement]) => {
      const { key: originalKey, singleton: originalSingleton } =
        this.extractStoredInstanceMetadata(original);
      const { key: replacementKey, singleton: replacementSingleton } =
        this.extractStoredInstanceMetadata(replacement);
      if (
        originalKey === replacementKey &&
        originalSingleton === replacementSingleton
      ) {
        this.#factories.set(originalKey, replacement);
      } else {
        throw new Error(
          `Constructors must have same metadata to be replaceable.`,
        );
      }
    });
  }
  /**
   * @param {ContainerStoredInstance} instance
   */
  async #gracefullyDisposeInstance(instance) {
    try {
      // Wait for the Promise in case user decides to mark method as asynchronous.
      await instance.dispose?.();
    } catch {
      // If disposal of the service fails, then we can do nothing about it.
      // But we definitely do not want to fail the entire server.
    }
  }
  /**
   * @param {string} id
   */
  #disposeSessionInstances(id) {
    const sessionServices = this.#sessionInstances.get(id);
    if (sessionServices != null) {
      sessionServices.forEach(this.#gracefullyDisposeInstance);
      this.#sessionInstances.delete(id);
    }
  }
}
