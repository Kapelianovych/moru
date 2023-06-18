export const createCache = (context, key, value) =>
  context.createCache(key, value);

export const createState = (context, initial, options) =>
  context.createState(initial, options);

export const createEffect = (context, callback, dependencies) =>
  context.createEffect(callback, dependencies);

export const createUrgentEffect = (context, callback, dependencies) =>
  context.createUrgentEffect(callback, dependencies);

export const createMemo = (context, callback, dependencies, options) => {
  const [value, setValue, disposeState] = createState(context, undefined, options);

  const disposeEffect = createUrgentEffect(
    context,
    (...parameters) =>
      setValue((oldValue) => callback(oldValue, ...parameters)),
    dependencies
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
  let _value = initial;
  let disposed;
  let disposeEffect;

  return [
    ({ value, children }, context) => {
      _value = value;

      disposed ||
        (disposeEffect = createEffect(context, () => () => (_value = initial)));

      return children;
    },
    () => _value,
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

export const createResource = (
  context,
  fetcher,
  dependencies = [],
  { cacheKey } = {}
) => {
  const [cachedValue, cacheValue, disposeCache] = cacheKey
    ? createCache(
        context,
        cacheKey,
        createResourceCache(
          loadingResource,
          dependencies.map((dependency) => dependency())
        )
      )
    : [() => createResourceCache(loadingResource, ""), () => {}, () => {}];

  const [value, updateValue, disposeState] = createState(
    context,
    cachedValue().resource
  );

  let firstCall = true;

  const disposeEffect = createEffect(
    context,
    (...parameters) => {
      if (firstCall) {
        firstCall = false;

        if (
          value() !== loadingResource &&
          cachedValue().dependencies === JSON.stringify(parameters)
        )
          return;
      }

      updateValue(loadingResource);

      fetcher(...parameters).then(
        (result) => {
          const loadedState = { state: "loaded", value: result };

          cacheValue(createResourceCache(loadedState, parameters));
          updateValue(loadedState);
        },
        (error) => updateValue({ state: "failed", value: error })
      );
    },
    dependencies
  );

  return Object.assign(value, {
    dispose() {
      disposeEffect();
      disposeState();
      disposeCache();
    },
  });
};
