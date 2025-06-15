/**
 * @import { Ref } from "./ref.js";
 * @import { Context } from "./client-context.js";
 */

import { isRef } from "./ref.js";
import { useContext } from "./client-context.js";

const PUBLIC_METHODS = Symbol("public-methods");
const CONTEXT_CONSUMERS = Symbol("context-consumers");
const CONTEXT_PROVIDERS = Symbol("context-providers");
const ELEMENTS_CONTAINER = Symbol("elements-container");
const EVENT_LISTENERES_CONTAINER = Symbol("event-listeners-container");
const CONNECTED_CALLBACKS = Symbol("connected-callbacks");
const DISCONNECTED_CALLBACKS = Symbol("disconnected-callbacks");

// @ts-expect-error - decorator metadata is still a proposal on Stage 3.
Symbol.metadata ??= Symbol.for("Symbol.metadata");

/**
 * @typedef {Object} ComponentMetadata
 * @property {|
 *   Record<
 *     PropertyKey,
 *     {
 *       selector?: string | Ref;
 *       multiple?: boolean;
 *       access: ClassFieldDecoratorContext['access'];
 *     }
 *   >
 * } [ELEMENTS_CONTAINER]
 * @property {|
 *   Record<
 *     PropertyKey,
 *     {
 *       target?: string;
 *       access: ClassMethodDecoratorContext['access'];
 *       eventName: string
 *     }
 *   >
 * } [EVENT_LISTENERES_CONTAINER]
 * @property {Set<ClassMethodDecoratorContext['access']>} [CONNECTED_CALLBACKS]
 * @property {Set<ClassMethodDecoratorContext['access']>} [DISCONNECTED_CALLBACKS]
 * @property {|
 *   Array<
 *     {
 *       contextToInject: Context<any>;
 *       access: ClassFieldDecoratorContext['access'];
 *     }
 *   >
 * } [CONTEXT_CONSUMERS]
 * @property {|
 *   Array<
 *     {
 *       member(): any;
 *       contextToProvide: Context<any>;
 *     }
 *   >
 * } [CONTEXT_PROVIDERS]
 * @property {|
 *  Array<
 *    {
 *      name: string | symbol;
 *      method(...args: Array<unknown>): unknown;
 *    }
 *  >
 * } [PUBLIC_METHODS]
 */

/**
 * @typedef {Object} ComponentOptions
 * @property {string} tag
 */

/**
 * @type {Array<VoidFunction>}
 */
const scheduledConnectedCallbacks = [];

function callConnectedCallbacksInOrder() {
  scheduledConnectedCallbacks.forEach((callback) => {
    callback();
  });
  scheduledConnectedCallbacks.length = 0;
  document.removeEventListener(
    "readystatechange",
    callConnectedCallbacksInOrder,
  );
}

document.addEventListener("readystatechange", callConnectedCallbacksInOrder, {
  once: true,
  passive: true,
});

/**
 * @template {Object} A
 * @param {ComponentOptions} options
 * @returns {function({ new (): A }, ClassDecoratorContext): { new (): A }}
 */
export function Component(options) {
  return (Class, context) => {
    class FinalClass extends HTMLElement {
      static tag = options.tag;

      /**
       * @type {Set<function(): void | VoidFunction>}
       */
      #connectCallbacks = new Set();
      /**
       * @type {Set<VoidFunction>}
       */
      #disconnectCallbacks = new Set();
      #componentDefinitionInstance = new Class();

      constructor() {
        super();

        this.#initialisePublicMethods();
      }

      connectedCallback() {
        if (document.readyState === "loading") {
          return scheduledConnectedCallbacks.push(
            this.connectedCallback.bind(this),
          );
        }

        this.#injectContexts();
        this.#initialiseElements();
        this.#attachEventListeners();
        this.#initialiseContextProviders();
        this.#initialiseLifecycleCallbacks();
        this.#connectCallbacks.forEach((fn) => {
          const dispose = fn.call(this.#componentDefinitionInstance);

          if (dispose) {
            this.#disconnectCallbacks.add(dispose);
          }
        });
      }

      disconnectedCallback() {
        this.#disconnectCallbacks.forEach((fn) => {
          fn.call(this.#componentDefinitionInstance);
        });
      }

      #initialiseElements() {
        const elements =
          /**
           * @type {ComponentMetadata['ELEMENTS_CONTAINER']}
           */
          (context.metadata[ELEMENTS_CONTAINER]);

        if (elements) {
          for (const field in elements) {
            const { selector, multiple, access } = elements[field];

            const cssSelector = isRef(selector) ? selector.selector : selector;

            const element = cssSelector
              ? multiple
                ? Array.from(this.querySelectorAll(cssSelector))
                : this.querySelector(cssSelector)
              : this;

            access.set(this.#componentDefinitionInstance, element);
          }
        }
      }

      #attachEventListeners() {
        const eventListeners =
          /**
           * @type {ComponentMetadata['EVENT_LISTENERES_CONTAINER']}
           */
          (context.metadata[EVENT_LISTENERES_CONTAINER]);

        if (eventListeners) {
          const elements =
            /**
             * @type {ComponentMetadata['ELEMENTS_CONTAINER']}
             */
            (context.metadata[ELEMENTS_CONTAINER]);

          for (const methodName in eventListeners) {
            const { target, access, eventName } = eventListeners[methodName];

            /**
             * @type {|
             *   Document
             *   | Window
             *   | globalThis
             *   | Element
             *   | Array<Document | Window | globalThis | Element>
             * }
             */
            let resolvedElementsReference;

            if (target) {
              switch (target) {
                case "document":
                  resolvedElementsReference = document;
                  break;
                case "window":
                  resolvedElementsReference = window;
                  break;
                case "globalThis":
                  resolvedElementsReference = globalThis;
                  break;
                default:
                  resolvedElementsReference = elements?.[target].access.get(
                    this.#componentDefinitionInstance,
                  );
              }
            } else {
              resolvedElementsReference = this;
            }

            const boundCallback = access
              .get(this.#componentDefinitionInstance)
              .bind(this.#componentDefinitionInstance);

            const resolvedElements = Array.isArray(resolvedElementsReference)
              ? resolvedElementsReference
              : [resolvedElementsReference];

            resolvedElements.forEach((targetElement) => {
              targetElement.addEventListener(eventName, boundCallback);

              this.#disconnectCallbacks.add(() => {
                targetElement.removeEventListener(eventName, boundCallback);
              });
            });
          }
        }
      }

      #initialiseLifecycleCallbacks() {
        const connectedCallbacks =
          /**
           * @type {ComponentMetadata['CONNECTED_CALLBACKS']}
           */
          (context.metadata[CONNECTED_CALLBACKS]);

        const disconnectedCallbacks = /**
         * @type {ComponentMetadata['DISCONNECTED_CALLBACKS']}
         */ (context.metadata[DISCONNECTED_CALLBACKS]);

        connectedCallbacks?.forEach((access) => {
          this.#connectCallbacks.add(
            access.get(this.#componentDefinitionInstance),
          );
        });
        disconnectedCallbacks?.forEach((access) => {
          this.#disconnectCallbacks.add(
            access.get(this.#componentDefinitionInstance),
          );
        });
      }

      #injectContexts() {
        const contexts =
          /**
           * @type {ComponentMetadata['CONTEXT_CONSUMERS']}
           */
          (context.metadata[CONTEXT_CONSUMERS]);

        contexts?.forEach(({ access, contextToInject }) => {
          const contextValue = useContext(this, contextToInject);

          access.set(this.#componentDefinitionInstance, contextValue);
        });
      }

      #initialiseContextProviders() {
        const contexts =
          /**
           * @type {ComponentMetadata['CONTEXT_PROVIDERS']}
           */
          (context.metadata[CONTEXT_PROVIDERS]);

        contexts?.forEach(({ member, contextToProvide }) => {
          const contextValue = member.call(this.#componentDefinitionInstance);

          contextToProvide.assignTo(this, contextValue);
        });
      }

      #initialisePublicMethods() {
        const publicMethods =
          /**
           * @type {ComponentMetadata['PUBLIC_METHODS']}
           */
          (context.metadata[PUBLIC_METHODS]);

        publicMethods?.forEach(({ name, method }) => {
          // @ts-expect-error
          this[name] = method.bind(this.#componentDefinitionInstance);
        });
      }
    }

    customElements.define(FinalClass.tag, FinalClass);

    return /** @type {any} */ (FinalClass);
  };
}

/**
 * @typedef {Object} ElementOptions
 * @property {boolean} [multiple]
 */

/**
 * @param {string | Ref} [selector]
 * @param {ElementOptions} [options]
 * @returns {function(unknown, ClassFieldDecoratorContext): void}
 */
export function Element(selector, options) {
  return (_, context) => {
    context.metadata[ELEMENTS_CONTAINER] ??= {};
    /**
     * @type {NonNullable<ComponentMetadata['ELEMENTS_CONTAINER']>}
     */
    (context.metadata[ELEMENTS_CONTAINER])[context.name] = {
      selector,
      access: context.access,
      multiple: options?.multiple,
    };
  };
}

/**
 * @param {string} eventName
 * @param {string} [target]
 * @returns {function(unknown, ClassMethodDecoratorContext): void}
 */
export function On(eventName, target) {
  return (_, context) => {
    context.metadata[EVENT_LISTENERES_CONTAINER] ??= {};
    /**
     * @type {NonNullable<ComponentMetadata['EVENT_LISTENERES_CONTAINER']>}
     */
    (context.metadata[EVENT_LISTENERES_CONTAINER])[context.name] = {
      target,
      access: context.access,
      eventName,
    };
  };
}

/**
 * @param {unknown} _
 * @param {ClassMethodDecoratorContext} context
 * @returns {void}
 */
export function Connected(_, context) {
  context.metadata[CONNECTED_CALLBACKS] ??= new Set();
  /**
   * @type {NonNullable<ComponentMetadata['CONNECTED_CALLBACKS']>}
   */
  (context.metadata[CONNECTED_CALLBACKS]).add(context.access);
}

/**
 * @param {unknown} _
 * @param {ClassMethodDecoratorContext} context
 * @returns {void}
 */
export function Disconnected(_, context) {
  context.metadata[DISCONNECTED_CALLBACKS] ??= new Set();
  /**
   * @type {NonNullable<ComponentMetadata['DISCONNECTED_CALLBACKS']>}
   */
  (context.metadata[DISCONNECTED_CALLBACKS]).add(context.access);
}

/**
 * @template A
 * @param {Context<A>} contextObject
 * @returns {|
 *  function(
 *    any,
 *    ClassFieldDecoratorContext
 *    | ClassMethodDecoratorContext
 *  ): void
 * }
 */
export function Context(contextObject) {
  return (member, context) => {
    const isConsumer = context.kind === "field";

    if (isConsumer) {
      context.metadata[CONTEXT_CONSUMERS] ??= [];
      /**
       * @type {NonNullable<ComponentMetadata['CONTEXT_CONSUMERS']>}
       */
      (context.metadata[CONTEXT_CONSUMERS]).push({
        access: context.access,
        contextToInject: contextObject,
      });
    } else {
      context.metadata[CONTEXT_PROVIDERS] ??= [];
      /**
       * @type {NonNullable<ComponentMetadata['CONTEXT_PROVIDERS']>}
       */
      (context.metadata[CONTEXT_PROVIDERS]).push({
        member,
        contextToProvide: contextObject,
      });
    }
  };
}

/**
 * @param {function(...Array<unknown>): unknown} method
 * @param {ClassMethodDecoratorContext} context
 * @returns {void}
 */
export function Method(method, context) {
  context.metadata[PUBLIC_METHODS] ??= [];
  /**
   * @type {NonNullable<ComponentMetadata['PUBLIC_METHODS']>}
   */
  (context.metadata[PUBLIC_METHODS]).push({
    name: context.name,
    method,
  });
}
