const GETTER = Symbol("context:getter");

export const isGetter = (value) =>
  typeof value === "function" && GETTER in value;

const whenIdle =
  globalThis.requestIdleCallback ?? ((callback) => setTimeout(callback, 1));

const stopIdle = globalThis.cancelIdleCallback ?? clearTimeout;

const run = (queue) =>
  queue.forEach((effect) => {
    effect();
    queue.delete(effect);
  });

const createScheduler = () => {
  let stopped, relaxedTimer, urgentEffectsScheduled;

  const relaxedEffectsQueue = new Set(),
    urgentEffectsQueue = new Set();

  return {
    add(effect) {
      if (stopped) return;

      (effect.urgent ? urgentEffectsQueue : relaxedEffectsQueue).add(effect);
    },
    stop() {
      stopped = true;
      relaxedTimer && stopIdle(relaxedTimer);
      relaxedEffectsQueue.clear();
      urgentEffectsQueue.clear();
    },
    remove(effect) {
      relaxedEffectsQueue.delete(effect);
      urgentEffectsQueue.delete(effect);
    },
    schedule() {
      if (stopped) return;

      if (urgentEffectsQueue.size && !urgentEffectsScheduled) {
        urgentEffectsScheduled = true;

        queueMicrotask(() => {
          // Microtasks can't be canceled so we have to check if the scope
          // is not disposed when it's time for them to execute.
          if (!stopped) run(urgentEffectsQueue);
          urgentEffectsScheduled = false;
        });
      }

      if (relaxedEffectsQueue.size)
        relaxedTimer ??= whenIdle(() => {
          run(relaxedEffectsQueue);
          relaxedTimer = null;
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

const createContextDisposer = (contextState) => () => {
  contextState.disposed = true;
  contextState.scheduler.stop();
  contextState.effects.clear();
  contextState.cleanups.forEach((clean) => clean());
  contextState.cleanups.clear();
  contextState.cache.clear();
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

          contextState.effects.get(getter)?.forEach(contextState.scheduler.add);

          contextState.scheduler.schedule();
        }
      },
      () => {
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
        clear instanceof Promise ? clear.then((fn) => fn?.()) : clear?.()
      );
    };

    dependencies.forEach((dependency) =>
      contextState.effects.set(
        dependency,
        contextState.effects.get(dependency)?.add(effect) ?? new Set([effect])
      )
    );

    execute(effect);

    return () => {
      dependencies.forEach((dependency) =>
        contextState.effects.get(dependency)?.delete(effect)
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
  };
};
