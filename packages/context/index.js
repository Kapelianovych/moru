const GETTER = Symbol("context:getter");

export const isGetter = (value) =>
  typeof value === "function" && GETTER in value;

const whenIdle = globalThis.requestIdleCallback ?? setTimeout;

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
        timer ??= whenIdle(
          () =>
            (timer = queue.forEach((effect) => {
              effect();
              queue.delete(effect);
            })),
        );
    },
  };
};

const createContextState = () => ({
  disposed: false,
  effects: new Map(),
  cleanups: new Map(),
  scheduler: createScheduler(),
});

const createContextDisposer = (contextState) => () => {
  if (contextState.disposed) return;

  contextState.disposed = true;
  contextState.scheduler.stop();
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

export const createContext = () => {
  const contextState = createContextState();

  return {
    dispose: createContextDisposer(contextState),
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
  const dispose = () => {
    if (childContextState.disposed) return;

    childContextState.disposed = true;
    childContextState.disposes.forEach((dispose) => dispose());
    childContextState.disposes.clear();
  };

  childContextState.parent.createUrgentEffect(() => dispose);

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
