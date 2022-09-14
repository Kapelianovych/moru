const effects = [];

const execute = (callback) => {
  effects.push(callback);
  const result = callback();
  effects.pop();

  return result;
};

const clean = (fn) => {
  fn.__children.forEach((child) => {
    clean(child);
    child.__disposed = true;
  });
  fn.__children.clear();

  fn.__cleanup?.();
  fn.__cleanup = null;
};

export const context = (callback) => {
  callback.__refs = {};
  callback.__cleanup = null;
  callback.__children = new Set();
  callback.__disposed = false;

  effects.at(-1)?.__children.add(callback);

  return execute(callback);
};

export const useEffect = (callback) => {
  const cleanup = context(callback);

  if (typeof cleanup === "function") {
    callback.__cleanup = cleanup;
  }
};

export const useState = (value) => {
  const listeners = new Set();

  return [
    Object.defineProperty(
      () => {
        const effect = effects.at(-1);

        effect && listeners.add(effect);

        return value;
      },
      "raw",
      {
        get: () => value,
      }
    ),
    (next) => {
      const nextValue = typeof next === "function" ? next(value) : next;

      if (nextValue !== value) {
        value = nextValue;

        listeners.forEach((fn) => {
          if (fn.__disposed) {
            listeners.delete(fn);
          } else {
            clean(fn);
            execute(fn);
          }
        });
      }
    },
  ];
};
