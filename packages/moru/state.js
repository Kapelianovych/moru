import { isFunction } from "./utils.js";

const batchedEffects = new Set();

let runningEffect, effectsRunnerTimer;

const setup = (callback) => {
  callback.__parent = runningEffect;
  callback.__children = new Set();

  runningEffect?.__children.add(callback);

  return callback;
};

const searchErrorHandler = (effect) =>
  effect.__error || (effect.__parent && searchErrorHandler(effect.__parent));

const run = (effect) => {
  const parentEffect = runningEffect;
  runningEffect = effect;

  try {
    const result = effect();

    isFunction(result) && (effect.__cleanup = result);
  } catch (error) {
    const handle = searchErrorHandler(effect);

    if (!handle) throw error;

    handle(error);
  } finally {
    runningEffect = parentEffect;
  }
};

const clean = (effect) => {
  effect.__children.forEach((child) => {
    clean(child);
    child.__disposed = true;
  });
  effect.__children.clear();

  delete effect.__error;

  effect.__cleanup?.();
  delete effect.__cleanup;
};

const scheduleEffectsRunner = () =>
  (effectsRunnerTimer ??= setTimeout(() => {
    batchedEffects.forEach((effect) => {
      clean(effect), run(effect);
      batchedEffects.delete(effect);
    });
    effectsRunnerTimer = null;
  }));

export const useState = (value, { equals = Object.is } = {}) => {
  const listeners = new Set();

  return [
    () => (runningEffect && listeners.add(runningEffect), value),
    (next) => {
      const nextValue = isFunction(next) ? next(value) : next;

      if (!equals(value, nextValue)) {
        value = nextValue;

        listeners.forEach((effect) =>
          effect.__disposed
            ? listeners.delete(effect)
            : batchedEffects.add(effect)
        );

        scheduleEffectsRunner();
      }
    },
  ];
};

export const useImmediateEffect = (callback) => run(setup(callback));

export const useEffect = (callback) => {
  const effect = setup(callback);

  queueMicrotask(() => run(effect));
};

export const useFree = (callback) => {
  const preservedRunningEffect = runningEffect;

  runningEffect = null;
  const result = callback();
  runningEffect = preservedRunningEffect;

  return result;
};

export const onError = (callback) => {
  runningEffect && (runningEffect.__error = callback);
};
