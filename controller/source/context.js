/**
 * @import { CustomElement } from './controller.js'
 */

import { hookIntoProperty } from "./hook-into-property.js";

/**
 * @private
 * @typedef {Object} ContextualisedCustomElement
 * @property {boolean} [$areConsumersInitialised]
 * @property {Map<string | symbol, Set<function(unknown): void>>} [$registeredConsumersPerContext]
 */

/**
 * @template KeyType
 * @template ValueType
 * @typedef {KeyType & { __context__: ValueType }} Context
 */

/**
 * @typedef {Context<unknown, unknown>} UnknownContext
 */

/**
 * @template {UnknownContext} T
 * @typedef {T extends Context<infer _, infer V> ? V : never} ContextType
 */

/**
 * @template ValueType
 * @template [KeyType=unknown]
 * @param {KeyType} key
 * @returns {Context<KeyType, ValueType>}
 */
export function createContext(key) {
  return (
    /**
     * @type {Context<KeyType, ValueType>}
     */
    (key)
  );
}

/**
 * @template Value
 * @callback ContextCallback
 * @param {Value} value
 * @param {VoidFunction} [unsubscribe]
 * @returns {void}
 */

const CONTEXT_REQUEST_EVENT_NAME = "context-request";

/**
 * @template {UnknownContext} T
 */
export class ContextRequestEvent extends Event {
  /**
   * @type {T}
   */
  context;
  /**
   * @type {boolean | undefined}
   */
  subscribe;
  /**
   * @type {ContextCallback<ContextType<T>>}
   */
  callback;

  /**
   * @param {T} context
   * @param {ContextCallback<ContextType<T>>} callback
   * @param {boolean} [subscribe]
   */
  constructor(context, callback, subscribe) {
    super(CONTEXT_REQUEST_EVENT_NAME, { bubbles: true, composed: true });

    this.context = context;
    this.callback = callback;
    this.subscribe = subscribe;
  }
}

/**
 * @param {unknown} _
 * @param {|
 *   ClassFieldDecoratorContext<
 *     CustomElement & ContextualisedCustomElement
 *   >
 *   | ClassGetterDecoratorContext<
 *       CustomElement & ContextualisedCustomElement
 *     >
 * } context
 */
export function provide(_, context) {
  const providers =
    /**
     * @type {Set<string | symbol>}
     */
    (context.metadata.providers ??= new Set());

  providers.add(context.name);

  context.addInitializer(function () {
    if (!this.$registeredConsumersPerContext) {
      initialiseContextListener(this, providers);
      this.$registeredConsumersPerContext = new Map();
    }

    this.$registeredConsumersPerContext.set(context.name, new Set());

    hookIntoProperty(
      this,
      context.name,
      (value) => value,
      (value, set, currentValue) => {
        if (!Object.is(value, currentValue)) {
          set(value);
          this.$registeredConsumersPerContext
            ?.get(context.name)
            ?.forEach((consume) => {
              consume(value);
            });
        }
      },
    );
  });
}

/**
 * @param {unknown} _
 * @param {ClassFieldDecoratorContext<CustomElement> | ClassSetterDecoratorContext<CustomElement>} context
 */
export function consume(_, context) {
  context.addInitializer(function () {
    initialiseConsumer(this, context.name);
  });
}

/**
 * @param {CustomElement & ContextualisedCustomElement} classInstance
 * @param {Set<string | symbol>} providers
 */
function initialiseContextListener(classInstance, providers) {
  classInstance.addEventListener(CONTEXT_REQUEST_EVENT_NAME, (event) => {
    const contextRequestEvent =
      /**
       * @type {ContextRequestEvent<Context<string | symbol, unknown>>}
       */
      (event);

    if (providers.has(contextRequestEvent.context)) {
      event.stopImmediatePropagation();

      const dispose = () => {
        classInstance.$registeredConsumersPerContext
          ?.get(contextRequestEvent.context)
          ?.delete(provide);
      };

      /**
       * @param {unknown} value
       */
      const provide = (value) => {
        contextRequestEvent.callback(
          value,
          contextRequestEvent.subscribe ? dispose : undefined,
        );

        if (!contextRequestEvent.subscribe) {
          dispose();
        }
      };

      classInstance.$registeredConsumersPerContext
        ?.get(contextRequestEvent.context)
        ?.add(provide);

      provide(
        classInstance[
          /**
           * @type {keyof CustomElement}
           */
          (contextRequestEvent.context)
        ],
      );
    }
  });
}

/**
 * @param {CustomElement} classInstance
 * @param {string | symbol} key
 */
function initialiseConsumer(classInstance, key) {
  classInstance.$initialisers?.add(() => {
    classInstance.dispatchEvent(
      new ContextRequestEvent(
        createContext(key),
        (value, unsubscribe) => {
          // @ts-expect-error custom element can have any property,
          // so this is valid even though TS does not know that
          classInstance[key] = value;

          if (unsubscribe) {
            classInstance.$disposals?.add(unsubscribe);
          }
        },
        true,
      ),
    );
  });

  classInstance.$disposals?.add(() => {
    // Initialise consumer again in case node will be reattached to DOM.
    initialiseConsumer(classInstance, key);
  });
}
