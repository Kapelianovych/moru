import { isGetter } from "@moru/context";

export const isDisposableGetter = (value) =>
  isGetter(value) && "dispose" in value;

export const createState = (context, initial, options) =>
  context.createState(initial, options);

export const createEffect = (context, callback, dependencies) =>
  context.createEffect(callback, dependencies);

export const createUrgentEffect = (context, callback, dependencies) =>
  context.createUrgentEffect(callback, dependencies);

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

      disposes.add(createEffect(context, () => () => delete context[id]));

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
