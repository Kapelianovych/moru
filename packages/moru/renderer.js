import { isElement } from "./element.js";
import { isGetter, context, immediately } from "./context.js";
import { currentContext, setCurrentContext } from "./enhancers.js";

const appendInstance = (options, parent, children, isHydrating) => {
  if (Array.isArray(children))
    children.forEach((child) =>
      appendInstance(options, parent, child, isHydrating),
    );
  else options.appendInstance(parent, children, isHydrating);
};

const insertInstanceAfter = (options, parent, previousSibling, instance) => {
  const lastSiblingInstance = Array.isArray(previousSibling)
    ? previousSibling.at(-1)
    : previousSibling;

  if (Array.isArray(instance)) {
    let lastInsertedInstance = lastSiblingInstance;

    instance.forEach((child) => {
      insertInstanceAfter(options, parent, lastInsertedInstance, child);
      lastInsertedInstance = child;
    });
  } else options.insertInstanceAfter(parent, lastSiblingInstance, instance);
};

const replaceInstance = (options, parent, previous, next) => {
  if (Array.isArray(previous) && Array.isArray(next)) {
    const nextSet = new Set(next);

    let previousInstance = previous[0];

    next.forEach((instance) => {
      insertInstanceAfter(options, parent, previousInstance, instance);

      previousInstance = instance;
    });

    previous.forEach(
      (instance) =>
        nextSet.has(instance) || removeInstance(options, parent, instance),
    );
  } else if (Array.isArray(previous)) {
    if (previous.includes(next))
      previous.forEach(
        (child) => child === next || removeInstance(options, parent, child),
      );
    else {
      insertInstanceAfter(options, parent, previous.at(-1), next);

      removeInstance(options, parent, previous);
    }
  } else if (Array.isArray(next)) {
    const isOldNodeIncluded = next.includes(previous);

    insertInstanceAfter(options, parent, previous, next);

    isOldNodeIncluded || removeInstance(options, parent, previous);
  } else if (previous !== next) {
    insertInstanceAfter(options, parent, previous, next);

    removeInstance(options, parent, previous);
  }
  // A previous and next nodes are the same node, don't do anything.
};

const removeInstance = (options, parent, instance) => {
  if (Array.isArray(instance))
    instance.forEach((child) => removeInstance(options, parent, child));
  else options.removeInstance(parent, instance);
};

const renderComponent = (
  options,
  passedContext,
  parent,
  { tag, properties },
  position,
  isHydrating,
) => {
  const currentGlobalContext = currentContext;

  const componentContext = context(passedContext);

  componentContext.resolve = (
    element,
    positionOffset = 0,
    ignoreHydration = false,
  ) =>
    render(
      options,
      componentContext,
      parent,
      element,
      position + positionOffset,
      ignoreHydration ? () => false : isHydrating,
    );

  options.allowEffects || componentContext.dispose();

  setCurrentContext(componentContext);

  const result = tag(properties, componentContext);

  setCurrentContext(currentGlobalContext);

  return render(
    options,
    componentContext,
    parent,
    result,
    position,
    isHydrating,
  );
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

  for (const name in attributes) {
    const value = attributes[name];

    isGetter(value)
      ? options.allowEffects
        ? context.effect(
            () => options.setProperty(instance, name, value(), isHydrating),
            [value],
            immediately,
          )
        : options.setProperty(instance, name, value(), isHydrating)
      : options.setProperty(instance, name, value, isHydrating);
  }

  appendInstance(
    options,
    instance,
    render(options, context, instance, children, 0, isHydrating),
    isHydrating,
  );

  options.allowEffects && ref?.(instance);

  return instance;
};

const render = (
  options,
  passedContext,
  parent,
  element,
  position,
  isHydrating,
) => {
  if (isGetter(element)) {
    if (!options.allowEffects)
      return render(
        options,
        passedContext,
        parent,
        element(),
        position,
        isHydrating,
      );

    let previousInstance;

    passedContext.effect(
      () => {
        const currentContext = context(passedContext);

        if (previousInstance) {
          const instance = render(
            options,
            currentContext,
            parent,
            element(),
            position,
            isHydrating,
          );

          replaceInstance(options, parent, previousInstance, instance);

          previousInstance = instance;
        } else
          previousInstance = render(
            options,
            currentContext,
            parent,
            element(),
            position,
            isHydrating,
          );

        return currentContext.dispose;
      },
      [element],
      immediately,
    );

    passedContext.effect(
      () => () => removeInstance(options, parent, previousInstance),
      undefined,
      immediately,
    );

    return previousInstance;
  }

  if (isElement(element))
    return isGetter(element.tag)
      ? render(
          options,
          passedContext,
          parent,
          element.tag,
          position,
          isHydrating,
        )
      : typeof element.tag === "string"
        ? renderIntrinsic(
            options,
            passedContext,
            parent,
            element,
            position,
            isHydrating,
          )
        : renderComponent(
            options,
            passedContext,
            parent,
            element,
            position,
            isHydrating,
          );

  if (Array.isArray(element)) {
    const renderedChildren = element.flatMap((child, index) =>
      render(
        options,
        passedContext,
        parent,
        child,
        position + index,
        isHydrating,
      ),
    );

    return renderedChildren.length
      ? renderedChildren
      : options.createDefaultInstance(parent, null, position, isHydrating);
  }

  return options.createDefaultInstance(parent, element, position, isHydrating);
};

export const renderer =
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
