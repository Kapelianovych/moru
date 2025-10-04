import { ok, equal, match } from "node:assert/strict";
import { test, suite, mock } from "node:test";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

suite("build scripts", () => {
  test('removes "build" scripts', async () => {
    const code = `
      <script build></script>
      <script type="module" build></script>
    `;

    const output = await compile(code);

    equal(output.trim(), "");
  });

  test('notifies about syntax erorrs in "build" scripts', async () => {
    const code = `
      <script build>
        import { foo } from 'foo';
      </script>
    `;

    const publish = mock.fn();

    await compile(code, { diagnostics: { publish } });

    equal(publish.mock.callCount(), 1);
    equal(publish.mock.calls[0].arguments[0].tag, MessageTag.JsSyntaxError);
  });

  test('"build" scripts should have the global "props" object', async () => {
    const fn = mock.fn();

    await compile(
      `
        <script build>
          props.fn();
        </script>
      `,
      {
        properties: {
          fn,
        },
      },
    );

    equal(fn.mock.callCount(), 1);
  });

  test('"build" scripts should have the global "url" function with the current component URL', async () => {
    const output = await compile(
      `
        {{ url('./foo.webp') }}
        <div>{{ url.current }}</div>
      `,
      {
        resolveUrl(currentFile, relativeUrl) {
          return relativeUrl.slice(1);
        },
        fileUrl: "/folder/index.html",
      },
    );

    match(output, /\/foo.webp\s+<div>\/folder\/index.html<\/div>/);
  });

  test('"build" scripts should have the global "buildStore" object', async () => {
    const fn = mock.fn();

    await compile(
      `
        <script build>
          props.fn(buildStore);
        </script>
      `,
      {
        properties: {
          fn,
        },
      },
    );

    equal(fn.mock.callCount(), 1);
    ok(fn.mock.calls[0].arguments[0] instanceof Map);
  });

  test('if a top-level "build" script fails, then the whole component is not compiled', async () => {
    const publish = mock.fn();
    const output = await compile(
      `
      {{ foo }}

      <script build>
        throw 'error';
        const foo = 'child';
      </script>
    `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.FailedBuildScriptExecution,
    );
    equal(output, "");
  });

  test('if "build" script inside an "if" element fails, then whole element is not compiled', async () => {
    const publish = mock.fn();
    const output = await compile(
      `
      before

      <if condition="{{ true }}">
        {{ foo }}

        <script build>
          throw 'error';
          const foo = 'child';
        </script>
      </if>

      after
    `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.FailedBuildScriptExecution,
    );
    match(output, /^\s+before\s+after\s+$/);
  });

  test('if "build" script inside a "for" element fails, then the failed iteration is not compiled', async () => {
    const publish = mock.fn();
    const output = await compile(
      `
      before

      <for each="{{ [1, 2] }}">
        {{ item }}

        <script build>
          if (item % 2) {
            throw 'error';
          }
        </script>
      </for>

      after
    `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.FailedBuildScriptExecution,
    );
    match(output, /^\s+before\s+2\s+after\s+$/);
  });

  test("const definitions cannot be reassigned between build scripts", async () => {
    const publish = mock.fn();
    await compile(
      `
        <if condition="{{ true }}">
          <script build>
            foo = 2;
          </script>
        </if>

        <script build>
          const foo = 1;
        </script>
      `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.FailedBuildScriptExecution,
    );
  });

  test("non-const definitions can be reassigned between build scripts", async () => {
    /** @type {Record<string, unknown>} */
    const exports = {};
    const publish = mock.fn();
    await compile(
      `
        <export name="foo" />

        <if condition="{{ true }}">
          <script build>
            foo = 2;
          </script>
        </if>

        <script build>
          let foo = 1;
        </script>
      `,
      { exports, diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 0);
    equal(exports.foo, 2);
  });

  test('"src" attribute is allowed in "build" scripts', async () => {
    const call = mock.fn();
    await compile(
      `
        <script src="./something.js" build></script>,
      `,
      {
        properties: { call },
        resolveUrl(_, url) {
          return url;
        },
        async readFileContent() {
          return "props.call();";
        },
      },
    );

    equal(call.mock.callCount(), 1);
  });
});
