import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { mock, suite, test } from "node:test";
import { deepEqual, equal, match } from "node:assert/strict";
import { IDS } from "../components/lib/symbols.js";
import { compile } from "./compiler.js";
import { getFromNamespace } from "../components/lib/namespace.js";

const idComponentContent = readFile(
  resolve(import.meta.dirname, "../components/id.html"),
  "utf8",
);

async function dynamicallyImportJsFile() {
  return {
    IDS,
    getFromNamespace,
  };
}

suite("id", () => {
  test("should produce string value", async () => {
    const onId = mock.fn();
    await compile(
      `
        <import from="id.html" />

        <id assign:id>
          {{ props.onId(id) }}
        </id>
      `,
      {
        properties: { onId },
        buildStore: new Map(),
        readFileContent() {
          return idComponentContent;
        },
        dynamicallyImportJsFile,
      },
    );

    equal(onId.mock.calls[0].arguments[0], "_a");
  });

  test("should produce unique value", async () => {
    const onId = mock.fn();
    await compile(
      `
        <import from="id.html" />

        <id assign:id>
          {{ props.onId(id) }}
        </id>
        <id assign:id>
          {{ props.onId(id) }}
        </id>
      `,
      {
        properties: { onId },
        buildStore: new Map(),
        readFileContent() {
          return idComponentContent;
        },
        dynamicallyImportJsFile,
      },
    );

    deepEqual(
      onId.mock.calls.map((call) => call.arguments[0]),
      ["_a", "_b"],
    );
  });

  test("should produce unique value even for numbers bigger than safe integer", async () => {
    const onId = mock.fn();
    await compile(
      `
        <import from="id.html" />

        <script build>
          // Initialise index with maximal possible value before first overflow.
          props.getFromNamespace(buildStore, props.IDS, () => ({
            index: Number.MAX_SAFE_INTEGER,
            overflows: 0,
          }));
        </script>

        <id assign:id>
          {{ props.onId(id) }}
        </id>
        <id assign:id>
          {{ props.onId(id) }}
        </id>
      `,
      {
        properties: { onId, IDS, getFromNamespace },
        buildStore: new Map(),
        readFileContent() {
          return idComponentContent;
        },
        dynamicallyImportJsFile,
      },
    );

    deepEqual(
      onId.mock.calls.map((call) => call.arguments[0]),
      ["_PpQXn7COh", "_b_a"],
    );
  });
});
