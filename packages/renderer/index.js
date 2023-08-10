import { isElement } from "moru";
import { createChildContext, isGetter } from "@moru/context";

const ASYNC_INSTANCE = Symbol("moru:async_instance");

const isAsyncInstance = (value) =>
  value && typeof value === "object" && ASYNC_INSTANCE in value;

const appendInstance = (options, parent, children, isHydrating) => {
  if (Array.isArray(children))
    children.forEach((child) =>
      appendInstance(options, parent, child, isHydrating),
    );
  else if (isAsyncInstance(children)) {
    appendInstance(options, parent, children.currentInstance, isHydrating);

    options.allowEffects && children.continue();
  } else options.appendInstance(parent, children, isHydrating);
};

const insertInstanceAfter = (
  options,
  parent,
  previousSibling,
  instance,
  updateInstance,
) => {
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
      instance.currentInstance,
    );

    options.allowEffects && instance.continue(updateInstance);
  } else options.insertInstanceAfter(parent, lastSiblingInstance, instance);
};

const replaceInstance = (options, parent, previous, next, updateInstance) => {
  let previousInstance;

  if (Array.isArray(previous)) {
    previousInstance = previous[0];

    previous
      .slice(1)
      .forEach((child) => removeInstance(options, parent, child));
  } else if (isAsyncInstance(previous))
    previousInstance = previous.currentInstance;
  else previousInstance = previous;

  insertInstanceAfter(options, parent, previousInstance, next, updateInstance);

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
  position,
  isHydrating,
) => {
  let isFinished;

  let currentInstance = render(
    options,
    context,
    parent,
    fallback,
    position,
    isHydrating,
  );

  return {
    [ASYNC_INSTANCE]: null,
    continue(updateInstance) {
      promise.then((instance) => {
        if (isFinished) return;

        const nextInstance = render(
          options,
          context,
          parent,
          instance,
          position,
          isHydrating,
        );

        replaceInstance(options, parent, currentInstance, nextInstance);

        currentInstance = nextInstance;
        updateInstance?.(nextInstance);
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
  position,
  isHydrating,
) => {
  const componentContext = createChildContext(context);

  options.allowEffects || componentContext.dispose();

  const result = tag(properties, componentContext);

  return result instanceof Promise
    ? createAsyncInstance(
        options,
        componentContext,
        parent,
        properties.fallback,
        result,
        position,
        isHydrating,
      )
    : render(options, componentContext, parent, result, position, isHydrating);
};

const renderIntrinsic = (
  options,
  context,
  parent,
  { tag, properties: { ref, children, ...attributes } },
  position,
  isHydrating,
) => {
  const instance = options.createInstance(parent, tag, position, isHydrating);

  Object.entries(attributes).forEach(([name, value]) =>
    isGetter(value)
      ? options.allowEffects
        ? context.createEffect(
            (value) => {
              options.setProperty(instance, name, value, isHydrating);
            },
            [value],
          )
        : options.setProperty(instance, name, value(), isHydrating)
      : options.setProperty(instance, name, value, isHydrating),
  );

  appendInstance(
    options,
    instance,
    render(options, context, instance, children, 0, isHydrating),
    isHydrating,
  );

  options.allowEffects && ref?.(instance);

  return instance;
};

const render = (options, context, parent, element, position, isHydrating) => {
  if (isGetter(element)) {
    if (!options.allowEffects)
      return render(options, context, parent, element(), position, isHydrating);

    let previousInstance;

    context.createEffect(
      (element) => {
        const currentContext = createChildContext(context);

        if (previousInstance) {
          const instance = render(
            options,
            currentContext,
            parent,
            element,
            position,
            isHydrating,
          );

          replaceInstance(
            options,
            parent,
            previousInstance,
            instance,
            (deferredInstance) => (previousInstance = deferredInstance),
          );

          previousInstance = instance;
        } else
          previousInstance = render(
            options,
            currentContext,
            parent,
            element,
            position,
            isHydrating,
          );

        return currentContext.dispose;
      },
      [element],
    );

    context.createEffect(
      () => () => removeInstance(options, parent, previousInstance),
    );

    return previousInstance;
  }

  if (isElement(element))
    return isGetter(element.tag)
      ? render(options, context, parent, element.tag, position, isHydrating)
      : typeof element.tag === "string"
      ? renderIntrinsic(
          options,
          context,
          parent,
          element,
          position,
          isHydrating,
        )
      : renderComponent(
          options,
          context,
          parent,
          element,
          position,
          isHydrating,
        );

  if (Array.isArray(element)) {
    const renderedChildren = element.flatMap((child, index) =>
      render(options, context, parent, child, position + index, isHydrating),
    );

    return renderedChildren.length
      ? renderedChildren
      : options.createDefaultInstance(parent, null, position, isHydrating);
  }

  return options.createDefaultInstance(parent, element, position, isHydrating);
};

export const createRenderer =
  (options) =>
  (context, element, root = options.defaultRoot, hydration) => {
    const instance = render(
      options,
      context,
      root,
      element,
      0,
      () => hydration,
    );

    appendInstance(options, root, instance, () => hydration);

    hydration = false;

    return () => removeInstance(options, root, instance);
  };
