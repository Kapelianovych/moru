import { equal, deepEqual } from "node:assert/strict";
import { suite, test, mock } from "node:test";

import {
  combine,
  distinct,
  filter,
  flatMap,
  forEach,
  map,
  store,
} from "../src/index.js";

suite("operators", () => {
  test("map should change value", () => {
    const foo = store(1);
    const bar = map(foo, (number) => {
      return number + 1;
    });

    equal(bar.get(), 2);

    foo.set(3);

    equal(bar.get(), 4);
  });

  test("filter should use initialValue when predicate returns false on creation", () => {
    const foo = store(1);
    const bar = filter(
      foo,
      (number) => {
        return number % 2 === 0;
      },
      4,
    );

    equal(bar.get(), 4);
  });

  test("filter should use value from target when predicate returns true on creation", () => {
    const foo = store(2);
    const bar = filter(
      foo,
      (number) => {
        return number % 2 === 0;
      },
      4,
    );

    equal(bar.get(), 2);
  });

  test("filter should use undefined when predicate returns false on creation and no initialValue provided", () => {
    const foo = store(1);
    const bar = filter(foo, (number) => {
      return number % 2 === 0;
    });

    equal(bar.get(), undefined);
  });

  test("filter should pass values for which predicate returns true", () => {
    const foo = store(1);
    const bar = filter(
      foo,
      (number) => {
        return number % 2 === 0;
      },
      2,
    );

    foo.set(3);
    equal(bar.get(), 2);

    foo.set(4);
    equal(bar.get(), 4);
  });

  test("flatMap should flatten returned by callback store and pass its value", () => {
    const foo = store(1);
    const bar = flatMap(foo, (number) => {
      return store(number + 1);
    });

    equal(bar.get(), 2);
  });

  test("distinct should pass value only when it is not equal to the previous one", () => {
    const foo = store(1);
    const bar = distinct(foo);
    const fn = mock.fn();

    bar.subscribe(fn);

    foo.set(2);
    equal(fn.mock.callCount(), 1);
    fn.mock.resetCalls();

    foo.set(2);
    equal(fn.mock.callCount(), 0);
  });

  test("combine should collect values into an array and pass it further", () => {
    const foo1 = store(1);
    const foo2 = store("a");
    const bar = combine([foo1, foo2]);

    deepEqual(bar.get(), [1, "a"]);
  });

  test("forEach should call callback on every new value", () => {
    const foo = store(1);
    const callback = mock.fn();

    forEach(foo, callback);

    foo.set(2);

    equal(callback.mock.callCount(), 1);
  });

  test("forEach should return an unsubscribe function", () => {
    const foo = store(1);
    const callback = mock.fn();

    const stop = forEach(foo, callback);

    stop();

    foo.set(2);
    equal(callback.mock.callCount(), 0);
  });
});
