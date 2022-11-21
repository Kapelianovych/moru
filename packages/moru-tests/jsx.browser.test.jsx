import { test, expect } from "vitest";

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
