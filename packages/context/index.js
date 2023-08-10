const GETTER = Symbol("context:getter");

export const isGetter = (value) =>
  typeof value === "function" && GETTER in value;

const createContextState = () => ({
  disposed: false,
  effects: new Map(),
  cleanups: new Map(),
});

const createContextDisposer = (contextState) => () => {
  if (contextState.disposed) return;

  contextState.disposed = true;
  contextState.effects.clear();
  contextState.cleanups.forEach((clean) => clean());
  contextState.cleanups.clear();
};

const createStateHook =
  (contextState) =>
  (current, { equals = Object.is } = {}) => {
    let stateDisposed = contextState.disposed;

    const getter = Object.assign(() => current, { [GETTER]: null });

    return [
      getter,
      (map) => {
        const next = typeof map === "function" ? map(current) : map;

        if (!equals(current, next)) {
          current = next;

          if (contextState.disposed || stateDisposed) return;

          contextState.effects.get(getter)?.forEach((effect) => effect());
        }
      },
      () => {
        if (stateDisposed) return;

        stateDisposed = true;
        contextState.effects.get(getter)?.forEach((effect) => {
          contextState.cleanups.get(effect)?.();
          contextState.cleanups.delete(effect);
        });
        contextState.effects.delete(getter);
      },
    ];
  };

const createEffectHook =
  (contextState) =>
  (callback, dependencies = []) => {
    if (contextState.disposed) return () => {};

    const effect = () => {
      contextState.cleanups.get(effect)?.();

      const clear = callback(...dependencies.map((dependency) => dependency()));

      contextState.cleanups.set(effect, () =>
        clear instanceof Promise ? clear.then((fn) => fn?.()) : clear?.(),
      );
    };

    dependencies.forEach((getter) =>
      contextState.effects.set(
        getter,
        contextState.effects.get(getter)?.add(effect) ?? new Set([effect]),
      ),
    );

    effect();

    return () => {
      dependencies.forEach((getter) =>
        contextState.effects.get(getter)?.delete(effect),
      );
      contextState.cleanups.get(effect)?.();
      contextState.cleanups.delete(effect);
    };
  };

export const createContext = () => {
  const contextState = createContextState();

  return {
    dispose: createContextDisposer(contextState),
    createState: createStateHook(contextState),
    createEffect: createEffectHook(contextState),
    get disposed() {
      return contextState.disposed;
    },
  };
};

const createChildContextState = (parent) => ({
  parent,
  disposes: new Set(),
  disposed: parent.disposed,
});

const createChildContextDisposer = (childContextState) => {
  const dispose = () => {
    if (childContextState.disposed) return;

    childContextState.disposed = true;
    childContextState.disposes.forEach((dispose) => dispose());
    childContextState.disposes.clear();
  };

  childContextState.parent.createEffect(() => dispose);

  return dispose;
};

const createDerivedStateHook = (childContextState) => (value, options) => {
  const tuple = childContextState.parent.createState(value, options);

  childContextState.disposed
    ? tuple[2]()
    : childContextState.disposes.add(tuple[2]);

  return tuple;
};

const createDerivedEffectHook =
  (childContextState) => (callback, dependencies) => {
    const dispose = childContextState.parent.createEffect(
      callback,
      dependencies,
    );

    childContextState.disposed
      ? dispose()
      : childContextState.disposes.add(dispose);

    return dispose;
  };

export const createChildContext = (parent) => {
  const childContextState = createChildContextState(parent);

  return {
    dispose: createChildContextDisposer(childContextState),
    createState: createDerivedStateHook(childContextState),
    createEffect: createDerivedEffectHook(childContextState),
    get parent() {
      return childContextState.parent;
    },
    get disposed() {
      return childContextState.disposed;
    },
  };
};
