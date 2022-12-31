export const runTask = Object.assign(
  (callback) => new Promise((resolve) => setTimeout(() => resolve(callback()))),
  {
    empty: () => runTask(() => {}),
  }
);

export const runMicrotask = Object.assign(
  (callback) => Promise.resolve().then(callback),
  {
    empty: () => runMicrotask(() => {}),
  }
);
