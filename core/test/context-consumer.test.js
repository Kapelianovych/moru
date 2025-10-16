import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { mock, suite, test } from "node:test";
import { deepEqual, equal, match } from "node:assert/strict";

import { compile } from "./compiler.js";
import { CONTEXTS } from "../components/lib/symbols.js";
import { MessageTag } from "../src/diagnostics.js";
import { getContext } from "../components/context.js";
import { getFromNamespace } from "../components/lib/namespace.js";

const contextProviderComponentContent = readFile(
  resolve(import.meta.dirname, "../components/context-provider.html"),
  "utf8",
);
const contextConsumerComponentContent = readFile(
  resolve(import.meta.dirname, "../components/context-consumer.html"),
  "utf8",
);

async function dynamicallyImportJsFile() {
  return {
    CONTEXTS,
    getContext,
    getFromNamespace,
  };
}

suite("context-consumer", () => {
  test('should error if "key" attribute is not provided or is undefined', async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="context-consumer.html" />

        <context-consumer />
        <context-consumer key="{{ undefined }}" />
      `,
      {
        buildStore: new Map(),
        diagnostics: { publish },
        dynamicallyImportJsFile,
        readFileContent() {
          return contextConsumerComponentContent;
        },
      },
    );

    equal(publish.mock.callCount(), 4);
    deepEqual(
      publish.mock.calls.map((call) => call.arguments[0].tag),
      [
        MessageTag.FailedBuildScriptExecution,
        MessageTag.MissingExportedFromHtmlValueDefinition,
        MessageTag.FailedBuildScriptExecution,
        MessageTag.MissingExportedFromHtmlValueDefinition,
      ],
    );
  });

  test("<context-consumer> should error when there is no <consumer-provider> above the tree", async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="./context-consumer.html" />

        <context-consumer key="wow" />
      `,
      {
        buildStore: new Map(),
        diagnostics: { publish },
        dynamicallyImportJsFile,
        readFileContent() {
          return contextConsumerComponentContent;
        },
      },
    );

    equal(publish.mock.callCount(), 2);
    deepEqual(
      publish.mock.calls.map((call) => {
        return call.arguments[0].tag;
      }),
      [
        MessageTag.FailedBuildScriptExecution,
        MessageTag.MissingExportedFromHtmlValueDefinition,
      ],
    );
  });

  test("should pass provider's value to children", async () => {
    const output = await compile(
      `
        <import from="context-provider.html" />
        <import from="foo.html" />

        <context-provider key="one" value="provided value">
          <foo />
        </context-provider>
      `,
      {
        buildStore: new Map(),
        resolveUrl(_, url) {
          return url;
        },
        async readFileContent(url) {
          if (url === "context-provider.html") {
            return contextProviderComponentContent;
          } else if (url === "context-consumer.html") {
            return contextConsumerComponentContent;
          } else {
            return `
              <import from="context-consumer.html" />

              <context-consumer key="one" assign:value>
                {{ value }}
              </context-consumer>
            `;
          }
        },
        dynamicallyImportJsFile,
      },
    );

    match(output, /^\s*provided value\s*$/);
  });

  test("should get value of the closest provider", async () => {
    const output = await compile(
      `
        <import from="context-provider.html" />
        <import from="context-consumer.html" />

        <context-provider key="one" value="{{ 1 }}">
          <context-provider key="one" value="{{ 2 }}">
            <context-consumer key="one" assign:value>
              {{ value }}
            </context-consumer>
          </context-provider>
        </context-provider>
      `,
      {
        buildStore: new Map(),
        resolveUrl(_, url) {
          return url;
        },
        async readFileContent(url) {
          if (url === "context-provider.html") {
            return contextProviderComponentContent;
          } else {
            return contextConsumerComponentContent;
          }
        },
        dynamicallyImportJsFile,
      },
    );

    match(output, /^\s*2\s*$/);
  });
});
