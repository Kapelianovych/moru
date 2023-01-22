import { render } from "moru/web";
import { useState } from "moru";
import { test, expect, vi } from "vitest";

import { runTask } from "../scheduling.js";

test("JSX elements that describe native DOM tags have to return stringified representation", () => {
  const div = render(<div></div>);

  expect(div).toMatch("<div></div>");
});

test("a fragment has to be rendered as an empty string", () => {
  const fragment = render(<></>);

  expect(fragment).toBe("");
});

test("attributes with a primitive values have to be present as is", () => {
  const div = render(<div id="root" class={"foo"}></div>);

  expect(div).toMatch('<div id="root" class="foo"></div>');
});

test("attribute name that contains a dash has to be rendered as is", () => {
  const div = render(<div aria-label="some"></div>);

  expect(div).toMatch('<div aria-label="some"></div>');
});

test("a boolean value either preserve attribute on the tag or removes it", () => {
  const div = render(<div disabled={true} readonly={false}></div>);

  expect(div).toMatch("<div disabled></div>");
});

test("a function passed as attribute's value does not create a reactive context", async () => {
  const [a, setA] = useState("baz");

  const fn = vi.fn(() => a());

  const div = render(<div id={fn}></div>);

  expect(div).toMatch('<div id="baz"></div>');

  setA("foo");

  await runTask(() => {
    expect(fn).toBeCalledTimes(1);
    expect(div).toMatch('<div id="baz"></div>');
  });
});

test("class attribute can have an array of strings as a value", () => {
  const div = render(<div class={["foo", "baz"]}></div>);

  expect(div).toMatch('<div class="foo baz"></div>');
});

test("array value of the class attribute can have objects whose keys are classes and values determines whether the key will be added", () => {
  const div = render(
    <div class={["bad", { foo: false, bar: true, baz: () => true }]}></div>
  );

  expect(div).toMatch('<div class="bad bar baz"></div>');
});

test("style attribute can have an object as a value whose keys are CSS properties and values are their respective values or functions that returns values", () => {
  const div = render(
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "flex-direction": () => "row",
      }}
    ></div>
  );

  expect(div).toMatch(
    '<div style="display:flex;align-items:center;flex-direction:row;"></div>'
  );
});

test("ref attribute does nothing", () => {
  const fn = vi.fn();

  const div = render(<div ref={fn}></div>);

  expect(fn).not.toBeCalled();
});

test("event listeners are not preserved in the resulting string", () => {
  const div = render(<div onclick={() => {}}></div>);

  expect(div).toMatch("<div></div>");
});

test("JSX elements can contain other elements and components", () => {
  const P = () => render(<p class="p"></p>);

  const div = render(
    <div class="parent">
      <span class="span"></span>
      <P />
    </div>
  );

  expect(div).toMatch(
    '<div class="parent"><span class="span"></span><p class="p"></p></div>'
  );
});

test("null and undefined are rendered as empty strings", () => {
  const div = render(
    <div>
      {null}
      {undefined}
    </div>
  );

  expect(div).toMatch("<div></div>");
});

test("0, empty string, false are rendered as is", () => {
  const div = render(
    <div>
      <p>{0}</p>
      {""}
      <div>{false}</div>
    </div>
  );

  expect(div).toMatch("<div><p>0</p><div>false</div></div>");
});

test("array passed as a child has to be flattened and all items rendered as children", () => {
  const div = render(<div>{["foo", <div>baz</div>]}</div>);

  expect(div).toMatch("<div>foo<div>baz</div></div>");
});

test("inline component has to be executed and the result is inserted into the DOM", () => {
  const div = render(<div>{() => "8"}</div>);

  expect(div).toMatch("<div>8</div>");
});

test("fragment with children has to render only children", () => {
  const div = render(
    <div>
      {() => (
        <>
          <p>foo</p>
          <span>baz</span>
        </>
      )}
    </div>
  );

  expect(div).toMatch("<div><p>foo</p><span>baz</span></div>");
});
