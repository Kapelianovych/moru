/**
 * @import { Mock } from "node:test";
 *
 * @import { Comparator } from "../src/index.js";
 */

import { equal, deepEqual } from "node:assert/strict";
import { suite, test, mock } from "node:test";

import { store, computed } from "../src/index.js";

suite("computed", () => {
  test("should not initialise internal value on creation", () => {
    const foo = store(1);
    const computation = mock.fn((_, foo) => {
      return foo * 2;
    });
    const doubledFoo = computed([foo], computation);

    equal(doubledFoo.get(), undefined);
    equal(computation.mock.callCount(), 0);
  });

  test("should initialise internal value on first subscription", () => {
    const foo = store(1);
    const computation = mock.fn((_, foo) => {
      return foo * 2;
    });
    const doubledFoo = computed([foo], computation);
    const subscriber = mock.fn();
    doubledFoo.subscribe(subscriber);
    const subscriber2 = mock.fn();
    doubledFoo.subscribe(subscriber2);

    equal(doubledFoo.get(), 2);
    equal(subscriber.mock.callCount(), 0);
    equal(subscriber2.mock.callCount(), 0);
    equal(computation.mock.callCount(), 1);
  });

  test("should initialise internal value on dependency update", () => {
    const foo = store(1);
    const computation = mock.fn((_, foo) => {
      return foo * 2;
    });
    const doubledFoo = computed([foo], computation);
    const subscriber = mock.fn();
    doubledFoo.subscribe(subscriber);

    foo.set(2);

    equal(doubledFoo.get(), 4);
    equal(subscriber.mock.callCount(), 1);
    equal(computation.mock.callCount(), 2);
  });

  test("should stop updating internal value with no subscribers", () => {
    const foo = store(1);
    const computation = mock.fn((_, foo) => {
      return foo * 2;
    });
    const doubledFoo = computed([foo], computation);
    const subscriber = mock.fn();
    const unsubscribe = doubledFoo.subscribe(subscriber);

    foo.set(2);
    unsubscribe();
    foo.set(3);

    equal(doubledFoo.get(), 4);
    equal(subscriber.mock.callCount(), 1);
    equal(computation.mock.callCount(), 2);
  });

  test("should update internal value with direct update", () => {
    const foo = store(1);
    const computation = mock.fn((_, foo) => {
      return foo * 2;
    });
    const doubledFoo = computed([foo], computation);
    const subscriber = mock.fn();
    doubledFoo.subscribe(subscriber);

    doubledFoo.set(5);

    equal(doubledFoo.get(), 5);
    equal(subscriber.mock.callCount(), 1);
    equal(computation.mock.callCount(), 1);
  });

  test("should allow to compare computed results", () => {
    const foo = store(1);
    const computation = mock.fn((_, foo) => {
      return { value: foo * 2 };
    });
    /** @type {Mock<Comparator<{ value: number }>>} */
    const comparator = mock.fn(
      (previous, next) => previous?.value === next.value,
    );
    const doubledFoo = computed([foo], computation, comparator);
    const subscriber = mock.fn();
    doubledFoo.subscribe(subscriber);

    foo.set(2);

    deepEqual(doubledFoo.get(), { value: 4 });
    equal(subscriber.mock.callCount(), 1);
    equal(computation.mock.callCount(), 2);
    equal(comparator.mock.callCount(), 2);
  });
});
