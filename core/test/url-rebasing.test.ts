import { match } from "node:assert/strict";
import { suite, test } from "node:test";

import { compile } from "./compiler.js";

suite("rebaseUrl", () => {
  test("should rebase HTML element which contains relative URL", async () => {
    const output = await compile('<img src="./foo.webp">', {
      fileUrl: "/folder/index.html",
    });

    match(output, /src="\/folder\/foo.webp"/);
  });

  test("should not rebase if URL is absolute", async () => {
    const output = await compile('<img src="/foo.webp">', {
      fileUrl: "/folder/index.html",
    });

    match(output, /src="\/foo.webp"/);
  });

  test("should not rebase if URL starts with a network protocol", async () => {
    const output = await compile('<img src="https://name.domain/foo.webp">', {
      fileUrl: "/folder/index.html",
    });

    match(output, /src="https:\/\/name.domain\/foo.webp"/);
  });

  test("should not rebase if URL starts with a data protocol", async () => {
    const output = await compile(
      '<img src="data:image/png;base64,sdlkjshwe8923h">',
      {
        fileUrl: "/folder/index.html",
      },
    );

    match(output, /src="data:image\/png;base64,sdlkjshwe8923h"/);
  });

  test("should not rebase if URL starts with a hash symbol", async () => {
    const output = await compile('<img src="#/foo.webp">', {
      fileUrl: "/folder/index.html",
    });

    match(output, /src="#\/foo.webp"/);
  });

  test("should rebase relative imports of the client-side scripts", async () => {
    const output = await compile(
      `
        <script type="module">
          import something from './image.webp';
        </script>
      `,
      {
        fileUrl: "/folder/index.html",
      },
    );

    match(output, /import something from '\/folder\/image.webp';/);
  });

  test('should rebase relative URLs of styles which are inside of the "url" function', async () => {
    const output = await compile(
      `
      <style>
        @import url("./foo.css");

        body {
          background-color: url(./image.webp);
        }
      </style>
      `,
      {
        fileUrl: "/folder/index.html",
      },
    );

    match(output, /@import url\("\/folder\/foo.css"\);/);
    match(output, /background-color: url\(\/folder\/image.webp\);/);
  });
});
