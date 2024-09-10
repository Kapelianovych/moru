import { _, isDev } from "./environment.js";
import { createSubscription, unwrapIfState } from "./state.js";

export class Consumer {
  static of(target, property) {
    if (target instanceof Consumer) {
      return target;
    } else {
      const isOneTimeSubscription = property === undefined;

      // Since the Consumer is exposed and can be explicitly used to wrap
      // a state, the latter can be taken from any place. So it can be a proxied
      // state. In that case, we want to obtain the original state object.
      target = unwrapIfState(target);

      return new Consumer((callback, view, schedule) => {
        if (view) {
          if (isOneTimeSubscription)
            view.$environment.scheduler.schedule(
              () => callback(target),
              schedule,
            );
          else {
            if (isDev && !target?.constructor?.$state) {
              throw new Error(
                `Detected an attempt to subscribe to the "${property}" property of a state without the state reference.`,
              );
            }

            createSubscription(target, property, callback, view, schedule)();
          }
        } else callback(isOneTimeSubscription ? target : target[property]);
      });
    }
  }

  constructor(run) {
    this.run = run;
  }

  map(transform) {
    return new Consumer((callback, view, schedule) =>
      this.run((value) => callback(transform(value)), view, schedule),
    );
  }

  filter(predicate) {
    return new Consumer((callback, view, schedule) =>
      this.run((value) => predicate(value) && callback(value), view, schedule),
    );
  }

  and(consumer, value1 = _, value2 = _) {
    consumer = Consumer.of(consumer);

    return new Consumer((callback, view, schedule) => {
      this.run(
        (value) => {
          if (value2 === _) value2 = consumer.get();

          callback([(value1 = value), value2].flat());
        },
        view,
        schedule,
      );
      consumer.run(
        (value) => {
          if (value1 === _) value1 = this.get();

          callback([value1, (value2 = value)].flat());
        },
        view,
        schedule,
      );
    });
  }

  or(consumer, shouldTryOther) {
    consumer = Consumer.of(consumer);

    return new Consumer((callback, view, schedule) => {
      this.run(
        (value) => callback(shouldTryOther?.(value) ? consumer.get() : value),
        view,
        schedule,
      );
      consumer.run(
        (value) => callback(shouldTryOther?.(value) ? this.get() : value),
        view,
        schedule,
      );
    });
  }

  get() {
    let result;

    this.run((value) => {
      result = value;
    });

    return result;
  }
}
