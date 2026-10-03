/**
 * @import { CustomElement } from './controller.js'
 */

import { InternalController } from "./internal-controller.js";

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
 * @template A
 * @param {string | symbol} [key]
 */
export function Provide(key) {
  /**
   * @param {ClassAccessorDecoratorTarget<CustomElement, A>} target
   * @param {ClassAccessorDecoratorContext<CustomElement, A>} context
   * @returns {ClassAccessorDecoratorResult<CustomElement, A>}
   */
  return (target, context) => {
    const provideKey = key ?? context.name;
    const providers =
      /**
       * @type {Map<string | symbol, ClassAccessorDecoratorTarget<CustomElement, A>['get']>}
       */
      (context.metadata.providers ??= new Map());

    providers.set(provideKey, target.get);

    context.addInitializer(function () {
      const internalController = InternalController.resolve(this);
      if (internalController.registeredConsumersPerContext == null) {
        initialiseContextListener(this, providers);
        internalController.registeredConsumersPerContext = new Map();
      }
      internalController.registeredConsumersPerContext.set(
        provideKey,
        new Set(),
      );
    });

    return {
      set(value) {
        const currentValue = target.get.call(this);

        if (!Object.is(value, currentValue)) {
          target.set.call(this, value);
          const internalController = InternalController.resolve(this);
          internalController.registeredConsumersPerContext
            ?.get(provideKey)
            ?.forEach((consume) => {
              consume(value);
            });
        }
      },
    };
  };
}

/**
 * @param {string | symbol} [key]
 */
export function Consume(key) {
  /**
   * @param {unknown} _
   * @param {|
   *  ClassFieldDecoratorContext<CustomElement>
   *  | ClassSetterDecoratorContext<CustomElement>
   *  | ClassAccessorDecoratorContext<CustomElement>
   * } context
   */
  return (_, context) => {
    context.addInitializer(function () {
      initialiseConsumer(this, context, key);
    });
  };
}

/**
 * @param {CustomElement} classInstance
 * @param {Map<string | symbol, ClassAccessorDecoratorTarget<CustomElement, unknown>['get']>} providers
 */
function initialiseContextListener(classInstance, providers) {
  classInstance.addEventListener(CONTEXT_REQUEST_EVENT_NAME, (event) => {
    const contextRequestEvent =
      /**
       * @type {ContextRequestEvent<Context<string | symbol, unknown>>}
       */
      (event);

    const getValue = providers.get(contextRequestEvent.context);

    if (getValue != null) {
      event.stopImmediatePropagation();

      const internalController = InternalController.resolve(classInstance);
      const dispose = () => {
        internalController.registeredConsumersPerContext
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

      internalController.registeredConsumersPerContext
        ?.get(contextRequestEvent.context)
        ?.add(provide);

      provide(getValue.call(classInstance));
    }
  });
}

/**
 * @param {CustomElement} classInstance
 * @param {|
 *  ClassFieldDecoratorContext<CustomElement>
 *  | ClassSetterDecoratorContext<CustomElement>
 *  | ClassAccessorDecoratorContext<CustomElement>
 * } context
 * @param {string | symbol} [key]
 */
function initialiseConsumer(classInstance, context, key) {
  const consumeKey = key ?? context.name;
  const internalController = InternalController.resolve(classInstance);
  internalController.initialisers.add(() => {
    classInstance.dispatchEvent(
      new ContextRequestEvent(
        createContext(consumeKey),
        (value, unsubscribe) => {
          context.access.set(classInstance, value);
          if (unsubscribe) {
            internalController.disposals.add(unsubscribe);
          }
        },
        true,
      ),
    );
  });
  internalController.disposals.add(() => {
    // Initialise consumer again in case node will be reattached to DOM.
    initialiseConsumer(classInstance, context, key);
  });
}
