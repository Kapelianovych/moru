import { context, immediately, isContext } from "./context.js";

export const currentContext = (context) => {
  currentContext.ref = context;
};

export const cached = (contextOrNode, maybeNode) => {
  if (!isContext(contextOrNode)) {
    maybeNode = contextOrNode;
    contextOrNode = context();
  }

  return { node: maybeNode, context: contextOrNode };
};

export const discard = (cached) => {
  if (cached) {
    delete cached.instance;
    cached.context?.dispose();
    delete cached.context;
  }
};

export const ref =
  (initial) =>
  (...params) => {
    if (params.length) initial = params[0];
    else return initial;
  };

export const state = (contextOrValue, valueOrEquals, maybeEquals) => {
  if (!isContext(contextOrValue)) {
    maybeEquals = valueOrEquals;
    valueOrEquals = contextOrValue;
    contextOrValue = currentContext.ref;
  }

  return contextOrValue.state(valueOrEquals, maybeEquals);
};

export const memo = (
  contextOrCallback,
  callbackOrDependencies,
  dependenciesOrEquals,
  maybeEquals,
) => {
  if (!isContext(contextOrCallback)) {
    maybeEquals = dependenciesOrEquals;
    dependenciesOrEquals = callbackOrDependencies;
    callbackOrDependencies = contextOrCallback;
    contextOrCallback = currentContext.ref;
  }

  const [get, set] = contextOrCallback.state(undefined, maybeEquals);

  contextOrCallback.effect(
    () => set(callbackOrDependencies),
    dependenciesOrEquals,
    immediately,
  );

  return get;
};

export const effect = (
  contextOrCallback,
  callbackOrDependencies,
  dependenciesOrSchedule,
  maybeSchedule,
) => {
  if (!isContext(contextOrCallback)) {
    maybeSchedule = dependenciesOrSchedule;
    dependenciesOrSchedule = callbackOrDependencies;
    callbackOrDependencies = contextOrCallback;
    contextOrCallback = currentContext.ref;
  }

  contextOrCallback.effect(
    callbackOrDependencies,
    dependenciesOrSchedule,
    maybeSchedule,
  );
};

export const provider = (initial) => {
  const id = Symbol();

  const get = (context = currentContext.ref) =>
    id in context
      ? context[id]
      : context.parent
        ? get(context.parent)
        : initial;

  return [
    ({ value, children }, context) => {
      context[id] = value;

      context.effect(() => () => delete context[id], undefined, immediately);

      return children;
    },
    get,
  ];
};
