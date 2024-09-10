import { Scheduler } from "./scheduler.js";

export class Environment {
  constructor(allowEffects) {
    this.scheduler = new Scheduler(allowEffects);
    this.destroyed = !allowEffects;
    this.allowEffects = allowEffects;
  }

  destroy() {
    if (this.destroyed) return;

    this.scheduler.stop();
    this.destroyed = true;
  }
}

/**
 * Signals that current environment is development environment and
 * additional checks and warnings are present in the code.
 */
export const isDev = $DEV;
/**
 * Like `undefined` represents an empty uninitialised value. But unlike the
 * `undefined`, the user code cannot produce this value, so it is a stricter variant.
 *
 * This value is particularly useful to provide initial state for mutable variables.
 */
export const _ = Symbol();
