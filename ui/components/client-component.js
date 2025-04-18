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
 *     { selector?: string; access: ClassFieldDecoratorContext['access'] }
 *   >
 * } [ELEMENTS_CONTAINER]
 * @property {|
 *   Record<
 *     PropertyKey,
 *     { target?: string; access: ClassMethodDecoratorContext['access']; eventName: string }
 *   >
 * } [EVENT_LISTENERES_CONTAINER]
 * @property {Set<ClassMethodDecoratorContext['access']>} [CONNECTED_CALLBACKS]
 * @property {Set<ClassMethodDecoratorContext['access']>} [DISCONNECTED_CALLBACKS]
 */

/**
 * @typedef {Object} ComponentOptions
 * @property {string} tag
 */

/**
 * @param {ComponentOptions} options
 * @returns {function({ new (): object }, ClassDecoratorContext): { new (): object }}
 */
export function Component(options) {
  return (Class, context) => {
    const FinalClass = class extends HTMLElement {
      static tag = options.tag;

      /**
       * @type {Set<VoidFunction>}
       */
      #connectCallbacks = new Set();
      /**
       * @type {Set<VoidFunction>}
       */
      #disconnectCallbacks = new Set();
      #componentDefinitionInstance = new Class();

      connectedCallback() {
        this.#initialiseElements();
        this.#attachEventListeners();
        this.#initialiseLifecycleCallbacks();
        this.#connectCallbacks.forEach((fn) => {
          fn.call(this.#componentDefinitionInstance);
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
            const { selector, access } = elements[field];

            const element = selector ? this.querySelector(selector) : this;

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

            let targetElement;

            if (target) {
              switch (target) {
                case "document":
                  targetElement = document;
                  break;
                case "window":
                  targetElement = window;
                  break;
                case "globalThis":
                  targetElement = globalThis;
                  break;
                default:
                  targetElement = elements?.[target].access.get(
                    this.#componentDefinitionInstance,
                  );
              }
            } else {
              targetElement = this;
            }

            const boundCallback = access
              .get(this.#componentDefinitionInstance)
              .bind(this.#componentDefinitionInstance);

            targetElement.addEventListener(eventName, boundCallback);

            this.#disconnectCallbacks.add(() => {
              targetElement.removeEventListener(eventName, boundCallback);
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
    };

    customElements.define(options.tag, FinalClass);

    return FinalClass;
  };
}

/**
 * @param {string} selector
 * @returns {function(unknown, ClassFieldDecoratorContext): void}
 */
export function Element(selector) {
  return (_, context) => {
    context.metadata[ELEMENTS_CONTAINER] ??= {};
    /**
     * @type {NonNullable<ComponentMetadata['ELEMENTS_CONTAINER']>}
     */
    (context.metadata[ELEMENTS_CONTAINER])[context.name] = {
      selector,
      access: context.access,
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
