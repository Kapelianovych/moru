import { expect, test, vi } from "vitest";
import { useEffect, useFree, useMemo, useState } from "moru";

import { runMicrotask, runTask } from "./scheduling.js";

test("useState has to return a tuple with a getter and a setter function", () => {
  const result = useState();

  expect(result).toBeInstanceOf(Array);
  expect(result.length).toBe(2);
  expect(result[0]).toBeTypeOf("function");
  expect(result[1]).toBeTypeOf("function");
});

test("useState's getter function has to return the initial value of the state", () => {
  const [value] = useState("initial");

  expect(value()).toMatch("initial");
});

test("useState's setter function has to change the state's value", () => {
  const [value, setValue] = useState("initial");

  setValue("second value");

  expect(value()).toMatch("second value");
});

test("equals function passed to the useState has to prevent updating the state if the result is true", () => {
  const [value, setValue] = useState(0, {
    equals: (previous, next) => previous === next || previous * 2 === next,
  });

  setValue(2);

  expect(value()).toBe(2);

  setValue(4);

  expect(value()).toBe(2);
});

test("useEffect has to defer calling a callback to a microtask", async () => {
  const callback = vi.fn();

  useEffect(callback);

  expect(callback).not.toBeCalled();

  await runMicrotask(() => expect(callback).toBeCalled());
});

test("useEffect has to track a state's getter call and rerun the callback when the state is changed", async () => {
  const [value, setValue] = useState(1);

  const callback = vi.fn(() => {
    value();
  });

  useEffect(callback);

  await runMicrotask(() => expect(callback).toBeCalledTimes(1));

  await runMicrotask(() => setValue(2));

  await runTask(() => expect(callback).toBeCalledTimes(2));
});

test("a state setter has to defer updating dependent effects by default", async () => {
  const [value, setValue] = useState(1);

  const callback = vi.fn(() => {
    value();
  });

  useEffect(callback);

  await runMicrotask(() => {
    setValue(2);
    expect(callback).toBeCalledTimes(1);
  });

  await runTask(() => expect(callback).toBeCalledTimes(2));
});

test("useEffect has to register and call a cleanup function when it reexecutes the callback", async () => {
  const [value, setValue] = useState(0);

  const cleanup = vi.fn();

  const callback = vi.fn(() => {
    value();

    return cleanup;
  });

  useEffect(callback);

  await runMicrotask(() => {
    setValue(1);
  });

  await runTask(() => {
    expect(cleanup).toBeCalled();
  });
});

test("useEffect has to register a state usage from an executed code part", async () => {
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);

  const callback = vi.fn(() => {
    a();

    if (1 > 2) b();
  });

  useEffect(callback);

  await runMicrotask(() => setA(2));

  await runTask(() => expect(callback).toBeCalledTimes(2));

  await runMicrotask(() => setB(2));

  await runTask(() => expect(callback).toBeCalledTimes(2));
});

test("useMemo has to return a single getter function which returns a result of a callback", () => {
  const a = useMemo(() => 1);

  expect(a).toBeTypeOf("function");
  expect(a()).toBe(1);
});

test("useMemo has to track used state getters and rerun a computation if one of dependencies changes", async () => {
  const [a, setA] = useState(1);

  const callback = vi.fn(() => a() + 1);

  const b = useMemo(callback);

  setA(2);

  await runTask(() => {
    expect(callback).toBeCalledTimes(2);
    expect(b()).toBe(3);
  });
});

test("useMemo's callback receives a previous value as an argument", async () => {
  const [a, setA] = useState(1);

  const callback = vi.fn((previous = 0) => previous + a() + 1);

  const b = useMemo(callback);

  expect(callback).toBeCalledWith(undefined);

  setA(2);

  await runTask(() => {
    expect(callback).toBeCalledWith(2);
    expect(b()).toBe(5);
  });
});

test("useMemo receives an equals function that updates the internal value only if the comparator returns false", async () => {
  const [a, setA] = useState(1);

  const callback = vi.fn(() => a() + 1);

  const b = useMemo(callback, {
    equals: (previous, next) => previous + 1 === next,
  });

  setA(2);

  await runTask.empty();

  expect(b()).toBe(2);

  setA(3);

  await runTask.empty();

  expect(b()).toBe(4);
});

test("an update of two different states in the same task has to cause rerunning dependent effect only once", async () => {
  const [a, setA] = useState(8);
  const [b, setB] = useState(8);

  const callback = vi.fn(() => {
    a();
    b();
  });

  useEffect(callback);

  await runMicrotask(() => {
    setA(0);
    setB(2);
  });

  await runTask(() => expect(callback).toBeCalledTimes(2));
});

test("when two or more batch updates are overlapping and some state setters request to update the same effect, those effects has to be updated only once with newest values from all states", async () => {
  let aResult = 0;

  const [a, setA] = useState(aResult);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);

  const spiedA = vi.fn(a);

  const callback = vi.fn(() => {
    spiedA();
    b();
  });

  useEffect(callback);

  useEffect(() => {
    c();
    setA(++aResult);
  });

  await runMicrotask(() => {
    setC(Math.random());
    setB(Math.random());
  });

  await runTask(() => {
    expect(callback).toBeCalledTimes(3);
    expect(spiedA).toBeCalledTimes(3);
    expect(spiedA).toHaveNthReturnedWith(1, 0);
    expect(spiedA).toHaveNthReturnedWith(2, 1);
    expect(spiedA).toHaveNthReturnedWith(3, 2);
  });
});

test("state setter should reexecute the closest known reactive scopes", async () => {
  const [a] = useState(0);
  const [b, setB] = useState(0);

  const innerCallback = vi.fn(() => b());

  const outerCallback = vi.fn(() => {
    a();
    useEffect(innerCallback);
  });

  useEffect(outerCallback);

  // First effect is executed
  await runMicrotask.empty();

  // Second effect is executed
  await runMicrotask(() => {
    setB(1);
  });

  await runTask(() => {
    expect(innerCallback).toBeCalledTimes(2);
    expect(outerCallback).toBeCalledTimes(1);
  });
});

test("useFree opts out of autotracking", async () => {
  const [value, setValue] = useState(1);

  const callback = vi.fn(() => {
    useFree(value);
  });

  useEffect(callback);

  await runMicrotask(() => {
    setValue(2);
    setValue(3);
    setValue(4);
  });

  await runTask(() => {
    expect(value()).toBe(4);
    expect(callback).toBeCalledTimes(1);
  });
});

test("useFree should return the parameter's result", () => {
  expect(useFree(() => 8)).toBe(8);
});

test("useEffect inside the useFree hook should register all dependencies", async () => {
  const [value, setValue] = useState(1);

  const callback = vi.fn(() => {
    value();
  });

  useFree(() => {
    useEffect(callback);
  });

  await runMicrotask(() => setValue(2));

  await runTask(() => expect(callback).toBeCalledTimes(2));
});
