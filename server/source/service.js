/**
 * @import { Guard } from "./guard.js";
 * @import { Handler } from "./handler.js";
 * @import { Interceptor } from "./interceptor.js";
 */

import { inferName, resolveSessionContext } from "./session.js";

/**
 * @typedef {Object} ServiceOptions
 * @property {string} [name]
 * @property {boolean} [singleton]
 */

/**
 * @typedef {Object} Service
 * @property {function(): void} [dispose]
 */

/**
 * @template {Array<any>} Args
 * @typedef {new (...args: Args) => Service} ServiceConstructor
 */

/**
 * @typedef {Object} ServiceMetadata
 * @property {string} key
 * @property {boolean} singleton
 */

/**
 * @template {Array<any>} Args
 * @param {ServiceOptions} [options]
 */
export function Service(options) {
  /**
   * @param {ServiceConstructor<Args>} target
   * @param {ClassDecoratorContext<ServiceConstructor<Args>>} context
   */
  return (target, context) => {
    let key = options?.name;
    if (key == null) {
      const name = target.name.replace(/service$/i, "");
      key = name[0].toLowerCase() + name.slice(1);
    }

    context.metadata.key = key;
    context.metadata.singleton = options?.singleton ?? false;
  };
}

/**
 * @typedef {Service | Guard<any> | Handler | Interceptor} InjectableTarget
 */

/**
 * @param {string} [name]
 */
export function Inject(name) {
  /**
   * @param {undefined} _
   * @param {ClassFieldDecoratorContext<InjectableTarget, Service>} context
   */
  return (_, context) => {
    const injectionKey = name ?? inferName(context);
    return () => {
      const { container } = resolveSessionContext();
      return container.resolve(injectionKey);
    };
  };
}

export class Container {
  /**
   * @type {Map<string, ServiceConstructor<[]>>}
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
   * @param {Array<ServiceConstructor<[]>>} services
   */
  constructor(services) {
    for (const serviceConstructor of services) {
      const { key } = this.#extractServiceMetadata(serviceConstructor);
      this.#services.set(key, serviceConstructor);
    }
  }

  /**
   * @param {string} key
   * @returns {Service | undefined}
   */
  resolve(key) {
    const serviceConstructor = this.#services.get(key);
    const { sessionId } = resolveSessionContext();

    if (serviceConstructor != null) {
      const { singleton } = this.#extractServiceMetadata(serviceConstructor);

      let service = singleton ? this.#singletons.get(key) : undefined;

      if (service == null) {
        service = new serviceConstructor();

        if (singleton) {
          this.#singletons.set(key, service);
        } else {
          let services = this.#sessionLivedServices.get(sessionId);
          if (services == null) {
            this.#sessionLivedServices.set(sessionId, (services = []));
          }
          services.push(service);
        }
      }

      return service;
    }
  }

  /**
   * @param {ServiceConstructor<[]>} serviceConstructor
   */
  #extractServiceMetadata(serviceConstructor) {
    return (
      /**
       * @type {ServiceMetadata}
       */
      (serviceConstructor[Symbol.metadata])
    );
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
      this.#sessionLivedServices.delete(id);
    }
  }

  /**
   * @param {(string & {}) | 'all'} what
   */
  dispose(what) {
    if (what === "all") {
      this.#sessionLivedServices.forEach((_, id) => {
        this.#disposeServicesForSession(id);
      });
      this.#singletons.forEach(this.#gracefullyDisposeService);
      this.#singletons.clear();
    } else {
      this.#disposeServicesForSession(what);
    }
  }
}
