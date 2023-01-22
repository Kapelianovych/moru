import { render } from "moru/web";
import { expect, test } from "vitest";

test("render should not process Node objects", () => {
  const div = document.createElement("div");

  expect(render(div)).toBe(div);
});

test("render should convert JSX into DOM", () => {
  const elements = (
    <p>
      bar
      <div>foo</div>
    </p>
  );

  const renderedElements = render(elements);

  expect(renderedElements).toBeInstanceOf(HTMLParagraphElement);
  expect(renderedElements.querySelector("div")).toBeTruthy();
});

test("render should render a function into the DocumentFragment", () => {
  const element = render(() => 8);

  expect(element).toBeInstanceOf(DocumentFragment);
});

test("render should render an array into the DocumentFragment", () => {
  const element = render(["foo", <p></p>]);

  expect(element).toBeInstanceOf(DocumentFragment);
});

test("render should render null and undefined as empty Text nodes", () => {
  const nullElement = render(null);
  const undefinedElement = render(undefined);

  expect(nullElement).toBeInstanceOf(Text);
  expect(nullElement.textContent).toBe("");
  expect(undefinedElement).toBeInstanceOf(Text);
  expect(undefinedElement.textContent).toBe("");
});

test("render should convert other falsy values (except null and undefined) to string", () => {
  expect(render(0)).toEqual(document.createTextNode("0"));
  expect(render("")).toEqual(document.createTextNode(""));
  expect(render(false)).toEqual(document.createTextNode("false"));
});
