/**
 * @import { CustomElement } from './controller.js'
 */

/**
 * @template Value
 * @callback ContextCallback
 * @param {Value} value
 * @param {VoidFunction} unsubscribe
 * @returns {void}
 */

/**
 * @template Type
 * @template Value
 * @typedef {Object} ContextRequest
 * @property {Type} type
 * @property {ContextCallback<Value>} callback
 */

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

    /**
     * @type {Set<function(unknown): void>}
     */
    const consumers = new Set();

    this.$registeredConsumersPerContext.set(context.name, consumers);

    const descriptor =
      /**
       * @type {TypedPropertyDescriptor<unknown>}
       */
      (Reflect.getOwnPropertyDescriptor(this, context.name));

    Reflect.defineProperty(this, context.name, {
      configurable: true,
      get:
        descriptor.get ??
        (() => {
          return descriptor.value;
        }),
      set(value) {
        if (descriptor.set) {
          descriptor.set.call(this, value);
        } else {
          descriptor.value = value;
        }
        consumers.forEach((consume) => {
          consume(value);
        });
        return true;
      },
    });
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

  const disposals = (classInstance.$disposals ??= new Set());

  /**
   * @param {Event} event
   */
  function provideContext(event) {
    const contextRequestEvent =
      /**
       * @type {CustomEvent<ContextRequest<string | symbol, unknown>>}
       */
      (event);

    if (providers.has(contextRequestEvent.detail.type)) {
      event.stopImmediatePropagation();

      const dispose = () => {
        classInstance.$registeredConsumersPerContext
          ?.get(contextRequestEvent.detail.type)
          ?.delete(provide);
      };

      /**
       * @param {unknown} value
       */
      const provide = (value) => {
        /**
         * @type {function(unknown): void}
         */
        const callback = (value) => {
          contextRequestEvent.detail.callback(value, dispose);
        };

        if (value instanceof Promise) {
          value.then(callback);
        } else {
          callback(value);
        }
      };

      classInstance.$registeredConsumersPerContext
        ?.get(contextRequestEvent.detail.type)
        ?.add(provide);

      provide(classInstance[contextRequestEvent.detail.type]);

      disposals.add(dispose);
    }
  }

  classInstance.addEventListener("context-request", provideContext);

  disposals.add(() => {
    classInstance.removeEventListener("context-request", provideContext);
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

    consumers.forEach((context) => {
      classInstance.dispatchEvent(
        new CustomEvent("context-request", {
          bubbles: true,
          composed: true,
          detail: {
            type: context,
            /**
             * @param {unknown} value
             * @param {VoidFunction} unsubscribe
             */
            callback(value, unsubscribe) {
              classInstance[context] = value;

              disposals.add(unsubscribe);
            },
          },
        }),
      );
    });
  }
}
