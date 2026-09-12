/**
 * @callback LifecycleCallback
 * @returns {void | Promise<void>}
 */

/**
 * @callback LifecyclePhaseSubscriber
 * @param {LifecycleCallback} callback
 * @returns {void}
 */

/**
 * @enum {typeof LifecyclePhase[keyof typeof LifecyclePhase]}
 */
export const LifecyclePhase = Object.freeze({
  AfterRender: "after-render",
});

/**
 * @typedef {Object} Lifecycle
 * @property {function(LifecyclePhase): Promise<void>} commit
 * @property {LifecyclePhaseSubscriber} onAfterRender
 */

/**
 * @returns {Lifecycle}
 */
export function createLifecycle() {
  /** @type {Record<LifecyclePhase, Set<LifecycleCallback>>} */
  const callbacks = {
    [LifecyclePhase.AfterRender]: new Set(),
  };

  return {
    onAfterRender(callback) {
      callbacks[LifecyclePhase.AfterRender].add(callback);
    },
    async commit(phase) {
      for (const callback of callbacks[phase]) {
        await callback();
      }
    },
  };
}
