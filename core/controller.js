import { isDev } from "./environment.js";
import { startWatchers } from "./watcher.js";
import { initialiseState, wrapStateForStateOrController } from "./state.js";

export function controller(options) {
  return (target, context) => {
    if (context.kind === "class") {
      target.$controller = options ?? {};

      target.prototype.$ensurePropertiesAreInitialised = function () {
        if (this.$watchers) return;

        this.$watchers = [];
        this.$schedulers = new Map();
        this.$disposables = [];
        this.$stateDependencies = new Map();
        this.$connectedCallbacks = [];
        this.$disconnectedCallbacks = [];
        this.$controllerDependencies = [];
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
        if (
          isDev &&
          !("$view" in this.constructor) &&
          !("$controller" in this.constructor)
        ) {
          throw new Error(
            "@controller can only be classes which marked with @view() or @controller(), " +
              `but the ${this.constructor.name} is not.`,
          );
        }

        this.$ensurePropertiesAreInitialised();

        this.$controllerDependencies.push({
          access: context.access,
          constructor: options,
        });
      });
    }
  };
}

export function initialiseController(constructor, view) {
  const inheritedController = view.$lookupController(constructor);

  if (inheritedController) {
    return inheritedController;
  } else {
    const controller = new constructor(view.$environment);

    controller.$stateDependencies.forEach((context) => {
      const dependencyState = initialiseState(context.constructor, view);

      context.access.set(
        controller,
        wrapStateForStateOrController(dependencyState),
      );
    });
    controller.$controllerDependencies.forEach((context) => {
      const dependencyController = initialiseController(
        context.constructor,
        view,
      );

      context.access.set(controller, dependencyController);
    });

    view.$declaredControllers.set(constructor, controller);

    startWatchers(controller);

    return controller;
  }
}
