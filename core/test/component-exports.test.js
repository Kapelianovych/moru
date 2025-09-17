import { equal, match } from "node:assert/strict";
import { test, suite, mock } from "node:test";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

suite("component's export", () => {
  test("export element should be removed from HTML", async () => {
    const output = await compile(`
      <export name="some" />

      <script build>
        const some = 1;
      </script>
    `);

    equal(output, "");
  });

  test("export element's children are ignored", async () => {
    const output = await compile(`
      <export name="some">
        <p />
      </export>

      <script build>
        const some = 1;
      </script>
    `);

    equal(output, "");
  });

  test("export element can be defined only at the top-level", async () => {
    const publish = mock.fn();
    await compile(
      `
        <div>
          <export name="some" />
        </div>

        <export name="other" />

        <script build>
          const other = 1;
        </script>
      `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.InvalidExportElementPosition,
    );
  });

  test("export element can be defined before import", async () => {
    const publish = mock.fn();
    await compile(
      `
        <export name="some" />
        <import from="foo.html" />

        <script build>
          const some = 1;
        </script>
      `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 0);
  });

  test("export element should contain the name attribute", async () => {
    const publish = mock.fn();
    await compile(
      `
        <export />
      `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.NotDefinedExportName,
    );
  });

  test("parent component can import exported value of a nested component", async () => {
    const output = await compile(
      `
        <import from="foo.html" />

        <foo assign:variable>
          {{ variable }}
        </foo>
      `,
      {
        async readFileContent() {
          return `
            <export name="variable" />

            <slot />

            <script build>
              const variable = 'text';
            </script>
          `;
        },
      },
    );

    match(output, /^\s+text\s+$/);
  });

  test("imported variables cannot be used outside of a component children scope", async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="foo.html" />

        <foo assign:variable />

        {{ variable }}
      `,
      {
        diagnostics: { publish },
        async readFileContent() {
          return `
            <export name="variable" />

            <slot />

            <script build>
              const variable = 1;
            </script>
          `;
        },
      },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.FailedInHtmlExpressionExecution,
    );
  });

  test("imported variable can be renamed", async () => {
    const output = await compile(
      `
        <import from="foo.html" />

        <foo assign:variable="other">
          {{ other }}
        </foo>
      `,
      {
        async readFileContent() {
          return `
            <export name="variable" />

            <slot />

            <script build>
              const variable = 'text';
            </script>
          `;
        },
      },
    );

    match(output, /^\s+text\s+$/);
  });

  test("export element allows to export a value under a different name", async () => {
    const output = await compile(
      `
        <import from="foo.html" />

        <foo assign:other>
          {{ other }}
        </foo>
      `,
      {
        async readFileContent() {
          return `
            <export name="variable" as="other" />

            <slot />

            <script build>
              const variable = 'text';
            </script>
          `;
        },
      },
    );

    match(output, /^\s+text\s+$/);
  });

  test(
    "if outer scope contains variable with the same name, it won't be erased when " +
      "accessed outside of a component children scope",
    async () => {
      const output = await compile(
        `
          <import from="foo.html" />

          <foo assign:variable>
            {{ variable }}
          </foo>

          <if condition="{{ true }}">
            {{ variable }}
          </if>

          <script build>
            const variable = 'current';
          </script>
        `,
        {
          async readFileContent() {
            return `
              <export name="variable" />

              <slot />

              <script build>
                const variable = 'text';
              </script>
            `;
          },
        },
      );

      match(output, /^\s+text\s+current\s+$/);
    },
  );

  test("variable can be imported only if a nested component contains an export definition", async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="./foo.html" />

        <foo assign:variable>
          child
        </foo>
      `,
      {
        diagnostics: { publish },
        async readFileContent() {
          return "<slot />";
        },
      },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.ComponentMissingExport,
    );
  });

  test("should error when an exported value is not defined", async () => {
    const publish = mock.fn();
    await compile(
      `
        <export name="foo" />
      `,
      {
        diagnostics: { publish },
      },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.MissingExportedFromHtmlValueDefinition,
    );
  });
});
