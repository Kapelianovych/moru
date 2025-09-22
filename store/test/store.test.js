import { equal } from "node:assert/strict";
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

  test("subscription should be called when a stored value is updated", () => {
    const fn = mock.fn();
    const state = store(1);

    state.subscribe(fn);

    equal(fn.mock.callCount(), 0);

    state.set(2);

    equal(fn.mock.callCount(), 1);
    equal(fn.mock.calls[0].arguments[0], 2);
  });

  test("subscription function returned by the subscribe method should remove the subscriber", () => {
    const fn = mock.fn();
    const state = store(1);

    const unsubscribe = state.subscribe(fn);

    unsubscribe();

    state.set(2);

    equal(fn.mock.callCount(), 0);
  });

  test("store can register a function which will be called when last subscriber is unsubscribed", () => {
    const dispose = mock.fn();
    const state = store(1);

    const unsubscribe = state.subscribe(() => {});

    state.registerDispose(dispose);

    unsubscribe();

    equal(dispose.mock.callCount(), 1);
  });

  test("when last subscriber is unsubscribed internal value becomes the initial one", () => {
    const state = store(1);
    const unsubscribe = state.subscribe(() => {});

    state.set(2);
    equal(state.get(), 2);

    unsubscribe();
    equal(state.get(), 1);
  });
});
