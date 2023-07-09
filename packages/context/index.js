const GETTER = Symbol("context:getter");

export const isGetter = (value) =>
  typeof value === "function" && GETTER in value;

const whenIdle =
  globalThis.requestIdleCallback ?? ((callback) => setTimeout(callback, 1));

const stopIdle = globalThis.cancelIdleCallback ?? clearTimeout;

const createScheduler = () => {
  let stopped, timer;

  const queue = new Set();

  return {
    add(effect) {
      if (stopped) return;

      queue.add(effect);
    },
    stop() {
      stopped = true;
      timer && stopIdle(timer);
      queue.clear();
    },
    remove(effect) {
      queue.delete(effect);
    },
    schedule() {
      if (stopped) return;

      if (queue.size)
        timer ??= whenIdle(() => {
          queue.forEach((effect) => {
            effect();
            queue.delete(effect);
          });
          timer = null;
        });
    },
  };
};

const createContextState = () => ({
  disposed: false,
  cache: new Map(),
  effects: new Map(),
  cleanups: new Map(),
  scheduler: createScheduler(),
});

const createContextDisposer = (contextState) => {
  const listeners = new Set();

  return Object.assign(
    () => {
      if (contextState.disposed) return;

      contextState.disposed = true;
      contextState.scheduler.stop();
      contextState.effects.clear();
      contextState.cleanups.forEach((clean) => clean());
      contextState.cleanups.clear();
      contextState.cache.clear();
      listeners.forEach((fn) => fn());
      listeners.clear();
    },
    {
      on(listen) {
        !contextState.disposed && listeners.add(listen);
      },
    },
  );
};

const createStateHook =
  (contextState) =>
  (current, { equals = Object.is } = {}) => {
    let stateDisposed = contextState.disposed;
    const initial = current;

    const getter = Object.assign(() => current, { [GETTER]: null });

    return [
      getter,
      (map) => {
        const next = typeof map === "function" ? map(current) : map;

        if (!equals(current, next)) {
          current = next;

          if (contextState.disposed || stateDisposed) return;

          contextState.effects
            .get(getter)
            ?.forEach((effect) =>
              effect.urgent ? effect() : contextState.scheduler.add(effect),
            );

          contextState.scheduler.schedule();
        }
      },
      () => {
        if (stateDisposed) return;

        stateDisposed = true;
        contextState.effects.get(getter)?.forEach((effect) => {
          contextState.scheduler.remove(effect);
          contextState.cleanups.get(effect)?.();
          contextState.cleanups.delete(effect);
        });
        contextState.effects.delete(getter);
        current = initial;
      },
    ];
  };

const createEffectHook =
  (contextState, execute) =>
  (callback, dependencies = []) => {
    if (contextState.disposed) return () => {};

    const effect = () => {
      contextState.cleanups.get(effect)?.();

      const clear = callback(...dependencies.map((dependency) => dependency()));

      contextState.cleanups.set(effect, () =>
        clear instanceof Promise ? clear.then((fn) => fn?.()) : clear?.(),
      );
    };

    dependencies.forEach((dependency) =>
      contextState.effects.set(
        dependency,
        contextState.effects.get(dependency)?.add(effect) ?? new Set([effect]),
      ),
    );

    execute(effect);

    return () => {
      dependencies.forEach((dependency) =>
        contextState.effects.get(dependency)?.delete(effect),
      );
      contextState.scheduler.remove(effect);
      contextState.cleanups.get(effect)?.();
      contextState.cleanups.delete(effect);
    };
  };

const createCacheHook = (contextState) => (key, value) => {
  let cacheDisposed = contextState.disposed;
  const initial = value;

  if (!cacheDisposed)
    contextState.cache.has(key)
      ? (value = contextState.cache.get(key))
      : contextState.cache.set(key, value);

  return [
    () => value,
    (map) => {
      value = typeof map === "function" ? map(value) : map;

      if (contextState.disposed || cacheDisposed) return;

      contextState.cache.set(key, value);
    },
    () => {
      if (cacheDisposed) return;

      cacheDisposed = true;
      contextState.cache.delete(key);
      value = initial;
    },
  ];
};

export const createContext = () => {
  const contextState = createContextState();

  return {
    dispose: createContextDisposer(contextState),
    useCache: createCacheHook(contextState),
    createState: createStateHook(contextState),
    createEffect: createEffectHook(contextState, (effect) => {
      contextState.scheduler.add(effect);
      contextState.scheduler.schedule();
    }),
    createUrgentEffect: createEffectHook(contextState, (effect) => {
      effect.urgent = true;
      effect();
    }),
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
  const listeners = new Set();

  const dispose = Object.assign(
    () => {
      if (childContextState.disposed) return;

      childContextState.disposed = true;
      childContextState.disposes.forEach((dispose) => dispose());
      childContextState.disposes.clear();
      listeners.forEach((fn) => fn());
      listeners.clear();
    },
    {
      on(listen) {
        !childContextState.disposed && listeners.add(listen);
      },
    },
  );

  childContextState.parent.dispose.on(dispose);

  return dispose;
};

const createDerivedWritableHook =
  (name, childContextState) =>
  (...parameters) => {
    const tuple = childContextState.parent[name](...parameters);

    childContextState.disposed
      ? tuple[2]()
      : childContextState.disposes.add(tuple[2]);

    return tuple;
  };

const createDerivedEffectHook =
  (name, childContextState) =>
  (...parameters) => {
    const dispose = childContextState.parent[name](...parameters);

    childContextState.disposed
      ? dispose()
      : childContextState.disposes.add(dispose);

    return dispose;
  };

export const createChildContext = (parent) => {
  const childContextState = createChildContextState(parent);

  return {
    dispose: createChildContextDisposer(childContextState),
    useCache: createDerivedWritableHook("useCache", childContextState),
    createState: createDerivedWritableHook("createState", childContextState),
    createEffect: createDerivedEffectHook("createEffect", childContextState),
    createUrgentEffect: createDerivedEffectHook(
      "createUrgentEffect",
      childContextState,
    ),
    get parent() {
      return childContextState.parent;
    },
    get disposed() {
      return childContextState.disposed;
    },
  };
};
