const GETTER = Symbol("moru:getter");
const CONTEXT = Symbol("moru:context");

export const isGetter = (value) => !!value?.[GETTER];
export const isContext = (value) => !!value?.[CONTEXT];
export const immediately = (callback) => callback();

const createContextState = (parent) => ({
  queues: parent?.[CONTEXT].queues ?? new Map(),
  parent,
  effects: parent?.[CONTEXT].effects ?? new Map(),
  disposed: parent?.disposed,
  cleanups: new Map(),
});

const createContextDisposer = (contextState) => {
  const dispose = () => {
    if (contextState.disposed) return;

    contextState.disposed = true;
    contextState.cleanups.forEach(({ dispose }) => dispose());
    contextState.cleanups.clear();
  };

  contextState.parent?.effect(() => dispose, undefined, immediately);

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

        contextState.effects.get(getter)?.forEach(immediately);
      }
    };

    const getter = (map = (value) => value) => map(current);

    getter[GETTER] = GETTER;

    return [getter, setter];
  };

const createEffect =
  (contextState) =>
  (callback, dependencies = [], schedule = queueMicrotask) => {
    if (contextState.disposed) return;

    schedule === immediately ||
      contextState.queues.has(schedule) ||
      contextState.queues.set(schedule, new Set());

    const dispose = () => {
      dependencies.forEach((getter) => {
        const getterDependentEffects = contextState.effects.get(getter);
        getterDependentEffects.delete(scheduleEffect);
        getterDependentEffects.size || contextState.effects.delete(getter);
      });
      contextState.queues.get(schedule)?.delete(effect);
      contextState.cleanups.get(effect)();
      contextState.cleanups.delete(effect);
    };

    const effect = () => {
      contextState.cleanups.get(effect)?.();

      const clear = callback();
      const cleanup = () =>
        typeof clear?.then === "function"
          ? clear.then((fn) => fn?.())
          : clear?.();

      cleanup.dispose = dispose;

      contextState.cleanups.set(effect, cleanup);
    };

    const scheduleEffect = () => {
      if (schedule === immediately) return effect();

      const queue = contextState.queues.get(schedule);
      const shouldSchedule = !queue.size;

      queue.add(effect);

      shouldSchedule &&
        schedule(() => queue.forEach((fn) => (fn(), queue.delete(fn))));
    };

    dependencies.forEach(
      (getter) =>
        contextState.effects.get(getter)?.add(scheduleEffect) ??
        contextState.effects.set(getter, new Set().add(scheduleEffect)),
    );

    scheduleEffect();
  };

export const context = (parent) => {
  const contextState = createContextState(parent);

  return {
    state: createState(contextState),
    effect: createEffect(contextState),
    parent,
    dispose: createContextDisposer(contextState),
    [CONTEXT]: contextState,
    get disposed() {
      return contextState.disposed;
    },
  };
};
