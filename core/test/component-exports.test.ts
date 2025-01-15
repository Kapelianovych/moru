import { equal, match } from "node:assert/strict";
import { test, suite, mock } from "node:test";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

suite("component's export", () => {
  test("export element should be removed from HTML", async () => {
    const output = await compile(`
      <export name="some" value="foo" />
    `);

    match(output, /^\s+$/);
  });

  test("export element's children are ignored", async () => {
    const output = await compile(`
      <export name="some" value="foo">
        <p />
      </export>
    `);

    match(output, /^\s+$/);
  });

  test("export element's value attribute can contain an expression", async () => {
    const fn = mock.fn();
    await compile(
      `
        <export name="some" value="{{ props.fn() }}" />
      `,
      { properties: { fn } },
    );

    equal(fn.mock.callCount(), 1);
  });

  test("export element can be defined only at the top-level", async () => {
    const publish = mock.fn();
    await compile(
      `
        <div>
          <export name="some" value="foo" />
        </div>

        <export name="other" value="foo" />
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
        <export name="some" value="foo" />
        <import from="foo.html" />
      `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 0);
  });

  test("export element should contain the value attribute", async () => {
    const publish = mock.fn();
    await compile(
      `
        <export name="some"  />
      `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.NotDefinedExportValueExpression,
    );
  });

  test("export element should contain the name attribute", async () => {
    const publish = mock.fn();
    await compile(
      `
        <export value="some"  />
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
          return '<export name="variable" value="text" /> <slot />';
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
          return '<export name="variable" value="text" />';
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
          return '<export name="variable" value="text" /> <slot />';
        },
      },
    );

    match(output, /^\s+text\s+$/);
  });

  test("if outer scope contains variable with the same name, it won't be erased when accessed outside of a component children scope", async () => {
    const output = await compile(
      `
        <import from="foo.html" />

        <foo assign:variable>
          {{ variable }}
        </foo>

        {{ variable }}

        <script build>
          const variable = 'current';
        </script>
      `,
      {
        async readFileContent() {
          return '<export name="variable" value="text" /> <slot />';
        },
      },
    );

    match(output, /^\s+text\s+current\s+$/);
  });

  test("variable can be imported only if a nested component contains an export definition", async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="foo.html" />

        <foo assign:variable />
      `,
      {
        diagnostics: { publish },
        async readFileContent() {
          return "";
        },
      },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.ComponentMissingExport,
    );
  });
});
