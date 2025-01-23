import { test, suite, mock } from "node:test";
import { equal, match, deepEqual } from "node:assert/strict";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

suite("fragment", () => {
  test('"fragment" should be removed from resulting HTML', async () => {
    const output = await compile(`
      <fragment />
    `);

    equal(output.trim(), "");
  });

  test('children of the "fragment" element should not be removed from HTML', async () => {
    const output = await compile(`
      <fragment>
        <p>hello</p>
      </fragment>
    `);

    match(output, /\s+<p>hello<\/p>\s+/);
  });

  test("fragments with a name do not end up in HTML if there are no reference to it", async () => {
    const output = await compile(`
      <fragment name="foo">
        <p />
      </fragment>
    `);

    equal(output.trim(), "");
  });

  test("element with the tagName equals to the name of defined markup fragment should be replaced with fragment's children", async () => {
    const output = await compile(`
      <fragment name="foo">
        <p />
      </fragment>

      <foo />
    `);

    match(output, /^\s+<p><\/p>\s+$/);
  });

  test("any evaluatable statement inside markup fragments should be evaluated for each reference separately", async () => {
    let counter = 1;
    const fn = mock.fn(() => counter++);
    const output = await compile(
      `
        <fragment name="foo">
          <p class="{{ String(props.fn()) }}" />
        </fragment>

        <foo />
        <foo />
      `,
      { properties: { fn } },
    );

    match(output, /^\s+<p class="1"><\/p>\s+<p class="2"><\/p>\s+$/);
    equal(fn.mock.callCount(), 2);
  });

  test("markup fragments should be inheritable", async () => {
    const output = await compile(`
      <fragment name="foo">
        <p />
      </fragment>

      <if condition="{{ true }}">
        <foo />
      </if>
    `);

    match(output, /^\s+<p><\/p>\s+$/);
  });

  test("markup fragments should not be shared by scopes on the same level", async () => {
    const output = await compile(`
      <if condition="{{ true }}">
        <p />

        <fragment name="bar">
          <div />
        </fragment>
      </if>

      <if condition="{{ true }}">
        <bar />
      </if>
    `);

    match(output, /^\s+<p><\/p>\s+<bar><\/bar>\s+$/);
  });

  test("markup fragments should not be accessible from nested scopes", async () => {
    const output = await compile(`
      <if condition="{{ true }}">
        <fragment name="bar">
          <div />
        </fragment>
      </if>

      <bar />
    `);

    match(output, /^\s+<bar><\/bar>\s+$/);
  });

  test("it should not be possible to create markup fragments using any of the reserved element names", async () => {
    const publish = mock.fn();
    await compile(
      `
        <fragment name="if" />
        <fragment name="else-if" />
        <fragment name="else" />
        <fragment name="for" />
        <fragment name="raw" />
        <fragment name="portal" />
        <fragment name="fragment" />
        <fragment name="import" />
        <fragment name="export" />
        <fragment name="script" />
        <fragment name="style" />
        <fragment name="slot" />
      `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 12);
    deepEqual(
      publish.mock.calls.map((call) => call.arguments[0].tag),
      new Array(12).fill(MessageTag.ProhibitedReservedComponentRemapping),
    );
  });

  test(
    "default values for variables in markup fragments should be applied " +
      'when variable is not defined or has the "undefined" value',
    async () => {
      const output = await compile(`
        <fragment name="foo" default:count="{{ 1 }}">
          count is {{ count }}
        </fragment>

        <foo />

        <if condition="{{ true }}">
          <foo />

          <script build>
            let count;
          </script>
        </if>

        <if condition="{{ true }}">
          <foo />

          <script build>
            count = 2;
          </script>
        </if>
      `);

      match(output, /count is 1\s+count is 1\s+count is 2/);
    },
  );

  test(
    "explicitly provided property to markup fragment instantiation " +
      "should override default value and have higher precedence over global variable",
    async () => {
      const output = await compile(`
        <fragment name="foo" default:count="{{ 1 }}">
          count is {{ count }}
        </fragment>

        <foo count="{{ 3 }}" />

        <script build>
          const count = 2;
        </script>
      `);

      match(output, /count is 3/);
    },
  );
});
