import { equal, match } from "node:assert/strict";
import { test, suite, mock } from "node:test";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

suite("built-in components", () => {
  suite("import", () => {
    test('"import" component should be removed', async () => {
      const output = await compile('<import src="something" />');

      equal(output, "");
    });

    test('"import" component\'s children should be ignored', async () => {
      const output = await compile('<import src="something">foo</import>');

      equal(output, "");
    });
  });

  suite("raw", () => {
    test('"raw" component should preserve children as they are', async () => {
      const output = await compile(`
        <raw>
          {{ 1 }}
          <import src="something" />
        </raw>
      `);

      match(output, /^\s+{{ 1 }}\s+<import src="something"><\/import>\s+$/);
    });
  });

  suite("conditional", () => {
    test("conditional elements render children based on the thuthiness of the condition", async () => {
      const output = await compile(`
        <if condition="{{ true }}">
          1 should be rendered
        </if>
        <else>
          1 should not be rendered
        </else>

        <if condition="{{ false }}">
          2 should not be rendered
        </if>
        <else>
          2 should be rendered
        </else>
      `);

      match(output, /\s+1 should be rendered\s+2 should be rendered\s+/);
    });

    test('conditional elements can contain arbitrary "else-if" elements', async () => {
      const output = await compile(`
        <if condition="{{ false }}">
          1
        </if>
        <else-if condition="{{ false }}">
          2
        </else-if>
        <else-if condition="{{ true }}">
          3
        </else-if>
        <else-if condition="{{ false }}">
          4
        </else-if>
        <else>
          5
        </else>
      `);

      match(output, /^\s+3\s+$/);
    });

    test('"else" element can be omitted from conditional elements', async () => {
      const output = await compile(`
        <if condition="{{ false }}">
          1
        </if>
        <else-if condition="{{ true }}">
          2
        </else-if>

        <if condition="{{ true }}">
          3
        </if>
      `);

      match(output, /^\s+2\s+3\s+$/);
    });

    test(
      '"else" element of conditional elements group can not be preceeded by other elements ' +
        'except for "if" or "else-if" and whitespaces',
      async () => {
        const publish1 = mock.fn();
        const code1 = `
          <else>
            2
          </else>
        `;
        const output1 = await compile(code1, {
          diagnostics: { publish: publish1 },
        });

        equal(publish1.mock.callCount(), 1);
        equal(
          publish1.mock.calls[0].arguments[0].tag,
          MessageTag.SingleElseElement,
        );
        equal(output1, code1);

        const publish2 = mock.fn();
        const output2 = await compile(
          `
            <if condition="{{ false }}">
              1
            </if>
            text in-between
            <else>
              2
            </else>
          `,
          { diagnostics: { publish: publish2 } },
        );

        equal(publish2.mock.callCount(), 1);
        equal(
          publish2.mock.calls[0].arguments[0].tag,
          MessageTag.SingleElseElement,
        );
        match(output2, /\s+text in-between\s+<else>\s+2\s+<\/else>\s+/);
      },
    );

    test(
      '"else-if" element of conditional elements group can not be preceeded by other elements ' +
        'except for "if" and whitespaces',
      async () => {
        const publish1 = mock.fn();
        const code1 = `
          <else-if condition="{{ true }}">
            2
          </else-if>
        `;
        const output1 = await compile(code1, {
          diagnostics: { publish: publish1 },
        });

        equal(publish1.mock.callCount(), 1);
        equal(
          publish1.mock.calls[0].arguments[0].tag,
          MessageTag.SingleElseIfElement,
        );
        equal(output1, code1);

        const publish2 = mock.fn();
        const output2 = await compile(
          `
            <if condition="{{ false }}">
              1
            </if>
            text in-between
            <else-if condition="{{ true }}">
              2
            </else-if>
          `,
          { diagnostics: { publish: publish2 } },
        );

        equal(publish2.mock.callCount(), 1);
        equal(
          publish2.mock.calls[0].arguments[0].tag,
          MessageTag.SingleElseIfElement,
        );
        match(
          output2,
          /\s+text in-between\s+<else-if condition="{{ true }}">\s+2\s+<\/else-if>\s+/,
        );
      },
    );
  });

  suite("loop", () => {
    test('"for" component repeats children for each element of an array', async () => {
      const output = await compile(`
        <for each="{{ [1, 2, 3] }}">
          {{ item }} at {{ index }}
        </for>
      `);

      match(output, /\s+1 at 0\s+2 at 1\s+3 at 2\s+/);
    });

    test('renders the "else" element of the loop group if present when an array is empty', async () => {
      const output = await compile(`
        <for each="{{ [] }}">
          main body
        </for>
        <else>
          fallback
        </else>

        <for each="{{ [] }}">
          main body 2
        </for>
      `);

      match(output, /^\s+fallback\s+$/);
    });

    test('renders the "else" element of the loop group when the "each" attribute value is not an array', async () => {
      const publish = mock.fn();
      const output = await compile(
        `
          <for each="{{ { 1: 'foo' } }}">
            main body
          </for>
          <else>
            fallback
          </else>
        `,
        { diagnostics: { publish } },
      );

      match(output, /\s+fallback\s+/);
      equal(publish.mock.callCount(), 1);
      equal(
        publish.mock.calls[0].arguments[0].tag,
        MessageTag.NonIterableEachAttribute,
      );
    });

    test('"for" element allows to rename "item" and "index" variables visible to children', async () => {
      const output = await compile(`
        <for each="{{ [1, 2, 3] }}" as="value" index="position">
          {{ value }} at {{ position }}
        </for>
      `);

      match(output, /\s+1 at 0\s+2 at 1\s+3 at 2\s+/);
    });

    test('allow only whitespaces between "for" and "else" elements', async () => {
      const publish = mock.fn();
      const output = await compile(
        `
          <for each="{{ [] }}">
            whoa
          </for>
          in-between
          <else>
            fallback
          </else>
        `,
        { diagnostics: { publish } },
      );

      match(output, /\s+in-between\s+<else>\s+fallback\s+<\/else>\s+/);
      equal(publish.mock.callCount(), 1);
      equal(
        publish.mock.calls[0].arguments[0].tag,
        MessageTag.SingleElseElement,
      );
    });
  });
});
