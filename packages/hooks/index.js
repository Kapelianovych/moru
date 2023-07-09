import { isGetter } from "@moru/context";

export const isDisposableGetter = (value) =>
  isGetter(value) && "dispose" in value;

export const useCache = (context, key, value) => context.useCache(key, value);

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
        const disposeEffect = createUrgentEffect(context, setValue, [result]);

        return () => {
          disposeEffect();
          result.dispose();
        };
      } else setValue(result);
    },
    dependencies,
  );

  const initial = value();

  return Object.assign(value, {
    dispose() {
      disposeEffect();
      disposeState();
      setValue(initial);
    },
  });
};

export const createProvider = (initial) => {
  const id = Symbol();

  let disposed;
  let disposeEffect;

  const get = (context) =>
    context[id] ?? (context.parent ? get(context.parent) : initial);

  return [
    ({ value, children }, context) => {
      context[id] = value;

      disposed ||
        (disposeEffect = createEffect(context, () => () => delete context[id]));

      return children;
    },
    get,
    () => {
      disposed = true;
      disposeEffect?.();
    },
  ];
};

const loadingResource = { state: "loading" };

const createResourceCache = (resource, parameters) => ({
  resource,
  dependencies: JSON.stringify(parameters),
});

const normaliseCachedValue = async (value) => {
  try {
    value = await value;
  } catch {
    value = null;
  }

  return {
    resource: value?.resource ?? loadingResource,
    dependencies: value?.dependencies ?? "",
  };
};

export const createResource = (
  context,
  fetcher,
  dependencies = [],
  { cache: [cachedValue, cacheValue, disposeCache] = [] } = {},
) => {
  const [resource, updateResource, disposeState] = createState(
    context,
    loadingResource,
  );

  let firstCall = true;

  const disposeEffect = createEffect(
    context,
    async (...parameters) => {
      if (firstCall) {
        firstCall = false;

        const fromCacheValue = await normaliseCachedValue(cachedValue?.());

        if (
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
