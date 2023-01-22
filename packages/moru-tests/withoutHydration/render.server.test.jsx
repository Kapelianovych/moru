import { expect, test } from "vitest";

import { render } from "moru/web";

test("render should return HTML string", () => {
  expect(render(<div>baz</div>)).toMatch("<div>baz</div>");
  expect(
    render(
      <>
        <p>foo</p>
      </>
    )
  ).toMatch("<p>foo</p>");
});

test("render should join an array", () => {
  expect(render([<p></p>, <span></span>])).toMatch("<p></p><span></span>");
});

test("render should return the result of a function", () => {
  const A = () => <a></a>;

  expect(render(A)).toMatch("<a></a>");
});

test("render should return the string representation of non-renderable values", () => {
  const value = { a: "foo" };

  expect(render(value)).toMatch(String(value));
});
