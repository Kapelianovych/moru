import { useState } from "moru";
import { test, expect, vi } from "vitest";

test("native tags has to be rendered into native DOM elements", () => {
  const paragraph = <p></p>;

  expect(paragraph).toBeInstanceOf(HTMLParagraphElement);
});

test("jsx has to attach attributes", () => {
  const div = <div id="root"></div>;

  expect(div.getAttribute("id")).toMatch("root");
});

test("jsx has to handle attributes with a dash", () => {
  const div = <div data-id="uuid" aria-label="empty"></div>;

  expect(div.getAttribute("data-id")).toMatch("uuid");
  expect(div.getAttribute("aria-label")).toMatch("empty");
});

test("a boolean value passed to the attribute either include the attribute or remove it from an element", () => {
  const div = <div aria-readonly={true} disabled={false}></div>;

  expect(div.hasAttribute("aria-readonly")).toBe(true);
  expect(div.getAttribute("aria-readonly")).toBe("");
  expect(div.hasAttribute("disabled")).toBe(false);
});

test("function passed to an attribute causes an update of the attribute's value if any state used inside is updated", () => {
  const [a, setA] = useState(1);

  const div = <div id={() => a()}></div>;

  expect(div.getAttribute("id")).toBe("1");

  setA(2, { immediate: true });

  expect(div.getAttribute("id")).toBe("2");
});

test("class attribute can have a strings array value", () => {
  const div = <div class={["foo", "baz"]}></div>;

  expect(div.getAttribute("class")).toMatch("foo baz");
});

test("array value of the class attribute can have objects whose keys are classes and values determines whether the key will be added", () => {
  const div = <div class={[{ foo: false, bar: true }]}></div>;

  expect(div.getAttribute("class")).toMatch("bar");
});

test("object's values can be functions which are executed in a reactive context and add/remove classes when a state's value is updated", () => {
  const [yes, setYes] = useState(false);

  const div = <div class={[{ foo: () => yes() }]}></div>;

  expect(div.getAttribute("class")).toMatch("");

  setYes(true, { immediate: true });

  expect(div.getAttribute("class")).toMatch("foo");
});

test("strings and object can be mixed in class value", () => {
  const [yes, setYes] = useState(false);

  const div = <div class={["bar", { foo: () => yes() }]}></div>;

  expect(div.getAttribute("class")).toMatch("bar");

  setYes(true, { immediate: true });

  expect(div.getAttribute("class")).toMatch("bar foo");
});

test("style attribute can have an object as a value whose keys are CSS properties and values are their respective values", () => {
  const div = <div style={{ display: "flex", "align-items": "center" }}></div>;

  expect(div.getAttribute("style")).toMatch(
    "display: flex; align-items: center;"
  );
});

test("a function as the value of style's property causes value's update if any used state is changed", () => {
  const [a, setA] = useState("flex");

  const div = <div style={{ display: () => a() }}></div>;

  expect(div.getAttribute("style")).toMatch("display: flex;");

  setA("block", { immediate: true });

  expect(div.getAttribute("style")).toMatch("display: block;");
});

test("ref attribute executes callback value with a reference to a DOM node", () => {
  let ref;

  <div ref={(node) => (ref = node)}></div>;

  expect(ref).toBeInstanceOf(HTMLDivElement);
});

test("attributes with on prefix will attach listeners to the DOM node", () => {
  const callback = vi.fn();

  const div = <div ongot={callback}></div>;

  expect(callback).not.toBeCalled();

  div.dispatchEvent(new CustomEvent("got"));

  expect(callback).toBeCalled();
});

test.todo("once suffix registers one-time executed event listener", () => {
  const callback = vi.fn();

  const div = <div onClickOnce={callback}></div>;

  expect(callback).not.toBeCalled();

  div.dispatchEvent(new MouseEvent("click"));

  expect(callback).toBeCalled();

  div.dispatchEvent(new MouseEvent("click"));

  expect(callback).toBeCalledTimes(1);
});

test.todo("capture suffix registers a listener for the capturing phase", () => {
  let time1;
  let time2;

  const callback1 = vi.fn(() => (time1 = performance.now()));
  const callback2 = vi.fn(() => (time2 = performance.now()));

  const child = <div onClick={callback2}></div>;
  const parent = <div onClickCapture={callback1}>{child}</div>;

  child.dispatchEvent(new MouseEvent("click"));

  expect(time2 > time1).toBe(true);
});
