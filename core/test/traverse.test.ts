import { equal } from "node:assert/strict";
import { test, suite, mock } from "node:test";

import { ElementType } from "htmlparser2";
import { isTag, type AnyNode } from "domhandler";

import { parseHtml, traverseHtml } from "../src/index.js";

suite("traverseHtml", () => {
  test('should call a matching visitor over the first AST node when third argument is not provided or it is "false"', () => {
    const enter = mock.fn();

    const ast = parseHtml({
      url: "something",
      content: "<p>foo</p>",
    });

    traverseHtml(ast, [
      {
        matches(node) {
          return node.type === ElementType.Root;
        },
        enter,
      },
    ]);

    equal(enter.mock.callCount(), 1);
  });

  test('should call the "enter" and "exit" functions of the matching visitor when it matches a node', () => {
    const enter = mock.fn();
    const exit = mock.fn();

    const ast = parseHtml({
      url: "",
      content: "<div><p /></div>",
    });

    traverseHtml(ast, [
      {
        matches(node): node is AnyNode {
          return isTag(node) && node.tagName === "div";
        },
        enter,
        exit,
      },
    ]);

    equal(enter.mock.callCount(), 1);
    equal(exit.mock.callCount(), 1);
    equal(enter.mock.calls[0].arguments[0], exit.mock.calls[0].arguments[0]);
  });

  test('if "enter" returns "false", then children should not be traversed', () => {
    const enter = mock.fn();

    const ast = parseHtml({ url: "", content: "<div><p /></div>" });

    traverseHtml(ast, [
      {
        matches(node): node is AnyNode {
          return isTag(node) && node.tagName === "p";
        },
        enter,
      },
      {
        matches(node): node is AnyNode {
          return isTag(node) && node.tagName === "div";
        },
        enter() {
          return false;
        },
      },
    ]);

    equal(enter.mock.callCount(), 0);
  });

  test('should not call a matching visitor over the first AST node when third argument is "true"', () => {
    const enter = mock.fn();

    const ast = parseHtml({
      url: "something",
      content: "<p>foo</p>",
    });

    traverseHtml(
      ast,
      [
        {
          matches(node) {
            return node.type === ElementType.Root;
          },
          enter,
        },
      ],
      true,
    );

    equal(enter.mock.callCount(), 0);
  });
});
