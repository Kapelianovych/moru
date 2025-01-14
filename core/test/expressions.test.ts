import { equal, match } from "node:assert/strict";
import { suite, test, mock } from "node:test";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

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

  test("expressions can span multiple lines", async () => {
    const output = await compile(`
      {{
        'foo'
      }}
    `);

    match(output, /^\s+foo\s+$/);
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

  test('"expand" attribute should accept objects only', async () => {
    const publish = mock.fn();
    const output = await compile(
      `
        <div expand="{{ {} }}" />
        <div expand="{{ 1 }}" />
      `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.InvalidExpandResult,
    );
    match(output, /<div><\/div>\s+<div><\/div>/);
  });

  test('"expand" attribute object should be spread its entries as element attributes', async () => {
    const output = await compile(
      "<div expand=\"{{ { class: 'foo', id: 'bar' } }}\" />",
    );

    match(output, /<div class="foo" id="bar"><\/div>/);
  });

  test('"expand" attribute object entry should be overridden by an explicitly defined attribute', async () => {
    const output = await compile(
      "<div id=\"identifier\" expand=\"{{ { class: 'foo', id: 'bar' } }}\" />",
    );

    match(output, /<div class="foo" id="identifier"><\/div>/);
  });

  test(
    'if the "expand" attribute value contains an undefined entry, ' +
      "it should not end up as a boolean attribute in HTML",
    async () => {
      const output = await compile(
        '<div expand="{{ { class: undefined } }}" />',
      );

      match(output, /<div><\/div>/);
    },
  );

  test("if an attribute expression evaluates to undefined, then the attribute is removed from an element", async () => {
    const output = await compile(`
      <p class="{{ undefined }}" />
    `);

    match(output, /^\s+<p><\/p>\s+$/);
  });

  test("if a text expression evaluates to undefined, then it is stringified and inserted into HTML", async () => {
    const output = await compile(`
      <p>
        {{ undefined }}
      </p>
    `);

    match(output, /^\s+<p>\s+undefined\s+<\/p>\s+$/);
  });
});
