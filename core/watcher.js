import { isDev } from "./environment.js";
import { immediately } from "./scheduler.js";
import { createSubscription, wrapStateForStateOrController } from "./state.js";

export function watch(...properties) {
  return (target, context) => {
    const watcher = {
      name: context.name,
      kind: context.kind,
      target,
      properties,
    };

    if (context.kind === "method") {
      context.addInitializer(function () {
        if (
          isDev &&
          !("$state" in this.constructor) &&
          !("$controller" in this.constructor)
        ) {
          throw new Error(
            "@watch can only be applied to methods in classes marked as @state() or @controller(), " +
              `but the ${this.constructor.name} class is not.`,
          );
        }

        this.$ensurePropertiesAreInitialised();

        this.$watchers.push(watcher);
      });
    } else if (context.kind === "setter" || context.kind === "getter") {
      context.addInitializer(function () {
        if (isDev && !("$state" in this.constructor)) {
          throw new Error(
            "@watch can only be applied to setters and getters in classes marked as @state(), " +
              `but the ${this.constructor.name} class is not.`,
          );
        }

        this.$ensurePropertiesAreInitialised();

        this.$watchers.push(watcher);
      });

      if (context.kind === "getter") {
        return function () {
          if (!this.$gettersCache.has(context.name)) {
            this.$gettersCache.set(
              context.name,
              target.call(wrapStateForStateOrController(this)),
            );
          }

          return this.$gettersCache.get(context.name);
        };
      }
    }
  };
}

export function startWatchers(target) {
  // We assume that states will have only public properties, since
  // they are intended to be accessible from other entities. In that case wrapping
  // the state in the Proxy will work and be reactive. Controllers do not have
  // reactive properties at all, so they shouldn't be wrapped at all. Another reason is that
  // a controller is intended to have private properties which are not accessible from a
  // proxied instance.
  target =
    "$state" in target.constructor
      ? wrapStateForStateOrController(target)
      : target;

  target.$watchers.forEach((watcher) => {
    const dependencies = watcher.properties
      .map((property) => property.split("."))
      .map((paths) => {
        const state = paths
          .slice(0, -1)
          .reduce(
            (target, property) =>
              target.$stateDependencies.get(property).access.get(target),
            target,
          );
        const property = paths.at(-1);

        if (isDev && !state?.constructor?.$state) {
          throw new Error(
            `The watched "${property}" property is expected to be in the state but the current target is not.`,
          );
        }

        return [state, property];
      });

    let callback;

    switch (watcher.kind) {
      case "method": {
        callback = () => {
          watcher.target.apply(
            target,
            dependencies.map(([state, property]) => state[property]),
          );
        };
        break;
      }
      case "setter": {
        callback = () => {
          watcher.target.apply(
            target,
            dependencies.map(([state, property]) => state[property]),
          );
        };
        break;
      }
      case "getter": {
        callback = () => {
          const equals = target.$comparators.get(watcher.name) ?? Object.is;
          const oldValue = target.$gettersCache.get(watcher.name);

          // We have to remove the cached value here so the next line
          // will surely calculate and cache a new value.
          target.$gettersCache.delete(watcher.name);

          const newValue = watcher.target.call(target);

          if (!equals(oldValue, newValue)) {
            target.$subscriptions.get(watcher.name)?.forEach(immediately);
          }
        };
        break;
      }
    }

    dependencies.forEach(([state, property]) => {
      const schedule = target.$schedulers.get(property);

      createSubscription(state, property, callback, target, schedule);
    });
  });
}
