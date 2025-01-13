import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { mock, suite, test } from "node:test";
import { equal, deepEqual, match } from "node:assert/strict";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

const onlyComponentContent = readFile(
  resolve(import.meta.dirname, "../components/only.html"),
  "utf8",
);

async function dynamicallyImportJsFile() {
  return {
    ONLY_CACHE: "only-cache",
  };
}

suite("only", () => {
  test('should error if the "key" property is not provided or is "undefined"', async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="only.html" />

        <only>foo</only>
        <only key="{{ undefined }}">bar</only>
      `,
      {
        buildStore: new Map(),
        diagnostics: { publish },
        readFileContent() {
          return onlyComponentContent;
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

  test('should error if the "times" property is less than 0', async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="only.html" />

        <only key="wow" times="{{ -1 }}">
          foo
        </only>
      `,
      {
        buildStore: new Map(),
        diagnostics: { publish },
        readFileContent() {
          return onlyComponentContent;
        },
        dynamicallyImportJsFile,
      },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.FailedBuildScriptExecution,
    );
  });

  test("should render children only once by default", async () => {
    const output = await compile(
      `
        <import from="only.html" />

        <only key="wow">
          foo
        </only>

        <only key="wow">
          bar
        </only>
      `,
      {
        buildStore: new Map(),
        readFileContent() {
          return onlyComponentContent;
        },
        dynamicallyImportJsFile,
      },
    );

    match(output, /^\s+foo\s+$/);
  });

  test('should render children no more than the "times" attribute value', async () => {
    const output = await compile(
      `
        <import from="only.html" />

        <only key="wow" times="{{ 2 }}">
          foo
        </only>

        <only key="wow" times="{{ 2 }}">
          bar
        </only>

        <only key="wow" times="{{ 2 }}">
          bar
        </only>
      `,
      {
        buildStore: new Map(),
        readFileContent() {
          return onlyComponentContent;
        },
        dynamicallyImportJsFile,
      },
    );

    match(output, /^\s+foo\s+bar\s+$/);
  });
});
