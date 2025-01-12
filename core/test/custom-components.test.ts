import { mock, suite, test } from "node:test";
import { match, equal, deepEqual } from "node:assert/strict";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

suite("custom components", () => {
  test("should render imported component", async () => {
    const output = await compile(
      `
        <import from="./foo.html" />

        <foo />
      `,
      {
        async readFileContent(url) {
          return "foo component";
        },
      },
    );

    match(output, /^\s+foo component\s+$/);
  });

  test("relative import of the custom component should be resolved relative to the importer file", async () => {
    const readFileContent = mock.fn(async (url: string): Promise<string> => {
      return "component";
    });
    await compile(
      `
        <import from="./foo.html" />

        <foo />
      `,
      {
        fileUrl: "/folder/index.html",
        readFileContent,
      },
    );

    equal(readFileContent.mock.calls[0].arguments[0], "/folder/foo.html");
  });

  test("absolute import of the custom component should be used as is", async () => {
    const readFileContent = mock.fn(async (url: string): Promise<string> => {
      return "component";
    });
    await compile(
      `
        <import from="/foo.html" />

        <foo />
      `,
      {
        fileUrl: "/folder/index.html",
        readFileContent,
      },
    );

    equal(readFileContent.mock.calls[0].arguments[0], "/foo.html");
  });

  test("package import of the custom component should be used as is", async () => {
    const readFileContent = mock.fn(async (url: string): Promise<string> => {
      return "component";
    });
    await compile(
      `
        <import from="package/foo.html" />

        <foo />
      `,
      {
        fileUrl: "/folder/index.html",
        readFileContent,
      },
    );

    equal(readFileContent.mock.calls[0].arguments[0], "package/foo.html");
  });

  test("should be able to provide an alias for the imported component", async () => {
    const output = await compile(
      `
        <import from="package/foo.html" as="bar" />

        <bar />
      `,
      {
        async readFileContent() {
          return "component";
        },
      },
    );

    match(output, /^\s+component\s+$/);
  });

  test("an element without matching component import should be left as is", async () => {
    const output = await compile(
      `
        <import from="package/foo.html" as="bar" />

        <non-matched-element />
      `,
      {
        async readFileContent() {
          return "component";
        },
      },
    );

    match(output, /^\s+<non-matched-element><\/non-matched-element>\s+$/);
  });

  test("should be able to provide a component for native elements", async () => {
    const output = await compile(
      `
        <import from="package/foo.html" as="p" />

        <p />
      `,
      {
        async readFileContent() {
          return "p component";
        },
      },
    );

    match(output, /^\s+p component\s+$/);
  });

  test("should not be able to provide a component for built-in components and scripts", async () => {
    const publish = mock.fn();
    await compile(
      `
        <import from="./if.html" />
        <import from="./else-if.html" />
        <import from="./else.html" />
        <import from="./for.html" />
        <import from="./raw.html" />
        <import from="./portal.html" />
        <import from="./fragment.html" />
        <import from="./import.html" />
        <import from="./script.html" />
      `,
      {
        diagnostics: { publish },
      },
    );

    equal(publish.mock.callCount(), 9);
    deepEqual(
      publish.mock.calls.map((call) => call.arguments[0].tag),
      new Array(9).fill(MessageTag.ProhibitedReservedComponentRemapping),
    );
  });

  test("custom component should receive properties passed from parent components", async () => {
    const output = await compile(
      `
        <import from="./nested.html" />

        <nested foo="{{ obj }}" />

        <script build>
          const obj = {
            a: 11,
          };
        </script>
      `,
      {
        async readFileContent() {
          return "{{ typeof props.foo.a }} {{ props.foo.a }}";
        },
      },
    );

    match(output, /^\s+number 11\s+$/);
  });

  test("children of the nested component should be inserted into a <slot /> element", async () => {
    const output = await compile(
      `
        <import from="./nested.html" />

        <nested>
          child
        </nested>
      `,
      {
        async readFileContent() {
          return "<div><slot /></div>";
        },
      },
    );

    match(output, /^\s+<div>\s+child\s+<\/div>\s+$/);
  });

  test("if custom component does not have a <slot /> element, all it's children will be ignored", async () => {
    const output = await compile(
      `
        <import from="./nested.html" />

        <nested>
          child
        </nested>
      `,
      {
        async readFileContent() {
          return "<div></div>";
        },
      },
    );

    match(output, /^\s+<div><\/div>\s+$/);
  });

  test("children of the custom component can replace named slot", async () => {
    const output = await compile(
      `
        <import from="./nested.html" />

        <nested>
          <p slot="text">child</p>
        </nested>
      `,
      {
        async readFileContent() {
          return '<div><slot name="text" /></div>';
        },
      },
    );

    match(output, /^\s+<div><p>child<\/p><\/div>\s+$/);
  });

  test('the "fragment" can be used to group and forward children of the custom component to a named slot', async () => {
    const output = await compile(
      `
        <import from="./nested.html" />

        <nested>
          <fragment slot="text">child</fragment>
        </nested>
      `,
      {
        async readFileContent() {
          return '<div><slot name="text" /></div>';
        },
      },
    );

    match(output, /^\s+<div>child<\/div>\s+$/);
  });

  test("any expression inside the custom component's children should be evaluated in a parent scope", async () => {
    const output = await compile(
      `
        <import from="./nested.html" />

        <nested>
          {{ a }}
        </nested>

        <script build>
          let a = 1;
        </script>
      `,
      {
        async readFileContent() {
          return `
            <slot />

            <script build>
              let a = 2;
            </script>
          `;
        },
      },
    );

    match(output, /^\s+1\s+$/);
  });

  test("nested component should be able to pass attributes to its children though slot's attributes", async () => {
    const output = await compile(
      `
        <import from="./some.html" />

        <some>
          <div />
        </some>
      `,
      {
        async readFileContent() {
          return '<slot id="foo" />';
        },
      },
    );

    match(output, /<div id="foo"><\/div>/);
  });

  test("slot's attributes should replace children's attributes by default", async () => {
    const output = await compile(
      `
        <import from="./some.html" />

        <some>
          <div id="bar" />
        </some>
      `,
      {
        async readFileContent() {
          return '<slot id="foo" />';
        },
      },
    );

    match(output, /<div id="foo"><\/div>/);
  });

  test(
    "if slot's attribute is a function, it accepts child node's current attribute value and " +
      "the function execution result should replace children's attribute",
    async () => {
      const output = await compile(
        `
          <import from="./some.html" />

          <some>
            <div id="bar" />
          </some>
        `,
        {
          async readFileContent() {
            return "<slot id=\"{{ (classes) => classes + ' foo' }}\" />";
          },
        },
      );

      match(output, /<div id="bar foo"><\/div>/);
    },
  );

  test("slot's attributes should be populated to all element children", async () => {
    const output = await compile(
      `
        <import from="./some.html" />

        <some>
          <div  />
          text
          <p />
        </some>
      `,
      {
        async readFileContent() {
          return '<slot id="foo" />';
        },
      },
    );

    match(output, /<div id="foo"><\/div>\s+text\s+<p id="foo"><\/p>/);
  });

  test('"fragment" should not receive slot\'s attributes but its children', async () => {
    const output = await compile(
      `
        <import from="./some.html" />

        <some>
          <fragment>
            <div  />
            <fragment>
              <p />
            </fragment>
          </fragment>
        </some>
      `,
      {
        async readFileContent() {
          return '<slot id="foo" />';
        },
      },
    );

    match(output, /<div id="foo"><\/div>\s+<p id="foo"><\/p>/);
  });
});
