import { isDev } from "./environment.js";
import { Consumer } from "./consumer.js";
import { immediately } from "./scheduler.js";
import { startWatchers } from "./watcher.js";

export function state(options) {
  return (target, context) => {
    if (context.kind === "class") {
      target.$state = options ?? {};

      target.prototype.$ensurePropertiesAreInitialised = function () {
        if (this.$watchers) return;

        this.$watchers = [];
        this.$schedulers = new Map();
        this.$disposables = [];
        this.$comparators = new Map();
        this.$gettersCache = new Map();
        this.$subscriptions = new Map();
        this.$stateDependencies = new Map();
      };

      return class extends target {
        constructor(environment) {
          super();

          this.$environment = environment;

          this.$ensurePropertiesAreInitialised();
        }
      };
    } else if (context.kind === "field") {
      context.addInitializer(function () {
        this.$ensurePropertiesAreInitialised();

        this.$stateDependencies.set(context.name, {
          access: context.access,
          constructor: options,
        });
      });
    }
  };
}

export function comparator(compare) {
  return (_, context) => {
    if (isDev && context.kind !== "field" && context.kind !== "getter") {
      throw new Error(
        "@comparator is meant to be defined for source (fields) or computed (getters) values," +
          _` instead the target is ${context.name} (${context.kind}).`,
      );
    }

    context.addInitializer(function () {
      if (isDev && !("$state" in this.constructor)) {
        throw new Error(
          "@comparator can only be used inside the class which marked as the @state()," +
            ` but ${this.constructor.name} is not.`,
        );
      }

      this.$ensurePropertiesAreInitialised();

      this.$comparators.set(context.name, compare);
    });
  };
}

export function initialiseState(constructor, view) {
  const inheritedState = view.$lookupState(constructor);

  if (inheritedState) {
    return inheritedState;
  } else {
    const state = new constructor(view.$environment);

    state.$stateDependencies.forEach((context) => {
      const dependencyState = initialiseState(context.constructor, view);

      context.access.set(state, wrapStateForStateOrController(dependencyState));
    });

    view.$declaredStates.set(constructor, state);

    startWatchers(state);

    return state;
  }
}

export function createSubscription(
  state,
  property,
  callback,
  initiator,
  schedule,
) {
  const scheduler = initiator.$environment.scheduler;
  const watchedPropertiesMap = state.$subscriptions;

  const effect = () => callback(state[property]);

  const subscription = () => {
    scheduler.schedule(effect, schedule);
  };

  if (watchedPropertiesMap.has(property)) {
    watchedPropertiesMap.get(property).add(subscription);
  } else watchedPropertiesMap.set(property, new Set([subscription]));

  initiator.$disposables.push(() => {
    watchedPropertiesMap.get(property).delete(subscription);
    scheduler.unschedule(effect, schedule);
  });

  return subscription;
}

export function wrapStateForView(state) {
  return new Proxy(unwrapIfState(state), {
    get(target, property) {
      if (property === "$originalState") {
        return state;
      }

      return Consumer.of(target, property);
    },
    has(target, property) {
      if (property === "$originalState") {
        return true;
      }

      return Reflect.has(target, property);
    },
    set() {
      // Forbid changing state in views.
      return false;
    },
    deleteProperty() {
      // Forbid deleting properties from state in views.
      return false;
    },
  });
}

export function wrapStateForStateOrController(state) {
  return new Proxy(unwrapIfState(state), {
    get(target, property) {
      if (property === "$originalState") {
        return state;
      }

      return target[property];
    },
    has(target, property) {
      if (property === "$originalState") {
        return true;
      }

      return Reflect.has(target, property);
    },
    set(target, property, newValue) {
      const equals = target.$comparators.get(property) ?? Object.is;

      const oldValue = target[property];
      const isPropertyUpdated = Reflect.set(target, property, newValue, target);

      if (!equals(oldValue, newValue)) {
        target.$subscriptions.get(property)?.forEach(immediately);
      }

      return isPropertyUpdated;
    },
    deleteProperty(target, property) {
      const value = target[property];
      const result = Reflect.deleteProperty(target, property);

      if (value !== undefined) {
        target.$subscriptions.get(property)?.forEach(immediately);
      }

      return result;
    },
  });
}

export function unwrapIfState(state) {
  return state?.$originalState ?? state;
}
