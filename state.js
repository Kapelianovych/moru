import { ensureFunction } from "./utils.js";

let currentRunningEffect = null;

const run = (callback) => {
  currentRunningEffect = callback;
  const result = callback();

  if (result instanceof Promise)
    return result.then((value) => {
      currentRunningEffect = callback.__parent;
      return value;
    });
  else currentRunningEffect = callback.__parent;

  return result;
};

const setup = (callback) => {
  callback.__parent = currentRunningEffect;
  callback.__cleanup = null;
  callback.__children = new Set();
  callback.__disposed = false;

  callback.__parent?.__children.add(callback);

  return callback;
};

export const runInContext = (callback) => run(setup(callback));

const clean = (effect) => {
  effect.__children.forEach((child) => {
    clean(child);
    child.__parent = null;
    child.__disposed = true;
  });
  effect.__children.clear();

  effect.__cleanup?.();
  effect.__cleanup = null;
};

export const useEffect = (callback) => {
  const effect = setup(async () => {
    const result = await callback();
    if (typeof result === "function") effect.__cleanup = result;
  });

  queueMicrotask(() => run(effect));
};

const rerun = (effect) => {
  clean(effect);
  run(effect);
};

export const useState = (value) => {
  const listeners = new Set();

  return [
    Object.defineProperty(
      () => {
        currentRunningEffect && listeners.add(currentRunningEffect);
        return value;
      },
      "raw",
      {
        get: () => value,
      }
    ),
    (next, { immediate = false } = {}) => {
      const nextValue = ensureFunction(next)(value);

      if (value !== nextValue) {
        value = nextValue;

        listeners.forEach((effect) =>
          effect.__disposed
            ? listeners.delete(effect)
            : immediate
            ? rerun(effect)
            : queueMicrotask(() => rerun(effect))
        );
      }
    },
  ];
};

export const useMemo = (callback) => {
  const [value, setValue] = useState();

  runInContext(() => setValue(callback));

  return value;
};
