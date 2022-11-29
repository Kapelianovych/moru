import { ensureFunction } from "./utils.js";

let runningEffect, batchedEffects;

export const useBatch = (callback) => {
  const previousBatchedEffects = batchedEffects;
  batchedEffects = new Set();

  const result = callback();

  batchedEffects.forEach((effect) => {
    if (!previousBatchedEffects?.has(effect)) {
      rerun(effect, effect.__immediate);
      effect.__immediate && batchedEffects.delete(effect);
      delete effect.__immediate;
    }
  });

  batchedEffects = previousBatchedEffects;

  return result;
};

const run = (callback) => {
  runningEffect = callback;
  callback.__cleanup = ensureFunction(useBatch(callback));
  runningEffect = null;
};

const setup = (callback) => {
  callback.__parent = runningEffect;
  callback.__children = new Set();

  callback.__parent?.__children.add(callback);

  return callback;
};

export const runInContext = (callback) => run(setup(callback));

const clean = (effect) => {
  effect.__children.forEach((child) => {
    clean(child);
    child.__disposed = true;
  });
  effect.__children.clear();

  effect.__cleanup();
};

export const useEffect = (callback) => {
  const effect = setup(callback);

  queueMicrotask(() => run(effect));
};

const rerun = (effect, immediate) => {
  if (immediate) {
    clean(effect);
    run(effect);
  } else queueMicrotask(() => rerun(effect, true));
};

export const useState = (value, { equals = Object.is } = {}) => {
  const listeners = new Set();

  return [
    Object.defineProperty(
      () => {
        runningEffect && listeners.add(runningEffect);
        return value;
      },
      "raw",
      {
        get: () => value,
      }
    ),
    (next, { immediate } = {}) => {
      const nextValue = ensureFunction(next)(value);

      if (!equals(value, nextValue)) {
        value = nextValue;

        listeners.forEach((effect) =>
          effect.__disposed
            ? listeners.delete(effect)
            : batchedEffects?.add(
                Object.assign(effect, {
                  __immediate: effect.__immediate || immediate,
                })
              ) ?? rerun(effect, immediate)
        );
      }
    },
  ];
};

export const useMemo = (callback, options) => {
  const [value, setValue] = useState(undefined, options);

  runInContext(() => setValue(callback));

  return value;
};
