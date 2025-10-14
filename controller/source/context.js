/**
 * @import { CustomElement } from './controller.js'
 */

import { hookIntoProperty } from "./hook-into-property.js";

/**
 * @template KeyType
 * @template ValueType
 * @typedef {KeyType & {__context__: ValueType}} Context
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
    super("context-request", { bubbles: true, composed: true });

    this.context = context;
    this.callback = callback;
    this.subscribe = subscribe;
  }
}

/**
 * @param {unknown} _
 * @param {ClassFieldDecoratorContext<CustomElement> | ClassGetterDecoratorContext<CustomElement>} context
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
      initialiseContextListener(this, context.metadata);

      this.$registeredConsumersPerContext = new Map();
    }

    this.$registeredConsumersPerContext.set(context.name, new Set());

    hookIntoProperty(
      this,
      context.name,
      (value) => value,
      (value, set) => {
        set(value);
        this.$registeredConsumersPerContext
          ?.get(context.name)
          ?.forEach((consume) => {
            consume(value);
          });
      },
    );
  });
}

/**
 * @param {unknown} _
 * @param {ClassFieldDecoratorContext<CustomElement> | ClassSetterDecoratorContext<CustomElement>} context
 */
export function consume(_, context) {
  const consumers =
    /**
     * @type {Set<string | symbol>}
     */
    (context.metadata.consumers ??= new Set());

  consumers.add(context.name);
}

/**
 * @param {CustomElement} classInstance
 * @param {DecoratorMetadataObject} metadata
 */
function initialiseContextListener(classInstance, metadata) {
  const providers =
    /**
     * @type {Set<string | symbol>}
     */
    (metadata.providers);

  classInstance.addEventListener("context-request", (event) => {
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
 * @param {DecoratorMetadataObject} metadata
 */
export function initialiseConsumers(classInstance, metadata) {
  const consumers =
    /**
     * @type {Set<string | symbol> | undefined}
     */
    (metadata.consumers);

  if (consumers) {
    const disposals = (classInstance.$disposals ??= new Set());

    consumers.forEach((key) => {
      classInstance.dispatchEvent(
        new ContextRequestEvent(
          createContext(key),
          (value, unsubscribe) => {
            if (
              typeof (
                /**
                 * @type {PromiseLike<unknown> | undefined | null}
                 */
                (value)?.then
              ) === "function"
            ) {
              /**
               * @type {PromiseLike<unknown>}
               */
              (value).then((value) => {
                // @ts-expect-error custom element can have any property,
                // so this is valid even though TS does not know that
                classInstance[key] = value;
              });
            } else {
              // @ts-expect-error custom element can have any property,
              // so this is valid even though TS does not know that
              classInstance[key] = value;
            }

            if (unsubscribe) {
              disposals.add(unsubscribe);
            }
          },
          true,
        ),
      );
    });
  }
}
