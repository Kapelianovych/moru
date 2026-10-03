/**
 * @import { CustomElement } from "./controller.js";
 */

import { InternalController } from "./internal-controller.js";

/**
 * @typedef {Object} Injectable
 * @property {function(): void | Promise<void>} [dispose]
 */

/**
 * @typedef {new () => Injectable & { constructor: Function }} InjectableConstructor
 */

/**
 * @typedef {Object} InjectableMetadata
 * @property {string | symbol} key
 * @property {boolean} singleton
 * @property {Array<InjectRequestOptions>} dependencies
 */

const INJECT_REQUEST_EVENT_NAME = "inject-request";

/**
 * @callback ProvideCallback
 * @param {CustomElement | Injectable} target
 * @param {Injectable} injectable
 * @returns {void}
 */

export class InjectRequestEvent extends Event {
  /**
   * @type {InjectableConstructor}
   */
  token;
  /**
   * @type {ProvideCallback}
   */
  provide;
  /**
   * @param {InjectableConstructor} token
   * @param {ProvideCallback} provide
   */
  constructor(token, provide) {
    super(INJECT_REQUEST_EVENT_NAME, { bubbles: true, composed: true });
    this.token = token;
    this.provide = provide;
  }
}

/**
 * @typedef {Pick<InjectRequestEvent, 'token' | 'provide'>} InjectRequestOptions
 */

export class Container {
  /**
   * @param {CustomElement} element
   * @param {Array<[InjectableConstructor, InjectableConstructor]> | undefined} factories
   */
  static tryToDefineOnIfMissing(element, factories) {
    if (factories == null) {
      return null;
    } else {
      const internalController = InternalController.resolve(element);
      internalController.container ??= new this(element, factories);
      return internalController.container;
    }
  }
  /**
   * @type {CustomElement}
   */
  #element;
  /**
   * @type {Map<string | symbol, Injectable>}
   */
  #cache = new Map();
  /**
   * @type {Map<string | symbol, InjectableConstructor>}
   */
  #factories = new Map();
  /**
   * @private
   * @param {CustomElement} element
   * @param {Array<[InjectableConstructor, InjectableConstructor]>} factories
   */
  constructor(element, factories) {
    this.#element = element;
    element.addEventListener(INJECT_REQUEST_EVENT_NAME, this);
    this.#setupCacheDisposal();
    this.#assignFactories(factories);
  }
  /**
   * @param {InjectRequestEvent} event
   */
  handleEvent(event) {
    event.stopImmediatePropagation();
    this.#fulfillInjectRequest(this.#element, event);
  }
  /**
   * @param {Array<[InjectableConstructor, InjectableConstructor]>} factories
   */
  #assignFactories(factories) {
    factories.forEach(([original, replacement]) => {
      const { key: originalKey } = this.#extractInjectableMetadata(original);
      const { key: replacementKey } =
        this.#extractInjectableMetadata(replacement);
      if (originalKey === replacementKey) {
        this.#factories.set(originalKey, replacement);
      }
    });
  }
  /**
   * @param {InjectableConstructor} injectableConstructor
   */
  #extractInjectableMetadata(injectableConstructor) {
    return (
      /**
       * @type {InjectableMetadata}
       */
      (injectableConstructor[Symbol.metadata])
    );
  }
  /**
   * @param {CustomElement | Injectable} target
   * @param {InjectRequestOptions} request
   */
  #fulfillInjectRequest(target, request) {
    const { key } = this.#extractInjectableMetadata(request.token);
    if (this.#cache.has(key)) {
      request.provide(
        target,
        /**
         * @type {Injectable}
         */
        (this.#cache.get(key)),
      );
    } else {
      const injectableFactory = this.#factories.get(key) ?? request.token;
      const injectable = new injectableFactory();
      const injectableMetadata =
        this.#extractInjectableMetadata(injectableFactory);

      for (const dependency of injectableMetadata.dependencies) {
        this.#fulfillInjectRequest(injectable, dependency);
      }

      if (injectableMetadata.singleton) {
        this.#cache.set(key, injectable);
      }

      request.provide(target, injectable);
    }
  }
  #setupCacheDisposal() {
    const internalController = InternalController.resolve(this.#element);
    internalController.disposals.add(() => {
      for (const [, injectable] of this.#cache) {
        injectable.dispose?.();
      }
      this.#cache.clear();
      internalController.initialisers.add(() => {
        this.#setupCacheDisposal();
      });
    });
  }
}

/**
 * @param {InjectableConstructor} constructor
 */
export function Inject(constructor) {
  /**
   * @param {unknown} _
   * @param {ClassFieldDecoratorContext} context
   */
  return (_, context) => {
    const dependencies =
      /**
       * @type {Array<InjectRequestOptions>}
       */
      (context.metadata.dependencies ??= []);
    /**
     * @type {InjectRequestOptions}
     */
    const request = {
      token: constructor,
      provide(target, injectable) {
        context.access.set(target, injectable);
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
  };
}

/**
 * @param {CustomElement} classInstance
 * @param {InjectRequestOptions} request
 */
function initialiseInjectRequest(classInstance, request) {
  const internalController = InternalController.resolve(classInstance);
  internalController.initialisers.add(() => {
    classInstance.dispatchEvent(
      new InjectRequestEvent(request.token, (_, injectable) => {
        request.provide(classInstance, injectable);
        const metadata =
          /**
           * @type {InjectableMetadata}
           */
          (injectable.constructor[Symbol.metadata]);
        if (!metadata.singleton) {
          internalController.disposals.add(() => {
            injectable.dispose?.();
          });
        }
      }),
    );
    internalController.disposals.add(() => {
      initialiseInjectRequest(classInstance, request);
    });
  });
}

/**
 * @typedef {Object} InjectableOptions
 * @property {string | symbol} [key]
 * @property {boolean} [singleton]
 */

/**
 * @param {InjectableOptions} [options]
 */
export function Injectable(options) {
  /**
   * @param {InjectableConstructor} target
   * @param {ClassDecoratorContext<InjectableConstructor>} context
   */
  return (target, context) => {
    context.metadata.key = options?.key ?? target.name;
    context.metadata.singleton = options?.singleton ?? true;
    context.metadata.dependencies ??= [];
  };
}
