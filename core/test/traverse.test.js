/**
 * @import { Mock } from 'node:test';
 *
 * @import { AnyNode, Text } from 'domhandler';
 */

import { equal } from "node:assert/strict";
import { test, suite, mock } from "node:test";

import { isTag } from "domhandler";
import { ElementType } from "htmlparser2";

import { parseHtml, traverseHtml } from "../src/index.js";
import { removeElement } from "domutils";

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
        /**
         * @param {AnyNode} node
         * @returns {node is AnyNode}
         */
        matches(node) {
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
        /**
         * @param {AnyNode} node
         * @returns {node is AnyNode}
         */
        matches(node) {
          return isTag(node) && node.tagName === "p";
        },
        enter,
      },
      {
        /**
         * @param {AnyNode} node
         * @returns {node is AnyNode}
         */
        matches(node) {
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

  test("should not skip nodes when there is a deletion case", () => {
    /**
     * @type {Mock<(node: AnyNode) => node is AnyNode>}
     */
    const matches = mock.fn();
    const ast = parseHtml({
      url: "something",
      content: "<p />foo",
    });

    traverseHtml(
      ast,
      [
        {
          matches(node) {
            return isTag(node);
          },
          exit(node) {
            removeElement(node);
          },
        },
        {
          matches,
        },
      ],
      true,
    );

    equal(matches.mock.callCount(), 1);
    equal(/** @type {Text} */ (matches.mock.calls[0].arguments[0]).data, "foo");
  });
});
