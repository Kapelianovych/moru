const GETTER = Symbol("context:getter");

const whenIdle =
  globalThis.requestIdleCallback ?? ((callback) => setTimeout(callback, 1));

const stopIdle = globalThis.cancelIdleCallback ?? clearTimeout;

const registerEffect = (effects, cleanups, callback, dependencies) => {
  const effect = () => {
    cleanups.get(effect)?.();

    const clear = callback(...dependencies.map((dependency) => dependency()));

    cleanups.set(effect, () =>
      clear instanceof Promise ? clear.then((fn) => fn?.()) : clear?.()
    );
  };

  dependencies.forEach((dependency) =>
    effects.set(
      dependency,
      effects.get(dependency)?.add(effect) ?? new Set([effect])
    )
  );

  return effect;
};

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

export const createContext = () => {
  let disposed;

  const states = new Map(),
    effects = new Map(),
    cleanups = new Map(),
    scheduler = createScheduler();

  return {
    dispose() {
      disposed = true;
      scheduler.stop();
      effects.clear();
      cleanups.forEach((clean) => clean());
      cleanups.clear();
      states.clear();
    },
    createState(initial, { equals = Object.is } = {}) {
      if (disposed)
        return [
          // Even with disposed context this function has to be
          // recognisable as getter and not a regular function.
          Object.assign(() => initial, { [GETTER]: null }),
          () => {},
          () => {},
        ];

      let stateDisposed;

      const id = Symbol("context:state");

      states.set(id, initial);

      const getter = Object.assign(
        () => (stateDisposed ? initial : states.get(id)),
        { [GETTER]: null }
      );

      return [
        getter,
        (map) => {
          if (disposed || stateDisposed) return;

          const current = getter();

          const next = typeof map === "function" ? map(current) : map;

          if (!equals(current, next)) {
            states.set(id, next);

            effects.get(getter)?.forEach(scheduler.add);

            scheduler.schedule();
          }
        },
        () => {
          stateDisposed = true;
          effects.get(getter)?.forEach((effect) => {
            scheduler.remove(effect);
            cleanups.get(effect)?.();
            cleanups.delete(effect);
          });
          effects.delete(getter);
          states.delete(id);
        },
      ];
    },
    createEffect(callback, dependencies = []) {
      if (disposed) return () => {};

      const effect = registerEffect(effects, cleanups, callback, dependencies);

      scheduler.add(effect);

      scheduler.schedule();

      return () => {
        dependencies.forEach((dependency) =>
          effects.get(dependency)?.delete(effect)
        );
        scheduler.remove(effect);
        cleanups.get(effect)?.();
        cleanups.delete(effect);
      };
    },
    createUrgentEffect(callback, dependencies = []) {
      if (disposed) return () => {};

      const effect = registerEffect(effects, cleanups, callback, dependencies);

      effect.urgent = true;

      effect();

      return () => {
        dependencies.forEach((dependency) =>
          effects.get(dependency)?.delete(effect)
        );
        scheduler.remove(effect);
        cleanups.get(effect)?.();
        cleanups.delete(effect);
      };
    },
  };
};

export const isGetter = (value) =>
  typeof value === "function" && GETTER in value;
