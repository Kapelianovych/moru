import { ok, equal, match } from "node:assert/strict";
import { test, suite, mock } from "node:test";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

suite("basic", () => {
  test("outputs raw HTML unchanged", async () => {
    const code = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;

    const output = await compile(code);

    equal(output, code);
  });

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

  test("allows self-closing tags", async () => {
    const output = await compile("<div />");

    equal(output, "<div></div>");
  });

  test('does not allow the "src" attribute in "build" scripts', async () => {
    const publish = mock.fn();
    await compile(
      `
        <script src="something" build></script>,
      `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.ExternalBuildScript,
    );
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
});
