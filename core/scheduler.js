import { isDev } from "./environment.js";

export class Scheduler {
  #queues = new Map();

  defaultRunner = queueMicrotask;

  constructor(allowEffects) {
    this.stopped = !allowEffects;
  }

  schedule(callback, run) {
    if (this.stopped) return;

    run ??= this.defaultRunner;

    if (!this.#queues.has(run)) {
      this.#queues.set(run, new Set());
    }

    const queue = this.#queues.get(run);
    const shouldRun = !queue.size;

    queue.add(callback);

    if (shouldRun) {
      run(() =>
        queue.forEach((callback) => {
          queue.delete(callback);
          callback();
        }),
      );
    }
  }

  unschedule(callback, run) {
    run ??= this.defaultRunner;

    this.#queues.get(run)?.delete(callback);
  }

  stop() {
    this.#queues.clear();
    this.stopped = true;
  }
}

export function immediately(callback) {
  callback();
}

export function scheduler(schedule) {
  return (_, context) => {
    if (isDev && context.kind !== "method" && context.kind !== "setter") {
      throw new Error(
        "@scheduler can be applied only to methods and setters" +
          ` but the target is ${context.name} (${context.kind}).`,
      );
    }

    context.addInitializer(function () {
      if (
        isDev &&
        !("$state" in this.constructor) &&
        !("$controller" in this.constructor)
      ) {
        throw new Error(
          "The parent class for the @scheduler must be marked with @state() or @controller()," +
            ` but the ${this.constructor.name} is not.`,
        );
      }

      this.$ensurePropertiesAreInitialised();

      this.$schedulers.set(context.name, schedule);
    });
  };
}
