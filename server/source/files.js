/**
 * @import { PossibleResponseValue } from "./handler.js";
 */

import { Readable } from "node:stream";
import { join, resolve } from "node:path";
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

  /**
   * @param {string} path
   */
  #exists(path) {
    return promises.access(path, constants.F_OK).then(
      () => true,
      () => false,
    );
  }

  /**
   * @param {string} path
   * @returns {Promise<PossibleResponseValue>}
   */
  async #createResponse(path) {
    if (await this.#exists(path)) {
      const stats = await promises.stat(path);

      if (stats.isSymbolicLink() && !this.#followSymlinks) {
        return new Response(undefined, { status: HttpStatus.Forbidden });
      } else if (stats.isDirectory()) {
        return this.#createResponse(join(path, "index.html"));
      } else {
        return new Response(
          /**
           * @type {ReadableStream}
           */
          (Readable.toWeb(createReadStream(path))),
          {
            status: HttpStatus.Ok,
            headers: {
              "content-type": mime.getType(path) ?? "application/octet-stream",
            },
          },
        );
      }
    } else {
      return SkipHandler;
    }
  }

  async handle() {
    const path = resolve(this.#prefix, this.#slug);

    if (
      // Check if path is inside the defined prefix.
      path.startsWith(this.#prefix)
    ) {
      return this.#createResponse(path);
    } else {
      return new Response(undefined, { status: HttpStatus.Forbidden });
    }
  }
}
