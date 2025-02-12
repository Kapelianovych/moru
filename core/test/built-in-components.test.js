import { ok, equal, match } from "node:assert/strict";
import { test, suite, mock } from "node:test";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

suite("built-in components", () => {
  suite("import", () => {
    test('"import" component should be removed', async () => {
      const output = await compile('<import from="something.html" />');

      equal(output, "");
    });

    test('"import" component\'s children should be ignored', async () => {
      const output = await compile(
        '<import from="something.html">foo</import>',
      );

      equal(output, "");
    });

    test('"import" should warn if source extension is not "html"', async () => {
      const publish = mock.fn();
      await compile('<import from="something.foo" />', {
        diagnostics: { publish },
      });

      equal(publish.mock.callCount(), 1);
      equal(
        publish.mock.calls[0].arguments[0].tag,
        MessageTag.InvalidNameOfImportedComponent,
      );
    });
  });

  suite("portal", () => {
    test('"portal" should be removed from the HTML', async () => {
      const output = await compile(`
        <portal name="foo" />
      `);

      equal(output.trim(), "");
    });

    test('"portal" without name should raise an error', async () => {
      const publish = mock.fn();
      const output = await compile(
        `
          <portal />
        `,
        { diagnostics: { publish } },
      );

      equal(output.trim(), "");
      equal(publish.mock.callCount(), 1);
      ok(
        publish.mock.calls[0].arguments[0].tag ===
          MessageTag.NotDefinedPortalName,
      );
    });

    test('children of the "portal" should not be removed', async () => {
      const output = await compile(`
        <portal name="foo">
          <p>some</p>
        </portal>
      `);

      match(output, /\s+<p>some<\/p>\s+/);
    });

    test('native HTML elements can be moved into a "portal" by its name', async () => {
      const output = await compile(`
        <portal name="test-portal" />

        <hr />

        <div portal="test-portal">
          some content
        </div>
      `);

      match(output, /^\s+<div>.+?<\/div>\s+<hr>\s+$/s);
    });

    test("portal's name can be computed", async () => {
      const output = await compile(`
        <portal name="{{ portalName }}" />

        <hr />

        <div portal="{{ portalName }}">
          some content
        </div>

        <script build>
          const portalName = 'foo';
        </script>
      `);

      match(output, /^\s+<div>.+?<\/div>\s+<hr>\s+$/s);
    });

    test("portal's evaluated name can not be undefined", async () => {
      const publish = mock.fn();
      await compile(
        `
          <portal name="{{ undefined }}" />
        `,
        { diagnostics: { publish } },
      );

      equal(publish.mock.callCount(), 1);
      ok(
        publish.mock.calls[0].arguments[0].tag ===
          MessageTag.NotDefinedPortalName,
      );
    });

    test("if portal's evaluated name is invalid, it should be removed with its children", async () => {
      const output = await compile(
        `
          <portal name="{{ undefined }}">
            <p/>
          </portal>
        `,
      );

      equal(output.trim(), "");
    });

    test('fragments can be moved into a "portal" by its name', async () => {
      const output = await compile(`
        <portal name="test-portal" />

        <hr />

        <fragment portal="test-portal">
          <div>
            some content
          </div>
        </fragment>
      `);

      match(output, /^\s+<div>.+?<\/div>\s+<hr>\s+$/s);
    });

    test('markup fragment should not be moved into a "portal"', async () => {
      const output = await compile(`
        <portal name="test-portal" />

        <hr />

        <fragment name="foo" portal="test-portal">
          <div>
            some content
          </div>
        </fragment>
      `);

      match(output, /^\s+<hr>\s+$/);
    });

    test('raws can be moved into a "portal" by its name', async () => {
      const output = await compile(`
        <portal name="test-portal" />

        <hr />

        <raw portal="test-portal">
          <div>
            some content
          </div>
        </raw>
      `);

      match(output, /^\s+<div>.+?<\/div>\s+<hr>\s+$/s);
    });

    test("conditionals and loops cannot be moved to portals", async () => {
      const output = await compile(`
        <portal name="foo" />

        <hr>

        <if condition="{{ true }}" portal="foo">
          1
        </if>
        <for each="{{ [0] }}" portal="foo">
          2
        </for>
      `);

      match(output, /<hr>\s+1\s+2/);
    });

    test(
      "elements with a reference to non-existent portal should be " +
        "removed from HTML and a diagnostic message should be emitted",
      async () => {
        const publish = mock.fn();
        const output = await compile(
          `
            <div portal="foo" />
          `,
          { diagnostics: { publish } },
        );

        equal(output.trim(), "");
        equal(publish.mock.callCount(), 1);
        equal(
          publish.mock.calls[0].arguments[0].tag,
          MessageTag.ReferenceToNonExistentPortal,
        );
      },
    );

    test("when element's portal attribute value is undefined, the element is removed from HTML", async () => {
      const output = await compile(
        `
          <div portal="{{ undefined }}" />
        `,
      );

      equal(output.trim(), "");
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

    test("loops must render HTML elements", async () => {
      const output = await compile(
        `
          <div />

          <for each="{{ ['foo'] }}">
            <p class="{{ item }}" />
          </for>
        `,
      );

      match(output, /\s+<div><\/div>\s+<p class="foo"><\/p>\s+/);
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

    test(
      '"item" and "index" should be defined inside "for" loop even if ' +
        "localThis already has constant definitions of same variables",
      async () => {
        const output = await compile(`
          <for each="{{ [1, 2, 3] }}">
            {{ item }} - {{ index }}
          </for>

          <script build>
            const item = 'item';
            const index = -1;
          </script>
        `);

        match(output, /\s+1 - 0\s+2 - 1\s+3 - 2\s+/);
      },
    );
  });
});
