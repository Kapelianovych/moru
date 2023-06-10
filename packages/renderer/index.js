import { isGetter } from "@moru/context";
import { isElement } from "moru";

const ASYNC_INSTANCE = Symbol("moru:async_instance");

const isAsyncInstance = (value) =>
  value && typeof value === "object" && ASYNC_INSTANCE in value;

const appendChild = (options, parent, children) => {
  if (Array.isArray(children))
    children.forEach((child) => appendChild(options, parent, child));
  else if (isAsyncInstance(children)) {
    appendChild(options, parent, children.currentInstance);

    children.continue();
  } else options.appendChild(parent, children);
};

const insertInstanceAfter = (options, previousSibling, instance) => {
  const lastSiblingInstance = Array.isArray(previousSibling)
    ? previousSibling[previousSibling.length - 1]
    : isAsyncInstance(previousSibling)
    ? previousSibling.currentInstance
    : previousSibling;

  if (Array.isArray(instance)) {
    let lastInsertedInstance = lastSiblingInstance;

    instance.forEach((child) => {
      insertInstanceAfter(options, lastInsertedInstance, child);
      lastInsertedInstance = child;
    });
  } else if (isAsyncInstance(instance)) {
    insertInstanceAfter(options, lastSiblingInstance, instance.currentInstance);

    instance.continue();
  } else options.insertInstanceAfter(lastSiblingInstance, instance);
};

const replaceInstance = (options, previous, next) => {
  let previousInstance;

  if (Array.isArray(previous)) {
    previousInstance = previous[0];

    previous.slice(1).forEach((child) => removeInstance(options, child));
  } else if (isAsyncInstance(previous))
    previousInstance = previous.currentInstance;
  else previousInstance = previous;

  insertInstanceAfter(options, previousInstance, next);

  removeInstance(options, previousInstance);
};

const removeInstance = (options, instance) => {
  if (Array.isArray(instance))
    instance.forEach((child) => removeInstance(options, child));
  else if (isAsyncInstance(instance))
    removeInstance(options, instance.currentInstance);
  else options.removeInstance(instance);
};

const createAsyncInstance = (
  options,
  context,
  fallback,
  promise,
  nearestScopedDisposals
) => {
  let isFinished;

  let currentInstance = render(
    options,
    context,
    fallback,
    nearestScopedDisposals
  );

  return {
    [ASYNC_INSTANCE]: null,
    continue() {
      promise.then((instance) => {
        if (isFinished) return;

        const nextInstance = render(
          options,
          context,
          instance,
          nearestScopedDisposals
        );

        replaceInstance(options, currentInstance, nextInstance);

        currentInstance = nextInstance;
        isFinished = true;
      });
    },
    get currentInstance() {
      return currentInstance;
    },
  };
};

const renderComponent = (
  options,
  context,
  { tag, properties },
  nearestScopedDisposals
) => {
  const result = tag(properties, {
    createState(initial, stateOptions) {
      const state = context.createState(initial, stateOptions);

      options.allowEffects
        ? nearestScopedDisposals?.add(state[2])
        : // Immediately dispose the state.
          state[2]();

      return state;
    },
    createEffect(callback, dependencies) {
      if (!options.allowEffects) return () => {};

      const dispose = context.createEffect(callback, dependencies);

      nearestScopedDisposals?.add(dispose);

      return dispose;
    },
    createUrgentEffect(callback, dependencies = []) {
      if (!options.allowEffects) {
        const dispose = callback(
          ...dependencies.map((dependency) => dependency())
        );

        return () => {
          dispose instanceof Promise
            ? dispose.then((fn) => fn?.())
            : dispose?.();
        };
      }

      const dispose = context.createUrgentEffect(callback, dependencies);

      nearestScopedDisposals?.add(dispose);

      return dispose;
    },
  });

  return result instanceof Promise
    ? createAsyncInstance(
        options,
        context,
        properties.fallback,
        result,
        nearestScopedDisposals
      )
    : render(options, context, result, nearestScopedDisposals);
};

const renderIntrinsic = (
  options,
  context,
  { tag, properties: { ref, children, ...attributes } },
  nearestScopedDisposals
) => {
  const instance = options.createInstance(tag);

  for (const name in attributes) {
    const value = attributes[name];

    if (name === "class" && Array.isArray(value))
      value.forEach((name) =>
        typeof name === "string"
          ? options.setProperty(instance, "class", name)
          : Object.entries(value).forEach(([name, value]) => {
              if (isGetter(value))
                if (options.allowEffects) {
                  const dispose = context.createUrgentEffect(
                    (value) => {
                      options.setProperty(instance, "class:" + name, value);
                    },
                    [value]
                  );

                  nearestScopedDisposals?.add(dispose);
                } else options.setProperty(instance, "class:" + name, value());
              else options.setProperty(instance, "class:" + name, value);
            })
      );
    else if (name === "style" && typeof value === "object")
      Object.entries(value ?? {}).forEach(([name, value]) => {
        if (isGetter(value))
          if (options.allowEffects) {
            const dispose = context.createUrgentEffect(
              (value) => {
                options.setProperty(instance, "style:" + name, value);
              },
              [value]
            );

            nearestScopedDisposals?.add(dispose);
          } else options.setProperty(instance, "style:" + name, value());
        else options.setProperty(instance, "style:" + name, value);
      });
    else if (isGetter(value))
      if (options.allowEffects) {
        const dispose = context.createUrgentEffect(
          (value) => {
            options.setProperty(instance, name, value);
          },
          [value]
        );

        nearestScopedDisposals?.add(dispose);
      } else options.setProperty(instance, name, value());
    else options.setProperty(instance, name, value);
  }

  appendChild(
    options,
    instance,
    render(options, context, children, nearestScopedDisposals)
  );

  ref?.(instance);

  return instance;
};

const render = (options, context, element, nearestScopedDisposals) => {
  if (isGetter(element)) {
    if (!options.allowEffects) return render(options, context, element(), null);

    let previousInstance;
    const currentScopedDisposals = new Set();

    const dispose = context.createUrgentEffect(
      (element) => {
        if (previousInstance) {
          const instance = render(
            options,
            context,
            element,
            currentScopedDisposals
          );

          replaceInstance(options, previousInstance, instance);

          previousInstance = instance;
        } else
          previousInstance = render(
            options,
            context,
            element,
            currentScopedDisposals
          );

        if (nearestScopedDisposals)
          currentScopedDisposals.forEach((dispose) =>
            nearestScopedDisposals.add(dispose)
          );

        return () => {
          currentScopedDisposals.forEach((dispose) => {
            dispose();
            nearestScopedDisposals?.delete(dispose);
          });
          currentScopedDisposals.clear();
        };
      },
      [element]
    );

    nearestScopedDisposals?.add(() => {
      dispose();
      removeInstance(options, previousInstance);
    });

    return previousInstance;
  }

  if (isElement(element))
    return isGetter(element.tag)
      ? render(options, context, element.tag, nearestScopedDisposals)
      : typeof element.tag === "string"
      ? renderIntrinsic(options, context, element, nearestScopedDisposals)
      : renderComponent(options, context, element, nearestScopedDisposals);

  if (Array.isArray(element)) {
    const renderedChildren = element.flatMap((child) =>
      render(options, context, child, nearestScopedDisposals)
    );

    return renderedChildren.length
      ? renderedChildren
      : options.createDefaultInstance("");
  }

  return options.createDefaultInstance(element);
};

export const createRenderer =
  (options) =>
  (context, element, root = options.defaultRoot) => {
    const instance = render(options, context, element, null);

    appendChild(options, root, instance);

    return () => removeInstance(options, instance);
  };
