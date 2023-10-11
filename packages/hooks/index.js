import { isGetter } from "@moru/context";

export const isDisposableGetter = (value) =>
  isGetter(value) && "dispose" in value;

export const createState = (context, initial, options) =>
  context.createState(initial, options);

export const createUrgentEffect = (context, callback, dependencies) =>
  context.createEffect(callback, dependencies);

export const createEffectFactory = (request) => {
  let isScheduled;

  const queue = new Set();

  return (context, callback, dependencies = []) => {
    let disposeCallback;

    const effect = () => {
      disposeCallback?.();

      const clear = callback(...dependencies.map((fn) => fn()));

      disposeCallback = () =>
        clear instanceof Promise ? clear.then((fn) => fn?.()) : clear?.();
    };

    const disposeArtifacts = () => {
      disposeCallback?.();
      disposeCallback = null;
      queue.delete(effect);
    };

    const disposeEffect = createUrgentEffect(
      context,
      () => {
        queue.add(effect);

        isScheduled ??= request(
          () => (isScheduled = queue.forEach((fn) => (fn(), queue.delete(fn)))),
        );

        return () => context.disposed && disposeArtifacts();
      },
      dependencies,
    );

    return () => {
      disposeEffect();
      disposeArtifacts();
    };
  };
};

export const createEffect = createEffectFactory(
  globalThis.requestIdleCallback ?? setTimeout,
);

export const createImportantEffect = createEffectFactory(
  (callback) => (queueMicrotask(callback), 0),
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
      const result = callback(...parameters, value());

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

export const createRef = (...initial) => {
  const definition = (ref) => {
    initial[0] = ref;
  };

  Reflect.defineProperty(definition, "current", {
    get() {
      if (initial.length) return initial[0];
      else throw new Error("Ref is used before being assigned.");
    },
    enumerable: true,
    configurable: false,
  });

  return definition;
};
