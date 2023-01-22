import { test, expect } from "vitest";

import { createElement, Fragment, isJSXCoreElement } from "moru";

const jsxElementSymbol = Object.getOwnPropertySymbols(
  createElement("p", {})
)[0];

test("createElement function has to return an object with just properties passed as arguments for regular elements", () => {
  const element = createElement("div", { class: "foo" });

  expect(element).toMatchObject({
    tag: "div",
    ref: undefined,
    children: undefined,
    attributes: {
      class: "foo",
    },
    [jsxElementSymbol]: null,
  });
});

test("createElement function has to return on object with just properties passed as arguments for components", () => {
  const C = ({ foo }) => foo + "bar";

  const element = createElement(C, { foo: "foo" });

  expect(element).toMatchObject({
    tag: C,
    ref: undefined,
    children: undefined,
    attributes: {
      foo: "foo",
    },
    [jsxElementSymbol]: null,
  });
});

test("createElement function has to return fragment element when the Fragment is the tag argument", () => {
  const element = createElement(Fragment, { children: [] });

  expect(element).toMatchObject({
    tag: "fragment",
    children: [],
  });
});

test("Fragment component has to return an object with constant tag property and children", () => {
  const element = Fragment(8);

  expect(element).toMatchObject({
    tag: "fragment",
    children: 8,
  });
});

test("isJSXCoreElement should detect moru elements", () => {
  const element = createElement("span", {});

  expect(isJSXCoreElement(element)).toBe(true);
  expect(isJSXCoreElement({})).toBe(false);
  expect(isJSXCoreElement(8)).toBe(false);
});
