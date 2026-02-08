import { Readable } from "node:stream";
import { sep, resolve, extname } from "node:path";
import { promises, constants, createReadStream } from "node:fs";

import mime from "mime";

import { group } from "./session.js";
import { handler, HttpMethod, HttpStatus, SkipHandler } from "./handler.js";

@handler({
  pattern: "/:slug(.*)",
  method: HttpMethod.Get,
})
export class StaticFilesHandler {
  @group #slug = "";
  /**
   * @type {string}
   */
  #prefix;
  /**
   * @type {boolean}
   */
  #followSymlinks;

  /**
   * @param {string} [prefix]
   * @param {boolean} [followSymlinks]
   */
  constructor(prefix, followSymlinks) {
    this.#prefix = resolve(prefix ?? "");
    this.#followSymlinks = followSymlinks ?? false;
  }

  async handle() {
    let filePath = resolve(this.#prefix, this.#slug);

    if (
      // Check if path is inside the defined prefix.
      filePath.startsWith(this.#prefix)
    ) {
      const extension = extname(filePath);
      let mimeType = mime.getType(extension);

      if (extension.length === 0) {
        filePath = `${filePath}${filePath.endsWith(sep) ? "" : sep}index.html`;
        mimeType =
          /**
           * @type {string}
           */
          (mime.getType(".html"));
      }

      mimeType ??=
        /**
         * @type {string}
         */
        (mime.getType(".txt"));

      const fileExists = await promises.access(filePath, constants.F_OK).then(
        () => true,
        () => false,
      );

      if (fileExists) {
        const stats = await promises.stat(filePath);

        if (stats.isSymbolicLink() && !this.#followSymlinks) {
          return new Response(undefined, { status: HttpStatus.Forbidden });
        } else {
          return new Response(
            /**
             * @type {ReadableStream}
             */
            (Readable.toWeb(createReadStream(filePath))),
            {
              status: HttpStatus.Ok,
              headers: { "content-type": mimeType },
            },
          );
        }
      } else {
        return SkipHandler;
      }
    } else {
      return new Response(undefined, { status: HttpStatus.Forbidden });
    }
  }
}
