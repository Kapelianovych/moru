/**
 * @import { CustomElement, CustomElementClass } from "./controller.js";
 */

import { listen } from "./events.js";

// @ts-expect-error This symbol is not standardized yet,
// so it might be missing.
Symbol.metadata ??= Symbol("symbol.metadata");

const INJECT_EVENT_NAME = "inject-request-service";

/**
 * @typedef {Object} InjectRequest
 * @property {string} name
 * @property {function(Service): void} provide
 */

/**
 * @param {unknown} _
 * @param {ClassFieldDecoratorContext} context
 */
export function inject(_, context) {
  const dependencies =
    /**
     * @type {Array<InjectRequest>}
     */
    (context.metadata.dependencies ??= []);
  const name = String(context.name);
  /**
   * @type {InjectRequest}
   */
  const request = {
    name: context.private ? name.slice(1) : name,
    provide(service) {
      context.access.set(
        /**
         * @type {Service | CustomElement}
         */
        (
          /**
           * @type {unknown}
           */
          (this)
        ),
        service,
      );
    },
  };

  dependencies.push(request);

  context.addInitializer(function () {
    if (this instanceof Element) {
      initialiseInjectRequest(
        /**
         * @type {CustomElement}
         */
        (this),
        request,
      );
    }
  });
}

/**
 * @param {CustomElement} classInstance
 * @param {InjectRequest} request
 */
function initialiseInjectRequest(classInstance, request) {
  classInstance.$initialisers?.add(() => {
    classInstance.dispatchEvent(
      new CustomEvent(INJECT_EVENT_NAME, {
        bubbles: true,
        composed: true,
        detail: {
          name: request.name,
          /**
           * @param {Service} service
           */
          provide(service) {
            request.provide.call(classInstance, service);

            classInstance.$disposals?.add(() => {
              if (!service.constructor[Symbol.metadata].singleton) {
                service.dispose?.();
              }
            });
          },
        },
      }),
    );
  });

  classInstance.$disposals?.add(() => {
    initialiseInjectRequest(classInstance, request);
  });
}

/**
 * @typedef {Object} ServiceMetadata
 * @property {boolean} singleton
 * @property {Array<InjectRequest>} dependencies
 */

/**
 * @typedef {{
 *   name: string,
 *   [Symbol.metadata]: ServiceMetadata,
 * }} ServiceConstructorProperties
 */

/**
 * @typedef {ServiceConstructorProperties & { new (): Service }} ServiceConstructor
 */

/**
 * @typedef {Object} Service
 * @property {ServiceConstructor} constructor
 * @property {function(): void | Promise<void>} [initialise]
 * @property {function(): void | Promise<void>} [dispose]
 */

/**
 * @param {ServiceConstructor} serviceClass
 * @returns {string}
 */
function serviceKey(serviceClass) {
  const serviceOwnName = serviceClass.name.replace(/service$/i, "");

  return `${serviceOwnName[0].toLowerCase()}${serviceOwnName.slice(1)}`;
}

/**
 * @typedef {Object} ServiceOptions
 * @property {boolean} [singleton]
 */

/**
 * @param {ServiceOptions} [options]
 */
export function service(options) {
  const singleton = options?.singleton ?? true;

  /**
   * @param {unknown} constructor
   * @param {ClassDecoratorContext} context
   */
  return (constructor, context) => {
    context.metadata.singleton = singleton;
    context.metadata.dependencies ??= [];
  };
}

/**
 * @param {...unknown} serviceClasses
 */
export function container(...serviceClasses) {
  const serviceFactories = new Map(
    /**
     * @type {Array<ServiceConstructor>}
     */
    (serviceClasses).map((serviceClass) => {
      return [serviceKey(serviceClass), serviceClass];
    }),
  );

  /**
   * @param {CustomElementClass} constructor
   * @param {ClassDecoratorContext<CustomElementClass>} context
   */
  return (constructor, context) => {
    return class extends constructor {
      static name = constructor.name;

      /**
       * @type {Map<string, Service>}
       */
      #cache = new Map();

      @listen [INJECT_EVENT_NAME] = this;

      constructor() {
        super();

        this.#setupCacheDisposal();
      }

      /**
       * @param {CustomEvent<InjectRequest>} event
       */
      async handleEvent(event) {
        event.stopImmediatePropagation();

        await this.#fulfillInjectRequest(event.detail);
      }

      /**
       * @param {InjectRequest} request
       */
      async #fulfillInjectRequest(request) {
        if (this.#cache.has(request.name)) {
          request.provide(
            // @ts-expect-error The service presence is checked with the has method above.
            this.#cache.get(request.name),
          );
        } else {
          const serviceFactory = serviceFactories.get(request.name);

          if (serviceFactory != null) {
            const service = new serviceFactory();

            const serviceMetadata = serviceFactory[Symbol.metadata];

            for (const dependency of serviceMetadata.dependencies) {
              await this.#fulfillInjectRequest({
                name: dependency.name,
                provide: dependency.provide.bind(service),
              });
            }

            if (service.initialise != null) {
              await service.initialise();
            }

            if (serviceMetadata.singleton) {
              this.#cache.set(request.name, service);
            }

            request.provide(service);
          }
        }
      }

      #setupCacheDisposal() {
        this.$disposals?.add(() => {
          for (const [, service] of this.#cache) {
            service.dispose?.();
          }
          this.#cache.clear();

          this.$initialisers?.add(() => {
            this.#setupCacheDisposal();
          });
        });
      }
    };
  };
}
