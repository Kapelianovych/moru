import { isDev } from "./environment.js";
import { immediately } from "./scheduler.js";
import { initialiseController } from "./controller.js";
import { initialiseState, wrapStateForView } from "./state.js";

export function view(options) {
  return (target) => {
    target.$view = options ?? {};

    target.prototype.$ensurePropertiesAreInitialised = function () {
      if (this.$properties) return;

      this.$properties = new Map();
      this.$disposables = [];
      this.$initialisers = [];
      this.$declaredStates = new Map();
      this.$stateDependencies = new Map();
      this.$connectedCallbacks = [];
      this.$declaredControllers = new Map();
      this.$disconnectedCallbacks = [];
      this.$controllerDependencies = [];
    };

    return class extends target {
      $childViews = new Set();

      constructor(environment, parent, properties) {
        super();

        this.$parentView = parent;
        this.$environment = environment;

        this.$ensurePropertiesAreInitialised();

        this.$stateDependencies.forEach((context) => {
          const state = initialiseState(context.constructor, this);

          context.access.set(this, wrapStateForView(state));
        });
        this.$controllerDependencies.forEach((context) => {
          const controller = initialiseController(context.constructor, this);

          context.access.set(this, controller);
        });

        this.#injectProperties(properties);

        this.$initialisers.forEach((initialiser) => initialiser.call(this));
      }

      #injectProperties(properties) {
        const rest = {};

        for (const property in properties) {
          if (this.$properties.has(property)) {
            const value = properties[property];

            // The defined property may have a default value and we want
            // to preserve it if the injected value is undefined.
            if (value !== undefined) {
              this.$properties.get(property).set(this, value);
            }
          } else {
            rest[property] = properties[property];
          }
        }

        this.$properties.get("...")?.set(this, rest);
      }

      $connect() {
        if (!this.$connected) {
          this.$connected = true;
          this.$declaredControllers.forEach((controller) =>
            controller.$connectedCallbacks.forEach((callback) =>
              callback.call(controller),
            ),
          );
          this.$connectedCallbacks.forEach((callback) => callback.call(this));
        }

        this.$childViews.forEach((view) => view.$connect());
      }

      $disconnect(force, hasCacheableParent) {
        const constructor = this.constructor;

        this.$childViews.forEach((view) =>
          view.$disconnect(
            force,
            hasCacheableParent || constructor.$view.cacheable,
          ),
        );

        if (this.$connected) {
          this.$connected = false;

          if (force || !(constructor.$view.cacheable || hasCacheableParent)) {
            this.$disposables.forEach(immediately);
            this.$declaredControllers.forEach((controller) =>
              controller.$disposables.forEach(immediately),
            );
            this.$declaredStates.forEach((state) =>
              state.$disposables.forEach(immediately),
            );
          }

          if (force || !hasCacheableParent) {
            this.$parentView?.$childViews.delete(this);
            delete this.$parentView;
          }

          this.$declaredControllers.forEach((controller) =>
            controller.$disconnectedCallbacks.forEach((callback) =>
              callback.call(controller),
            ),
          );
          this.$disconnectedCallbacks.forEach((callback) =>
            callback.call(this),
          );
        }
      }

      $lookupState(constructor) {
        let state = this.$declaredStates.get(constructor);

        if (!state && constructor.$state.inheritable) {
          state = this.$parentView?.$lookupState(constructor);
        }

        return state;
      }

      $lookupController(constructor) {
        let controller = this.$declaredControllers.get(constructor);

        if (!controller && constructor.$controller.inheritable) {
          controller = this.$parentView?.$lookupController(constructor);
        }

        return controller;
      }
    };
  };
}

export function property(name) {
  return (_, context) => {
    if (isDev && context.kind !== "field") {
      throw new Error(
        `@property can be applied only to fields, but the target is ${context.name} (${context.kind}).`,
      );
    }

    context.addInitializer(function () {
      if (isDev && !("$view" in this.constructor)) {
        throw new Error(
          "@property can only be used inside the class marked as @view(), " +
            `but the ${this.constructor.name} is not.`,
        );
      }

      this.$ensurePropertiesAreInitialised();

      this.$properties.set(name, context.access);
    });
  };
}

export function initialised() {
  return (target, context) => {
    if (isDev && context.kind !== "method") {
      throw new Error(
        `@initialised can be applied only to methods, but the target is ${context.name} (${context.kind}).`,
      );
    }

    context.addInitializer(function () {
      if (isDev && !("$view" in this.constructor)) {
        throw new Error(
          "@initialised can only be used inside the class marked as @view(), " +
            `but the ${this.constructor.name} is not.`,
        );
      }

      this.$ensurePropertiesAreInitialised();

      this.$initialisers.push(target);
    });
  };
}

@view()
export class DefaultView {}
