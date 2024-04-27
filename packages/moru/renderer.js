import { isElement } from "./element.js";
import { currentContext, discard } from "./enhancers.js";
import { isGetter, context, immediately } from "./context.js";

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

const replaceInstance = (options, parent, marker, previous, next) => {
  const nextSet = Array.isArray(next) ? new Set(next) : new Set([next]);

  if (Array.isArray(previous))
    previous.forEach(
      (instance) =>
        nextSet.has(instance) || removeInstance(options, parent, instance),
    );
  else nextSet.has(previous) || removeInstance(options, parent, previous);

  insertInstanceAfter(options, parent, marker, next);
};

const removeInstance = (options, parent, instance) => {
  if (Array.isArray(instance))
    instance.forEach((child) => removeInstance(options, parent, child));
  else options.removeInstance(parent, instance);
};

const renderComponent = (
  options,
  context,
  parent,
  element,
  position,
  isHydrating,
) => {
  currentContext(context);
  const result = element.tag(element.properties, context);
  delete currentContext.ref;

  return render(options, context, parent, result, position, isHydrating);
};

const renderIntrinsic = (
  options,
  context,
  parent,
  element,
  position,
  isHydrating,
) => {
  const instance = options.createInstance(
    parent,
    element.tag,
    position,
    isHydrating,
  );

  for (const name in element.properties) {
    if (name === "ref" || name === "children") continue;

    const value = element.properties[name];

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
    render(
      options,
      context,
      instance,
      element.properties.children,
      0,
      isHydrating,
    ),
    isHydrating,
  );

  options.allowEffects && element.properties.ref?.(instance);

  return instance;
};

const renderNonCached = (
  options,
  passedContext,
  parent,
  node,
  position,
  isHydrating,
) => {
  if (isGetter(node)) {
    const marker = render(
      options,
      passedContext,
      parent,
      null,
      position,
      isHydrating,
    );

    if (!options.allowEffects)
      return [
        marker,
        render(
          options,
          passedContext,
          parent,
          node(),
          position + 1,
          isHydrating,
        ),
      ];

    let previousInstance;

    passedContext.effect(
      () => {
        const currentContext = context(passedContext);

        if (previousInstance) {
          const instance = render(
            options,
            currentContext,
            parent,
            node(),
            position + 1,
            isHydrating,
          );

          replaceInstance(options, parent, marker, previousInstance, instance);

          previousInstance = instance;
        } else
          previousInstance = render(
            options,
            currentContext,
            parent,
            node(),
            position + 1,
            isHydrating,
          );

        return currentContext.dispose;
      },
      [node],
      immediately,
    );

    passedContext.effect(
      () => () => removeInstance(options, parent, [marker, previousInstance]),
      undefined,
      immediately,
    );

    return [marker, previousInstance];
  }

  if (isElement(node))
    return isGetter(node.tag)
      ? render(options, passedContext, parent, node.tag, position, isHydrating)
      : typeof node.tag === "string"
        ? renderIntrinsic(
            options,
            passedContext,
            parent,
            node,
            position,
            isHydrating,
          )
        : renderComponent(
            options,
            passedContext,
            parent,
            node,
            position,
            isHydrating,
          );

  if (Array.isArray(node)) {
    const renderedChildren = node.flatMap((child, index) =>
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

  return options.createDefaultInstance(parent, node, position, isHydrating);
};

const render = (
  options,
  passedContext,
  parent,
  maybeCachedNode,
  position,
  isHydrating,
) => {
  if (maybeCachedNode?.instance) return maybeCachedNode.instance;

  options.allowEffects || discard(maybeCachedNode);

  const instance = renderNonCached(
    options,
    maybeCachedNode?.context ?? passedContext,
    parent,
    maybeCachedNode?.node ?? maybeCachedNode,
    position,
    isHydrating,
  );

  maybeCachedNode?.context && (maybeCachedNode.instance = instance);

  return instance;
};

export const renderer =
  (options) =>
  (context, node, root = options.defaultRoot, hydration) => {
    options.allowEffects || context.dispose();

    const instance = render(options, context, root, node, 0, () => hydration);

    appendInstance(options, root, instance, () => hydration);

    hydration = false;

    return () => removeInstance(options, root, instance);
  };
