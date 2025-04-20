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
 *       selector?: string;
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
 *       access: ClassFieldDecoratorContext['access'] | ClassMethodDecoratorContext['access'];
 *       eventName: string
 *     }
 *   >
 * } [EVENT_LISTENERES_CONTAINER]
 * @property {Set<ClassFieldDecoratorContext['access'] | ClassMethodDecoratorContext['access']>} [CONNECTED_CALLBACKS]
 * @property {Set<ClassFieldDecoratorContext['access'] | ClassMethodDecoratorContext['access']>} [DISCONNECTED_CALLBACKS]
 */

/**
 * @typedef {Object} ComponentOptions
 * @property {string} tag
 */

/**
 * @template {Object} A
 * @param {ComponentOptions} options
 * @returns {function({ new (): A }, ClassDecoratorContext): { new (): A }}
 */
export function Component(options) {
  return (Class, context) => {
    const FinalClass = class extends HTMLElement {
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

      connectedCallback() {
        this.#initialiseElements();
        this.#attachEventListeners();
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

            const element = selector
              ? multiple
                ? Array.from(this.querySelectorAll(selector))
                : this.querySelector(selector)
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
    };

    customElements.define(options.tag, FinalClass);

    return /** @type {any} */ (FinalClass);
  };
}

/**
 * @param {string} [selector]
 * @param {boolean} [multiple]
 * @returns {function(unknown, ClassFieldDecoratorContext): void}
 */
export function Element(selector, multiple) {
  return (_, context) => {
    context.metadata[ELEMENTS_CONTAINER] ??= {};
    /**
     * @type {NonNullable<ComponentMetadata['ELEMENTS_CONTAINER']>}
     */
    (context.metadata[ELEMENTS_CONTAINER])[context.name] = {
      selector,
      access: context.access,
      multiple,
    };
  };
}

/**
 * @param {string} eventName
 * @param {string} [target]
 * @returns {function(unknown, ClassFieldDecoratorContext | ClassMethodDecoratorContext): void}
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
 * @param {ClassFieldDecoratorContext | ClassMethodDecoratorContext} context
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
 * @param {ClassFieldDecoratorContext | ClassMethodDecoratorContext} context
 * @returns {void}
 */
export function Disconnected(_, context) {
  context.metadata[DISCONNECTED_CALLBACKS] ??= new Set();
  /**
   * @type {NonNullable<ComponentMetadata['DISCONNECTED_CALLBACKS']>}
   */
  (context.metadata[DISCONNECTED_CALLBACKS]).add(context.access);
}
