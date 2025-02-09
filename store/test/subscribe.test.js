import { equal } from "node:assert/strict";
import { suite, test, mock } from "node:test";

import { store, subscribe } from "../src/index.js";

suite("subscribe", () => {
  test("should call an effect on creation", () => {
    const foo = store(1);
    const subscriber = mock.fn();

    subscribe([foo], subscriber);

    equal(subscriber.mock.callCount(), 1);
    equal(subscriber.mock.calls[0].arguments[0], 1);
  });

  test("should call an effect on dependency update", () => {
    const foo = store(1);
    const subscriber = mock.fn();

    subscribe([foo], subscriber);

    foo.set(2);

    equal(subscriber.mock.callCount(), 2);
  });

  test("should not call an effect when subscription was stopped", () => {
    const foo = store(1);
    const subscriber = mock.fn();
    const unsubscribe = subscribe([foo], subscriber);

    unsubscribe();
    foo.set(2);

    equal(subscriber.mock.callCount(), 1);
  });

  test("function returned from an effect should be called before next effect execution", () => {
    const foo = store(1);
    const cleanup = mock.fn();
    const subscriber = mock.fn(() => cleanup);

    subscribe([foo], subscriber);
    foo.set(2);

    equal(cleanup.mock.callCount(), 1);
    equal(subscriber.mock.callCount(), 2);
  });

  test("effect can be scheduled to call after some time", () => {
    mock.timers.enable({ apis: ["setTimeout"] });

    const foo = store(1);
    const subscriber = mock.fn();

    subscribe([foo], subscriber, (effect) => setTimeout(effect, 100));

    equal(subscriber.mock.callCount(), 0);
    foo.set(2);
    foo.set(3);
    equal(subscriber.mock.callCount(), 0);

    mock.timers.tick(100);
    equal(subscriber.mock.callCount(), 1);

    mock.timers.reset();
  });

  test("effect won't be called if subscription is stopped earlier", () => {
    mock.timers.enable({ apis: ["setTimeout"] });

    const foo = store(1);
    const subscriber = mock.fn();

    const unsubscribe = subscribe([foo], subscriber, (effect) =>
      setTimeout(effect, 100),
    );

    equal(subscriber.mock.callCount(), 0);

    mock.timers.tick(50);
    unsubscribe();
    mock.timers.tick(100);
    equal(subscriber.mock.callCount(), 0);

    mock.timers.reset();
  });
});
