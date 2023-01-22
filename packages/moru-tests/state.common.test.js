import { expect, test, vi } from "vitest";
import {
  onError,
  useFree,
  useState,
  useEffect,
  useImmediateEffect,
} from "moru";

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

test("onError should catch errors", async () => {
  const errorHandler = vi.fn();

  useEffect(() => {
    onError(errorHandler);

    useEffect(() => {
      throw "error";
    });
  });

  await runTask(() => {
    expect(errorHandler).toBeCalled();
    expect(errorHandler).toBeCalledWith("error");
  });
});

test("onError should catch errors on the same effect level", async () => {
  const errorHandler = vi.fn();

  useEffect(() => {
    onError(errorHandler);

    throw "error";
  });

  await runTask(() => {
    expect(errorHandler).toBeCalled();
    expect(errorHandler).toBeCalledWith("error");
  });
});

test("useImmediateEffect immediately executes its parameter", () => {
  const fn = vi.fn();

  useImmediateEffect(fn);

  expect(fn).toBeCalled();
});

test("useImmediateEffect autodetects dependencies as the useEffect", async () => {
  const [a, setA] = useState("");

  const callback = vi.fn(() => {
    a();
  });

  useImmediateEffect(callback);

  setA("foo");

  expect(callback).toBeCalledTimes(1);

  await runTask(() => {
    expect(callback).toHaveBeenCalledTimes(2);
  });
});

test("useImmediateEffect registers a cleanup like the useEffect", async () => {
  const [a, setA] = useState("");

  const cleanup = vi.fn();

  useImmediateEffect(() => {
    a();

    return cleanup;
  });

  setA("foo");

  await runTask(() => {
    expect(cleanup).toHaveBeenCalled();
  });
});
