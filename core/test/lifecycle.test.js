import { equal } from "node:assert/strict";
import { test, suite, mock } from "node:test";

import { compile } from "./compiler.js";

suite("lifecycle", () => {
  test("after-render callback should run after the module finishes rendering", async () => {
    let calls = 0;
    const mockedFn = mock.fn();
    const code = `
      <import from="./foo.html" />

      <foo mocked-fn="{{ props['mocked-fn'] }}" />

      <script build>
        onAfterRender(() => {
          props.calls(props['mocked-fn'].mock.callCount());
        });
      </script>
    `;

    await compile(code, {
      properties: {
        /**
         * @param {number} number
         */
        calls(number) {
          calls = number;
        },
        "mocked-fn": mockedFn,
      },
      async readFileContent() {
        return `
          <script build>
            onAfterRender(props['mocked-fn']);
          </script>
        `;
      },
    });

    equal(calls, 1);
  });
});
