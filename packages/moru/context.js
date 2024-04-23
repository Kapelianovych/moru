const GETTER = Symbol("moru:getter");
const CONTEXT = Symbol("moru:context");

export const immediately = (callback) => callback();

export const isGetter = (value) =>
  value && typeof value === "function" && GETTER in value;

export const isContext = (value) =>
  value && typeof value === "object" && CONTEXT in value;

const createContextState = (parent) => ({
  parent,
  disposed: false,
  queues: parent?.queues ?? new Map(),
  effects: parent?.effects ?? new Map(),
  cleanups: new Map(),
});

const createContextDisposer = (contextState) => {
  const dispose = () => {
    if (contextState.disposed) return;

    contextState.disposed = true;
    if (!contextState.parent) {
      contextState.queues.clear();
      contextState.effects.clear();
    }
    contextState.cleanups.forEach(({ dispose }) => dispose());
    contextState.cleanups.clear();
  };

  contextState.parent?.effect(() => dispose);

  return dispose;
};

const createState =
  (contextState) =>
  (current, equals = Object.is) => {
    const setter = (mapOrValue) => {
      const next =
        typeof mapOrValue === "function" ? mapOrValue(current) : mapOrValue;

      if (!equals(current, next)) {
        current = next;

        if (contextState.disposed) return;

        contextState.effects.get(state)?.forEach(immediately);
      }
    };

    const getter = (map = (value) => value) => map(current);

    getter[GETTER] = null;

    return [getter, setter];
  };

const createEffect =
  (contextState) =>
  (
    callback,
    dependencies = [],
    schedule = self.requestIdleCallback ?? setTimeout,
  ) => {
    if (contextState.disposed) return;

    if (!contextState.queues.has(schedule))
      contextState.queues.set(schedule, new Set());

    const dispose = () => {
      dependencies.forEach((state) =>
        contextState.effects.get(state).delete(scheduleEffect),
      );
      contextState.queues.get(schedule).delete(effect);
      contextState.cleanups.get(effect)();
      contextState.cleanups.delete(effect);
    };

    const effect = () => {
      contextState.cleanups.get(effect)?.();

      const clear = callback();

      const cleanup = () =>
        clear instanceof Promise ? clear.then((fn) => fn?.()) : clear?.();

      cleanup.dispose = dispose;

      contextState.cleanups.set(effect, cleanup);
    };

    const scheduleEffect = () => {
      const queue = contextState.queues.get(schedule);

      const shouldSchedule = !queue.size;

      queue.add(effect);

      if (shouldSchedule)
        schedule(() => queue.forEach((fn) => (fn(), queue.delete(fn))));
    };

    dependencies.forEach(
      (state) =>
        contextState.effects.get(state)?.add(scheduleEffect) ??
        contextState.effects.set(state, new Set().add(scheduleEffect)),
    );

    scheduleEffect();
  };

export const context = (parent) => {
  const contextState = createContextState(parent);

  return {
    state: createState(contextState),
    effect: createEffect(contextState),
    dispose: createContextDisposer(contextState),
    [CONTEXT]: null,
    get parent() {
      return contextState.parent;
    },
    get disposed() {
      return contextState.disposed;
    },
  };
};
