import { immediately, isContext } from "./context.js";

export let currentContext;

export const setCurrentContext = (context) => {
  currentContext = context;
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
    contextOrValue = currentContext;
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
    contextOrCallback = currentContext;
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
    contextOrCallback = currentContext;
  }

  contextOrCallback.effect(
    callbackOrDependencies,
    dependenciesOrSchedule,
    maybeSchedule,
  );
};

export const resolve = (
  contextOrElement,
  elementOrPositionOffset,
  positionOffsetOrIgnoreHydration,
  maybeIgnoreHydration,
) => {
  if (!isContext(contextOrElement)) {
    maybeIgnoreHydration = positionOffsetOrIgnoreHydration;
    positionOffsetOrIgnoreHydration = elementOrPositionOffset;
    elementOrPositionOffset = contextOrElement;
    contextOrElement = currentContext;
  }

  return contextOrElement.resolve(
    elementOrPositionOffset,
    positionOffsetOrIgnoreHydration,
    maybeIgnoreHydration,
  );
};

export const provider = (initial) => {
  const id = Symbol();

  const get = (context = currentContext) =>
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
