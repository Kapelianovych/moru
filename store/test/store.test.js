import { ok, equal } from "node:assert/strict";
import { suite, test, mock } from "node:test";

import { store } from "../src/index.js";

suite("store", () => {
  test("get method should return a stored value", () => {
    const state = store(1);

    equal(state.get(), 1);
  });

  test("set method should update a stored value", () => {
    const state = store(1);

    state.set(2);

    equal(state.get(), 2);
  });

  test("hasSubscribers method should state whether there is at least one subscriber of the store", () => {
    const state = store(1);

    state.subscribe(() => {});

    ok(state.hasSubscribers());
  });

  test("subscription should be called when a stored value is updated", () => {
    const fn = mock.fn();
    const state = store(1);

    state.subscribe(fn);

    equal(fn.mock.callCount(), 0);

    state.set(2);

    equal(fn.mock.callCount(), 1);
    equal(fn.mock.calls[0].arguments[0], 2);
  });

  test("unsubscribe function remove the subscriber", () => {
    const fn = mock.fn();
    const state = store(1);

    state.subscribe(fn);
    state.unsubscribe(fn);

    state.set(2);

    equal(fn.mock.callCount(), 0);
  });

  test("subscription function returned by the subscribe method should remove the subscriber", () => {
    const fn = mock.fn();
    const state = store(1);

    const unsubscribe = state.subscribe(fn);

    unsubscribe();

    state.set(2);

    equal(fn.mock.callCount(), 0);
  });

  test("supplied comparator can change the way values are compared", () => {
    const state1 = store({ foo: 1 });
    const state2 = store(
      { foo: 1 },
      ({ foo: foo1 }, { foo: foo2 }) => foo1 === foo2,
    );

    const fn1 = mock.fn();
    const fn2 = mock.fn();

    state1.subscribe(fn1);
    state2.subscribe(fn2);

    state1.set({ foo: 1 });
    state2.set({ foo: 1 });

    equal(fn1.mock.callCount(), 1);
    equal(fn2.mock.callCount(), 0);
  });
});
