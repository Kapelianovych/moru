import { equal } from "node:assert/strict";
import { test, suite } from "node:test";

import { compile } from "./compiler.js";

suite("basic", () => {
  test("outputs raw HTML unchanged", async () => {
    const code = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;

    const output = await compile(code);

    equal(output, code);
  });

  test("allows self-closing tags", async () => {
    const output = await compile("<div />");

    equal(output, "<div></div>");
  });
});
