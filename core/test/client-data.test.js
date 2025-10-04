/**
 * @import { VirtualFile } from "../src/virtual-file.js";
 */

import { match, equal } from "node:assert/strict";
import { mock, suite, test } from "node:test";

import { compile } from "./compiler.js";
import { MessageTag } from "../src/diagnostics.js";

/**
 * @param {VirtualFile} file
 * @param {string} url
 * @returns {string}
 */
function resolveUrl(file, url) {
  return url;
}

suite("client data", () => {
  test("exported variable has to be available in client script", async () => {
    const output = await compile(
      `
        <script type="module">
          import { foo } from "build";
        </script>

        <script type="module" build>
          export const foo = 1;
        </script>
      `,
      { resolveUrl },
    );

    match(output, /const { foo: foo } = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/);
  });

  test("separate named export to the client scripts is also supported", async () => {
    const output = await compile(
      `
        <script type="module">
          import { foo } from "build";
        </script>

        <script type="module" build>
          const foo = 1;

          export { foo };
        </script>
      `,
      { resolveUrl },
    );

    match(output, /const { foo: foo } = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/);
  });

  test("default export to the client scripts is also supported", async () => {
    const output = await compile(
      `
        <script type="module">
          import foo from "build";
        </script>

        <script type="module" build>
          const foo = 1;

          export default foo;
        </script>
      `,
      { resolveUrl },
    );

    match(output, /const foo = JSON\.parse\("1"\);/);
  });

  test("a client script should be able to import values as a namespace", async () => {
    const output = await compile(
      `
        <script type="module">
          import * as foo from "build";
        </script>

        <script type="module" build>
          export const foo = 1;
          export default bar = 2;
        </script>
      `,
      { resolveUrl },
    );

    match(output, /const foo = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/);
  });

  test("a client script should be able to import exported value by default and all named exports", async () => {
    const output = await compile(
      `
        <script type="module">
          import def, { foo } from "build";
        </script>

        <script type="module" build>
          const foo = 1;

          export { foo };

          export default 2;
        </script>
      `,
      { resolveUrl },
    );

    match(output, /const def = JSON\.parse\("2"\);/);
    match(output, /const { foo: foo } = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/);
  });

  test(
    "a client script should be able to import exported value by default " +
      "and all named exports gathered into a namespace",
    async () => {
      const output = await compile(
        `
          <script type="module">
            import def, * as bar from "build";
          </script>

          <script type="module" build>
            const foo = 1;

            export { foo };

            export default 2;
          </script>
        `,
        { resolveUrl },
      );

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
      { resolveUrl, diagnostics: { publish } },
    );

    equal(publish.mock.callCount(), 1);
    equal(
      publish.mock.calls[0].arguments[0].tag,
      MessageTag.MissingExportedValueFromBuild,
    );
  });

  test("should include exported build values into external script file", async () => {
    const writeFileContent = mock.fn(async (url, content) => {});
    await compile(
      `
        <script type="module" src="./foo.js"></script>

        <script type="module" build>
          const foo = 1;

          export { foo };
        </script>
      `,
      {
        resolveUrl,
        async readFileContent() {
          return 'import { foo } from "build";';
        },
        writeFileContent,
      },
    );

    equal(writeFileContent.mock.callCount(), 1);
    match(
      writeFileContent.mock.calls[0].arguments[1],
      /const { foo: foo } = JSON\.parse\("{[\\]+"foo[\\]+":1}"\);/,
    );
  });

  test("if external script file does not contain build import, then content should be unchanged", async () => {
    const writeFileContent = mock.fn(async (url, content) => {});
    await compile(
      `
        <script type="module" src="./foo.js"></script>

        <script type="module" build>
          const foo = 1;

          export { foo };
        </script>
      `,
      {
        resolveUrl,
        async readFileContent() {
          return 'import { foo } from "other-module";';
        },
        writeFileContent,
      },
    );

    equal(writeFileContent.mock.callCount(), 1);
    equal(
      writeFileContent.mock.calls[0].arguments[1],
      'import { foo } from "other-module";',
    );
  });
});
