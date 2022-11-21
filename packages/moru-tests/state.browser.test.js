import { expect, test, vi } from "vitest";
import { useEffect, useMemo, useState } from "moru";

import runInMictotask from "./runInMicrotask.js";

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

  await runInMictotask(() => expect(callback).toBeCalled());
});

test("useEffect has to track a state's getter call and rerun the callback when the state is changed", async () => {
  const [value, setValue] = useState(1);

  const callback = vi.fn(() => {
    value();
  });

  useEffect(callback);

  await runInMictotask(() => {
    setValue(2);
    expect(callback).toBeCalledTimes(1);
  });

  await runInMictotask(() => expect(callback).toBeCalledTimes(2));
});

test("useState's setter function can issue immediate rerun of dependent effects", async () => {
  const [value, setValue] = useState(1);

  const callback = vi.fn(() => {
    value();
  });

  useEffect(callback);

  await runInMictotask(() => {
    setValue(2, { immediate: true });
    expect(callback).toBeCalledTimes(2);
  });
});

test("useEffect has to register and call a cleanup function when it reexecutes the callback", async () => {
  const [value, setValue] = useState(0);

  const cleanup = vi.fn();

  const callback = vi.fn(() => {
    value();

    return cleanup;
  });

  useEffect(callback);

  await runInMictotask(() => {
    setValue(1, { immediate: true });

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

  await runInMictotask(() => setA(2));

  await runInMictotask(() => expect(callback).toBeCalledTimes(2));

  await runInMictotask(() => setB(2));

  await runInMictotask(() => expect(callback).toBeCalledTimes(2));
});

test("useMemo has to return a single getter function which returns a result of a callback", () => {
  const a = useMemo(() => 1);

  expect(a).toBeTypeOf("function");
  expect(a()).toBe(1);
});

test("useMemo has to track used state getters and rerun a computation if one of dependencies changes", () => {
  const [a, setA] = useState(1);

  const callback = vi.fn(() => a() + 1);

  const b = useMemo(callback);

  setA(2, { immediate: true });

  expect(callback).toBeCalledTimes(2);
  expect(b()).toBe(3);
});

test("useMemo's callback receives a previous value as an argument", () => {
  const [a, setA] = useState(1);

  const callback = vi.fn((previous = 0) => previous + a() + 1);

  const b = useMemo(callback);

  expect(callback).toBeCalledWith(undefined);

  setA(2, { immediate: true });

  expect(callback).toBeCalledWith(2);
  expect(b()).toBe(5);
});

test("useMemo receives an equals function that updates the internal value only if the comparator returns false", () => {
  const [a, setA] = useState(1);

  const callback = vi.fn(() => a() + 1);

  const b = useMemo(callback, {
    equals: (previous, next) => previous + 1 === next,
  });

  setA(2, { immediate: true });

  expect(b()).toBe(2);

  setA(3, { immediate: true });

  expect(b()).toBe(4);
});