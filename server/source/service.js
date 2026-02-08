/**
 * @import { Handler } from "./handler.js";
 * @import { Interceptor } from "./interceptor.js";
 */

import { session } from "./session.js";

/**
 * @typedef {Object} ServiceOptions
 * @property {boolean} [singleton]
 */

/**
 * @typedef {Object} Service
 * @property {function(): void} [dispose]
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
    const name = target.name.replace(/service$/i, "");
    const key = name[0].toLowerCase() + name.slice(1);

    context.metadata.key = key;
    context.metadata.singleton = options?.singleton ?? false;
  };
}

/**
 * @param {undefined} _
 * @param {ClassFieldDecoratorContext<Service | Handler | Interceptor, Service>} context
 */
export function inject(_, context) {
  const fieldName = String(context.name);
  const injectionKey = context.private ? fieldName.slice(1) : fieldName;

  return () => {
    const store = session.getStore();

    if (store != null) {
      return store.container.resolve(injectionKey);
    }
  };
}

export class Container {
  /**
   * @type {Map<string, ServiceConstructor>}
   */
  #services = new Map();
  /**
   * @type {Map<string, Service>}
   */
  #singletons = new Map();
  /**
   * @type {Map<string, Array<Service>>}
   */
  #sessionLivedServices = new Map();

  /**
   * @param {Array<ServiceConstructor>} services
   */
  constructor(services) {
    for (const serviceConstructor of services) {
      this.#services.set(
        /**
         * @type {string}
         */
        (
          /**
           * @type {DecoratorMetadataObject}
           */
          (serviceConstructor[Symbol.metadata]).key
        ),
        serviceConstructor,
      );
    }
  }

  /**
   * @param {string} key
   * @returns {Service | undefined}
   */
  resolve(key) {
    const serviceConstructor = this.#services.get(key);
    const store = session.getStore();

    if (serviceConstructor != null) {
      const isSingleton =
        /**
         * @type {DecoratorMetadataObject}
         */
        (serviceConstructor[Symbol.metadata]).singleton;

      let service = isSingleton ? this.#singletons.get(key) : undefined;

      if (service == null && store != null) {
        service = new serviceConstructor();

        if (isSingleton) {
          this.#singletons.set(key, service);
        } else {
          let services = this.#sessionLivedServices.get(store.sessionId);
          if (services == null) {
            this.#sessionLivedServices.set(store.sessionId, (services = []));
          }
          services.push(service);
        }
      }

      return service;
    }
  }

  /**
   * @param {Service} service
   */
  async #gracefullyDisposeService(service) {
    try {
      // Wait for the Promise in case user decides to mark method as asynchronous.
      await service.dispose?.();
    } catch {
      // If disposal of the service fails, then we can do nothing about it.
      // But we definitely do not want to fail the entire server.
    }
  }

  /**
   * @param {string} id
   */
  #disposeServicesForSession(id) {
    const sessionServices = this.#sessionLivedServices.get(id);
    if (sessionServices != null) {
      sessionServices.forEach(this.#gracefullyDisposeService);
      sessionServices.length = 0;
    }
  }

  /**
   * @param {(string & {}) | 'all'} what
   */
  dispose(what) {
    if (what === "all") {
      this.#sessionLivedServices.keys().forEach((id) => {
        this.#disposeServicesForSession(id);
      });
      this.#singletons.forEach(this.#gracefullyDisposeService);
      this.#singletons.clear();
    } else {
      this.#disposeServicesForSession(what);
    }
  }
}
