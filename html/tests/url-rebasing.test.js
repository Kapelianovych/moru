/** @import { Mock } from "node:test"; */

/**
 * @import { Options } from '../source/options.js';
 * @import { VirtualFile } from '../source/virtual-file.js';
 */

import { ok, match, equal } from "node:assert/strict";
import { mock, suite, test } from "node:test";

import { compile } from "./compiler.js";

/**
 * @param {Array<string>} urls
 * @param {Mock<Options["resolveUri"]>} resolver
 * @returns {boolean}
 */
function hasUrlResolverCalledWith(urls, resolver) {
  return resolver.mock.calls
    .map((call) => call.arguments[1])
    .every((url) => urls.includes(url));
}

/**
 *
 * @param {VirtualFile} file
 * @param {string} url
 * @returns {string}
 */
function testResolver(file, url) {
  return "test";
}

suite("rebaseUrl", () => {
  test('"HTML component imports should be rebased"', async () => {
    const resolveUri = mock.fn(testResolver);
    await compile(
      `
        <import from="something.html" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something.html");
  });

  test('"rebaseUrl" should be called for the "itemtype" HTML attribute', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <div itemtype="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /itemtype="test"/);
  });

  test('"rebaseUrl" should be called for the "a" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <a href="something" ping="foo" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 2);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    equal(resolveUri.mock.calls[1].arguments[1], "foo");
    match(output, /href="test" ping="test"/);
  });

  test('"rebaseUrl" should be called for the "area" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <area href="something" ping="foo" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 2);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    equal(resolveUri.mock.calls[1].arguments[1], "foo");
    match(output, /href="test" ping="test"/);
  });

  test('"rebaseUrl" should be called for the "audio" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <audio src="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /src="test"/);
  });

  test('"rebaseUrl" should be called for the "base" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <base href="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /href="test"/);
  });

  test('"rebaseUrl" should be called for the "blockquote" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <blockquote cite="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /cite="test"/);
  });

  test('"rebaseUrl" should be called for the "button" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <button formaction="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /formaction="test"/);
  });

  test('"rebaseUrl" should be called for the "del" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <del cite="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /cite="test"/);
  });

  test('"rebaseUrl" should be called for the "embed" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <embed src="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /src="test"/);
  });

  test('"rebaseUrl" should be called for the "form" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <form action="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /action="test"/);
  });

  test('"rebaseUrl" should be called for the "html" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <html manifest="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /manifest="test"/);
  });

  test('"rebaseUrl" should be called for the "iframe" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <iframe src="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /src="test"/);
  });

  test('"rebaseUrl" should be called for the "img" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <img src="something" srcset="foo, bar 2x, bak 100w" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 4);
    ok(
      hasUrlResolverCalledWith(["something", "foo", "bar", "bak"], resolveUri),
    );
    match(output, /src="test"/);
    match(output, /srcset="test, test 2x, test 100w"/);
  });

  test('"rebaseUrl" should be called for the "input" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <input formaction="something" src="foo" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 2);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    equal(resolveUri.mock.calls[1].arguments[1], "foo");
    match(output, /formaction="test"/);
    match(output, /src="test"/);
  });

  test('"rebaseUrl" should be called for the "ins" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <ins cite="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /cite="test"/);
  });

  test('"rebaseUrl" should be called for the "link" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <link href="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /href="test"/);
  });

  test('"rebaseUrl" should be called for the "meta" element if "http-equiv=refresh"', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <meta content="3; url=something" http-equiv="refresh" />
        <meta content="dark" name="color-scheme" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /content="3; url=test" http-equiv="refresh"/);
    match(output, /content="dark" name="color-scheme"/);
  });

  test('"rebaseUrl" should be called for the "object" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <object data="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /data="test"/);
  });

  test('"rebaseUrl" should be called for the "q" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <q cite="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /cite="test"/);
  });

  test('"rebaseUrl" should be called for the "script" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <script src="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /src="test"/);
  });

  test('"rebaseUrl" should be called for the "source" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <source src="something" srcset="foo" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 2);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    equal(resolveUri.mock.calls[1].arguments[1], "foo");
    match(output, /src="test" srcset="test"/);
  });

  test('"rebaseUrl" should be called for the "track" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <track src="something" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /src="test"/);
  });

  test('"rebaseUrl" should be called for the "video" element', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <video src="something" poster="foo" />
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 2);
    ok(hasUrlResolverCalledWith(["something", "foo"], resolveUri));
    match(output, /src="test" poster="test"/);
  });

  test("should rebase JS import declaration", async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <script type="module">
          import value from 'something';
        </script>
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /import value from 'test'/);
  });

  test("should rebase JS import expression", async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <script type="module">
          const value = import('something');
        </script>
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 1);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    match(output, /const value = import\('test'\);/);
  });

  test('should rebase URL of the CSS "url" function', async () => {
    const resolveUri = mock.fn(testResolver);
    const output = await compile(
      `
        <style>
          @import url("something");

          body {
            background-color: url(foo);
          }
        </style>
      `,
      {
        resolveUri,
      },
    );

    equal(resolveUri.mock.callCount(), 2);
    equal(resolveUri.mock.calls[0].arguments[1], "something");
    equal(resolveUri.mock.calls[1].arguments[1], "foo");
    match(output, /@import url\("test"\);/);
    match(output, /background-color: url\(test\);/);
  });
});
