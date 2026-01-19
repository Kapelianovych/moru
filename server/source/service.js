/**
 * @import { Handler } from "./handler.js";
 * @import { Interceptor } from "./interceptor.js";
 */

import { session } from "./session.js";

/**
 * @typedef {Object} ServiceOptions
 * @property {string} [key]
 * @property {boolean} [singleton]
 */

/**
 * @typedef {Object} Service
 */

/**
 * @template {Array<any>} [Args=Array<any>]
 * @typedef {new (...args: Args) => Service} ServiceConstructor
 */

/**
 * @param {ServiceOptions} [options]
 */
export function service(options) {
  /**
   * @param {ServiceConstructor} target
   * @param {ClassDecoratorContext<ServiceConstructor>} context
   */
  return (target, context) => {
    let key = options?.key;

    if (key == null) {
      const name = target.name.replace(/service$/i, "");
      key = name[0].toLowerCase() + name.slice(1);
    }

    context.metadata.key = key;
    context.metadata.singleton = options?.singleton ?? false;
  };
}

/**
 * @param {string} [key]
 */
export function inject(key) {
  /**
   * @param {undefined} target
   * @param {ClassFieldDecoratorContext<Service | Handler | Interceptor, Service>} context
   */
  return (target, context) => {
    let injectionKey = key;

    if (injectionKey == null) {
      const fieldName = String(context.name);
      injectionKey = context.private ? fieldName.slice(1) : fieldName;
    }

    return () => {
      const store = session.getStore();

      if (store != null) {
        return store.container.resolve(injectionKey);
      }
    };
  };
}

export class Container {
  /**
   * @type {Map<string, ServiceConstructor>}
   */
  #services;
  /**
   * @type {Map<string, Service>}
   */
  #singletons = new Map();

  /**
   * @param {Array<ServiceConstructor>} services
   */
  constructor(services) {
    this.#services = new Map(
      services.map((constructor) => {
        return [
          /**
           * @type {string}
           */
          (
            /**
             * @type {NonNullable<DecoratorMetadataObject>}
             */
            (constructor[Symbol.metadata]).key
          ),
          constructor,
        ];
      }),
    );
  }

  /**
   * @param {string} key
   * @returns {Service | undefined}
   */
  resolve(key) {
    const serviceConstructor = this.#services.get(key);

    if (serviceConstructor != null) {
      const isSingleton =
        /**
         * @type {NonNullable<DecoratorMetadataObject>}
         */
        (serviceConstructor[Symbol.metadata]).singleton;

      let service = isSingleton ? this.#singletons.get(key) : null;

      if (service == null) {
        service = new serviceConstructor();

        if (isSingleton) {
          this.#singletons.set(key, service);
        }
      }

      return service;
    }
  }
}
