import { match, equal } from "node:assert/strict";
import { mock, suite, test } from "node:test";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

suite("client data", () => {
  test("exported variable has to be available in client script", async () => {
    const output = await compile(`
      <script type="module">
        import { foo } from "build";
      </script>

      <script type="module" build>
        export const foo = 1;
      </script>
    `);

    match(output, /const { foo: foo } = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/);
  });

  test("separate named export to the client scripts is also supported", async () => {
    const output = await compile(`
      <script type="module">
        import { foo } from "build";
      </script>

      <script type="module" build>
        const foo = 1;

        export { foo };
      </script>
    `);

    match(output, /const { foo: foo } = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/);
  });

  test("default export to the client scripts is also supported", async () => {
    const output = await compile(`
      <script type="module">
        import foo from "build";
      </script>

      <script type="module" build>
        const foo = 1;

        export default foo;
      </script>
    `);

    match(output, /const foo = JSON\.parse\("1"\);/);
  });

  test("a client script should be able to import values as a namespace", async () => {
    const output = await compile(`
      <script type="module">
        import * as foo from "build";
      </script>

      <script type="module" build>
        export const foo = 1;
        export default bar = 2;
      </script>
    `);

    match(output, /const foo = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/);
  });

  test("a client script should be able to import exported value by default and all named exports", async () => {
    const output = await compile(`
      <script type="module">
        import def, { foo } from "build";
      </script>

      <script type="module" build>
        const foo = 1;

        export { foo };

        export default 2;
      </script>
    `);

    match(output, /const def = JSON\.parse\("2"\);/);
    match(output, /const { foo: foo } = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/);
  });

  test(
    "a client script should be able to import exported value by default " +
      "and all named exports gathered into a namespace",
    async () => {
      const output = await compile(`
        <script type="module">
          import def, * as bar from "build";
        </script>

        <script type="module" build>
          const foo = 1;

          export { foo };

          export default 2;
        </script>
      `);

      match(output, /const def = JSON\.parse\("2"\);/);
      match(output, /const bar = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/);
    },
  );

  test("error when a client script imports value which is not exported", async () => {
    const publish = mock.fn();
    await compile(
      `
      <script type="module">
        import def from "build";
      </script>

      <script type="module" build>
        const foo = 1;

        export { foo };
      </script>
    `,
      { diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.MissingExportedValueFromBuild,
    );
  });
});
