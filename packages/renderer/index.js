import { isGetter } from "@moru/context";
import { isElement } from "moru";

const ASYNC_INSTANCE = Symbol("moru:async_instance");

const isAsyncInstance = (value) =>
  value && typeof value === "object" && ASYNC_INSTANCE in value;

const appendInstance = (options, parent, children) => {
  if (Array.isArray(children))
    children.forEach((child) => appendInstance(options, parent, child));
  else if (isAsyncInstance(children)) {
    appendInstance(options, parent, children.currentInstance);

    options.allowEffects && children.continue();
  } else options.appendInstance(parent, children);
};

const insertInstanceAfter = (options, parent, previousSibling, instance) => {
  const lastSiblingInstance = Array.isArray(previousSibling)
    ? previousSibling[previousSibling.length - 1]
    : isAsyncInstance(previousSibling)
    ? previousSibling.currentInstance
    : previousSibling;

  if (Array.isArray(instance)) {
    let lastInsertedInstance = lastSiblingInstance;

    instance.forEach((child) => {
      insertInstanceAfter(options, parent, lastInsertedInstance, child);
      lastInsertedInstance = child;
    });
  } else if (isAsyncInstance(instance)) {
    insertInstanceAfter(
      options,
      parent,
      lastSiblingInstance,
      instance.currentInstance
    );

    options.allowEffects && instance.continue();
  } else options.insertInstanceAfter(parent, lastSiblingInstance, instance);
};

const replaceInstance = (options, parent, previous, next) => {
  let previousInstance;

  if (Array.isArray(previous)) {
    previousInstance = previous[0];

    previous
      .slice(1)
      .forEach((child) => removeInstance(options, parent, child));
  } else if (isAsyncInstance(previous))
    previousInstance = previous.currentInstance;
  else previousInstance = previous;

  insertInstanceAfter(options, parent, previousInstance, next);

  removeInstance(options, parent, previousInstance);
};

const removeInstance = (options, parent, instance) => {
  if (Array.isArray(instance))
    instance.forEach((child) => removeInstance(options, parent, child));
  else if (isAsyncInstance(instance))
    removeInstance(options, parent, instance.currentInstance);
  else options.removeInstance(parent, instance);
};

const createAsyncInstance = (
  options,
  context,
  parent,
  fallback,
  promise,
  nearestScopedDisposals
) => {
  let isFinished;

  let currentInstance = render(
    options,
    context,
    parent,
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
          parent,
          instance,
          nearestScopedDisposals
        );

        replaceInstance(options, parent, currentInstance, nextInstance);

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
  parent,
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

        dispose instanceof Promise ? dispose.then((fn) => fn?.()) : dispose?.();

        return () => {};
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
        parent,
        properties.fallback,
        result,
        nearestScopedDisposals
      )
    : render(options, context, parent, result, nearestScopedDisposals);
};

const renderIntrinsic = (
  options,
  context,
  parent,
  { tag, properties: { ref, children, ...attributes } },
  nearestScopedDisposals
) => {
  const instance = options.createInstance(parent, tag);

  Object.entries(attributes).forEach(([name, value]) => {
    if (isGetter(value))
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
  });

  appendInstance(
    options,
    instance,
    render(options, context, instance, children, nearestScopedDisposals)
  );

  ref?.(instance);

  return instance;
};

const render = (options, context, parent, element, nearestScopedDisposals) => {
  if (isGetter(element)) {
    if (!options.allowEffects)
      return render(options, context, parent, element(), null);

    let previousInstance;
    const currentScopedDisposals = new Set();

    const dispose = context.createUrgentEffect(
      (element) => {
        if (previousInstance) {
          const instance = render(
            options,
            context,
            parent,
            element,
            currentScopedDisposals
          );

          replaceInstance(options, parent, previousInstance, instance);

          previousInstance = instance;
        } else
          previousInstance = render(
            options,
            context,
            parent,
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
      removeInstance(options, parent, previousInstance);
    });

    return previousInstance;
  }

  if (isElement(element))
    return isGetter(element.tag)
      ? render(options, context, parent, element.tag, nearestScopedDisposals)
      : typeof element.tag === "string"
      ? renderIntrinsic(
          options,
          context,
          parent,
          element,
          nearestScopedDisposals
        )
      : renderComponent(
          options,
          context,
          parent,
          element,
          nearestScopedDisposals
        );

  if (Array.isArray(element)) {
    const renderedChildren = element.flatMap((child) =>
      render(options, context, parent, child, nearestScopedDisposals)
    );

    return renderedChildren.length
      ? renderedChildren
      : options.createDefaultInstance(parent, null);
  }

  return options.createDefaultInstance(parent, element);
};

export const createRenderer =
  (options) =>
  (context, element, root = options.defaultRoot) => {
    const instance = render(options, context, root, element, null);

    appendInstance(options, root, instance);

    return () => removeInstance(options, root, instance);
  };
