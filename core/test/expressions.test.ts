import { equal, match } from "node:assert/strict";
import { suite, test } from "node:test";

import { compile } from "./compiler.js";

suite("expressions", () => {
  test("evaluates an expression and inserts the result into HTML", async () => {
    const output = await compile('{{ "foo" }}');

    equal(output, "foo");
  });

  test("allows asynchronous expressions", async () => {
    const output = await compile("{{ await Promise.resolve(1) }}");

    equal(output, "1");
  });

  test("does not execute escaped expressions", async () => {
    const output = await compile('\\{{ "executed" }}');

    equal(output, "{{ &quot;executed&quot; }}");
  });

  test("variables can participate in expressions", async () => {
    const output = await compile(`
      {{ a }}
      {{ b }}
      {{ c }}

      <script type="module" build>
        var a = 1;
        let b = 2;
        const c = 3;
      </script>
    `);

    match(output, /\s+1\s+2\s+/);
  });
});
