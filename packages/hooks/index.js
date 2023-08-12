import { isGetter } from "@moru/context";

export const isDisposableGetter = (value) =>
  isGetter(value) && "dispose" in value;

export const createState = (context, initial, options) =>
  context.createState(initial, options);

export const createUrgentEffect = (context, callback, dependencies) =>
  context.createEffect(callback, dependencies);

const createEffectFactory = (request, revoke) => {
  let timeout;

  const queue = new Set();

  return (context, callback, dependencies = []) => {
    let callbackDispose;

    const effect = () => {
      callbackDispose?.();

      const clear = callback(...dependencies.map((fn) => fn()));

      callbackDispose = () =>
        clear instanceof Promise ? clear.then((fn) => fn?.()) : clear?.();
    };

    const dispose = createUrgentEffect(
      context,
      () => {
        queue.add(effect);

        timeout ??= request(
          () => (timeout = queue.forEach((fn) => (fn(), queue.delete(fn)))),
        );

        return () => {
          if (context.disposed) {
            timeout && revoke(timeout);
            callbackDispose?.();
            timeout = callbackDispose = queue.clear();
          }
        };
      },
      dependencies,
    );

    return () => {
      queue.delete(effect);
      dispose();
      callbackDispose?.();
      callbackDispose = null;
    };
  };
};

export const createEffect = createEffectFactory(
  globalThis.requestIdleCallback ?? setTimeout,
  globalThis.cancelIdleCallback ?? clearTimeout,
);

const requestMicrotask = (callback) => {
  requestMicrotask.timeouts ??= new Set();

  const id = Symbol();

  requestMicrotask.timeouts.add(id);

  queueMicrotask(() => {
    requestMicrotask.timeouts.has(id) && callback();
    requestMicrotask.timeouts.delete(id);
  });

  return id;
};

const revokeMicrotask = (id) => requestMicrotask.timeouts?.delete(id);

export const createImportantEffect = createEffectFactory(
  requestMicrotask,
  revokeMicrotask,
);

export const createMemo = (context, callback, dependencies, options) => {
  const [value, setValue, disposeState] = createState(
    context,
    undefined,
    options,
  );

  const disposeEffect = createUrgentEffect(
    context,
    (...parameters) => {
      const result = callback(value(), ...parameters);

      if (isDisposableGetter(result)) {
        const disposeEffect = createUrgentEffect(
          context,
          (value) => setValue(() => value),
          [result],
        );

        return () => {
          disposeEffect();
          result.dispose();
        };
      } else setValue(() => result);
    },
    dependencies,
  );

  return Object.assign(value, {
    dispose() {
      disposeEffect();
      disposeState();
    },
  });
};

export const createProvider = (initial) => {
  let disposed;

  const id = Symbol();
  const disposes = new Set();

  const get = (context) =>
    disposed
      ? initial
      : id in context
      ? context[id]
      : context.parent
      ? get(context.parent)
      : initial;

  return [
    ({ value, children }, context) => {
      if (disposed) return children;

      context[id] = value;

      disposes.add(createUrgentEffect(context, () => () => delete context[id]));

      return children;
    },
    get,
    () => {
      if (disposed) return;

      disposed = true;
      disposes.forEach((dispose) => dispose());
      disposes.clear();
    },
  ];
};

const loadingResource = { state: "loading" };

const createResourceCache = (resource, parameters) => ({
  resource,
  dependencies: JSON.stringify(parameters),
});

export const createResource = (
  context,
  fetcher,
  dependencies = [],
  { cache: [cachedValue, cacheValue, disposeCache] = [] } = {},
) => {
  let maybeValueFromCache = cachedValue?.();

  const [resource, updateResource, disposeState] = createState(
    context,
    maybeValueFromCache?.resource ?? loadingResource,
  );

  const disposeEffect = createEffect(
    context,
    async (...parameters) => {
      if (maybeValueFromCache) {
        const fromCacheValue =
          maybeValueFromCache instanceof Promise
            ? await maybeValueFromCache
            : maybeValueFromCache;

        maybeValueFromCache = null;

        if (
          fromCacheValue &&
          fromCacheValue.resource !== loadingResource &&
          fromCacheValue.dependencies === JSON.stringify(parameters)
        )
          return;
      }

      updateResource(loadingResource);

      fetcher(...parameters).then(
        (result) => {
          const loadedResource = { state: "loaded", value: result };

          cacheValue?.(createResourceCache(loadedResource, parameters));
          updateResource(loadedResource);
        },
        (error) => updateResource({ state: "failed", value: error }),
      );
    },
    dependencies,
  );

  return Object.assign(resource, {
    dispose() {
      disposeEffect();
      disposeState();
      disposeCache?.();
    },
  });
};
