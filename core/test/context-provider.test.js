import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { mock, suite, test } from "node:test";
import { equal, deepEqual, match } from "node:assert/strict";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";
import { CONTEXTS } from "../components/lib/symbols.js";
import { getFromNamespace } from "../components/lib/namespace.js";
import { useContextGetter } from "../components/context-provider.js";

const contextProviderComponentContent = readFile(
  resolve(import.meta.dirname, "../components/context-provider.html"),
  "utf8",
);

async function dynamicallyImportJsFile() {
  return {
    CONTEXTS,
    useContextGetter,
    getFromNamespace,
  };
}

suite("context-provider", () => {
  test('should error if the "key" property is not provided or is "undefined"', async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="context-provider.html" />

        <context-provider>foo</context-provider>
        <context-provider key="{{ undefined }}">
          bar
        </context-provider>
      `,
      {
        buildStore: new Map(),
        diagnostics: { publish },
        readFileContent() {
          return contextProviderComponentContent;
        },
        dynamicallyImportJsFile,
      },
    );

    equal(publish.mock.callCount(), 2);
    deepEqual(
      publish.mock.calls.map((call) => call.arguments[0].tag),
      [
        MessageTag.FailedBuildScriptExecution,
        MessageTag.FailedBuildScriptExecution,
      ],
    );
  });

  test('should error if the "value" property is not provided or is "undefined"', async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="context-provider.html" />

        <context-provider key="foo">foo</context-provider>
        <context-provider key="bar" value="{{ undefined }}">
          bar
        </context-provider>
      `,
      {
        diagnostics: { publish },
        buildStore: new Map(),
        readFileContent() {
          return contextProviderComponentContent;
        },
        dynamicallyImportJsFile,
      },
    );

    equal(publish.mock.callCount(), 2);
    deepEqual(
      publish.mock.calls.map((call) => call.arguments[0].tag),
      [
        MessageTag.FailedBuildScriptExecution,
        MessageTag.FailedBuildScriptExecution,
      ],
    );
  });

  test("should render all children", async () => {
    const output = await compile(
      `
        <import from="context-provider.html" />

        <context-provider key="wow" value="foo">
          foo
        </context-provider>
      `,
      {
        buildStore: new Map(),
        readFileContent() {
          return contextProviderComponentContent;
        },
        dynamicallyImportJsFile,
      },
    );

    match(output, /^\s+foo\s+$/);
  });

  test("getContext should be able to get context value under the provider", async () => {
    const output = await compile(
      `
        <import from="context-provider.html" />
        <import from="./foo.html" />

        <context-provider key="wow" value="{{ 2 }}">
          <foo />
        </context-provider>
      `,
      {
        buildStore: new Map(),
        resolveUrl(_file, url) {
          return url;
        },
        async readFileContent(url) {
          if (url.includes("foo")) {
            return `
              {{ value }}

              <script type="module" build>
                import { useContextGetter } from './context-provider.js';

                const getContext = useContextGetter(buildStore);

                await Promise.resolve();

                const value = getContext('wow');
              </script>
            `;
          } else {
            return contextProviderComponentContent;
          }
        },
        dynamicallyImportJsFile,
      },
    );

    match(output, /^\s+2\s+$/);
  });

  test("getContext outside of the <context-provider> subtree should error", async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="context-provider.html" />

        <context-provider key="foo" value="bar" />

        <script type="module" build>
          import { useContextGetter } from './context-provider.js';

          const getContext = useContextGetter(buildStore);

          const value = getContext('foo');
        </script>
      `,
      {
        buildStore: new Map(),
        diagnostics: { publish },
        readFileContent() {
          return contextProviderComponentContent;
        },
      },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.FailedBuildScriptExecution,
    );
  });

  test("getContext should return the value from closest <context-provider>", async () => {
    const output = await compile(
      `
        <import from="context-provider.html" />
        <import from="foo.html" />

        <context-provider key="wow" value="1">
          <foo />
        </context-provider>
      `,
      {
        buildStore: new Map(),
        resolveUrl(_file, url) {
          return url;
        },
        async readFileContent(url) {
          if (url.includes("foo")) {
            return `
              <import from="context-provider.html" />
              <import from="bar.html" />

              {{ value }}

              <context-provider key="wow" value="2">
                <bar />
              </context-provider>

              <script type="module" build>
                import { useContextGetter } from './context-provider.js';

                const getContext = useContextGetter(buildStore);

                const value = getContext('wow');
              </script>
            `;
          } else if (url.includes("bar")) {
            return `
              <import from="context-provider.html" />

              {{ value }}

              <script type="module" build>
                import { useContextGetter } from './context-provider.js';

                const getContext = useContextGetter(buildStore);

                const value = getContext('wow');
              </script>
            `;
          } else {
            return contextProviderComponentContent;
          }
        },
        dynamicallyImportJsFile,
      },
    );

    match(output, /\s+1\s+2\s+/);
  });

  test("should not share value between parallel unit compilations", async () => {
    const [output1, output2, output3] = await Promise.all([
      compile(
        `
          <import from="context-provider.html" />
          <import from="foo.html" />

          <context-provider key="wow" value="3">
            <foo />
          </context-provider>
        `,
        {
          buildStore: new Map(),
          resolveUrl(_file, url) {
            return url;
          },
          async readFileContent(url) {
            if (url.includes("foo")) {
              return `
                <import from="context-provider.html" />

                {{ value }}

                <script type="module" build>
                  import { useContextGetter } from './context-provider.js';

                  const getContext = useContextGetter(buildStore);

                  await new Promise((resolve) => setTimeout(resolve, 40));

                  const value = getContext('wow');
                </script>
              `;
            } else {
              return contextProviderComponentContent;
            }
          },
          dynamicallyImportJsFile,
        },
      ),
      compile(
        `
          <import from="context-provider.html" />
          <import from="foo.html" />

          <context-provider key="wow" value="1">
            <foo />
          </context-provider>
        `,
        {
          buildStore: new Map(),
          resolveUrl(_file, url) {
            return url;
          },
          async readFileContent(url) {
            if (url.includes("foo")) {
              return `
                <import from="context-provider.html" />

                {{ value }}

                <script type="module" build>
                  import { useContextGetter } from './context-provider.js';

                  const getContext = useContextGetter(buildStore);

                  await new Promise((resolve) => setTimeout(resolve, 60));

                  const value = getContext('wow');
                </script>
              `;
            } else {
              return contextProviderComponentContent;
            }
          },
          dynamicallyImportJsFile,
        },
      ),
      compile(
        `
          <import from="context-provider.html" />
          <import from="foo.html" />

          <context-provider key="wow" value="5">
            <foo />
          </context-provider>
        `,
        {
          buildStore: new Map(),
          resolveUrl(_file, url) {
            return url;
          },
          async readFileContent(url) {
            if (url.includes("foo")) {
              return `
                <import from="context-provider.html" />

                {{ value }}

                <script type="module" build>
                  import { useContextGetter } from './context-provider.js';

                  const getContext = useContextGetter(buildStore);

                  await new Promise((resolve) => setTimeout(resolve, 20));

                  const value = getContext('wow');
                </script>
              `;
            } else {
              return contextProviderComponentContent;
            }
          },
          dynamicallyImportJsFile,
        },
      ),
    ]);

    match(output1, /\s+3\s+/);
    match(output2, /\s+1\s+/);
    match(output3, /\s+5\s+/);
  });

  test(
    "components which will eventually be inserted into " +
      "context-provider should be evaluated in its scope",
    async () => {
      const output = await compile(
        `
          <import from="c1.html" />
          <import from="foo.html" />

          <c1>
            <foo />
          </c1>
        `,
        {
          buildStore: new Map(),
          resolveUrl(_file, url) {
            return url;
          },
          async readFileContent(url) {
            if (url.includes("foo")) {
              return `
                {{ value }}

                <script type="module" build>
                  import { useContextGetter } from './context-provider.js';

                  const getContext = useContextGetter(buildStore);

                  const value = getContext('wow');
                </script>
              `;
            } else if (url.includes("c1")) {
              return `
                <import from="context-provider.html" />

                <context-provider key="wow" value="passed-down context value">
                  <slot />
                </context-provider>
              `;
            } else {
              return contextProviderComponentContent;
            }
          },
          dynamicallyImportJsFile,
        },
      );

      match(output, /^\s+passed-down context value\s+$/);
    },
  );
});
