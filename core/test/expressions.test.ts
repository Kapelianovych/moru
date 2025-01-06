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

      <script build>
        var a = 1;
        let b = 2;
        const c = 3;
      </script>
    `);

    match(output, /\s+1\s+2\s+/);
  });

  test("functions can participate in expressions", async () => {
    const output = await compile(`
      {{ dummy() }}

      <script build>
        function dummy() {
          return 'word';
        }
      </script>
    `);

    match(output, /^\s+word\s+$/);
  });

  test("classes can participate in expressions", async () => {
    const output = await compile(`
      {{ new Dummy().toString() }}

      <script build>
        class Dummy {
          toString() {
            return 'this is dummy';
          }
        }
      </script>
    `);

    match(output, /^\s+this is dummy\s+$/);
  });

  test("expressions can represent attribute values", async () => {
    const output = await compile('<p class="{{ `foo` }}"></p>');

    equal(output, '<p class="foo"></p>');
  });

  test("attribute values can mix static parts and expressions", async () => {
    const output = await compile(
      '<p class="static {{ `foo` }} {{ `bar` }}"></p>',
    );

    equal(output, '<p class="static foo bar"></p>');
  });
});
