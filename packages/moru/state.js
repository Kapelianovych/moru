import { ensureFunction } from "./utils.js";

const batchedEffects = new Set();

let isFree, runningEffect, effectsRunnerTimer;

const setup = (callback) => {
  callback.__children = new Set();

  runningEffect?.__children.add(callback);

  return callback;
};

const run = (effect) => {
  runningEffect = effect;
  const result = runFree(effect, false);
  runningEffect = null;

  typeof result === "function" && (effect.__cleanup = result);
};

const clean = (effect) => {
  effect.__children.forEach((child) => {
    clean(child);
    child.__disposed = true;
  });
  effect.__children.clear();

  if (effect.__cleanup) {
    effect.__cleanup();
    delete effect.__cleanup;
  }
};

const scheduleEffectsRunner = () => {
  effectsRunnerTimer && clearTimeout(effectsRunnerTimer);

  effectsRunnerTimer = setTimeout(() => {
    effectsRunnerTimer = null;
    batchedEffects.forEach((effect) => {
      clean(effect);
      run(effect);
      batchedEffects.delete(effect);
    });
  });
};

const runFree = (callback, bool) => {
  const outerTrackingBool = isFree;
  isFree = bool;
  const result = callback();
  isFree = outerTrackingBool;

  return result;
};

export const runInContext = (callback) => run(setup(callback));

export const useState = (value, { equals = Object.is } = {}) => {
  const listeners = new Set();

  return [
    () => (!isFree && runningEffect && listeners.add(runningEffect), value),
    (next) => {
      const nextValue = ensureFunction(next)(value);

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

export const useEffect = (callback) => {
  const effect = setup(callback);

  queueMicrotask(() => run(effect));
};

export const useMemo = (callback, options) => {
  const [value, setValue] = useState(undefined, options);

  runInContext(() => setValue(callback));

  return value;
};

export const useFree = (callback) => runFree(callback, true);
