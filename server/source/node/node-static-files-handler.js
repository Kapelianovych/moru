/**
 * @import { SessionResponse } from "../handler.js";
 */

import { Readable } from "node:stream";
import { join, resolve } from "node:path";
import { promises, constants, createReadStream } from "node:fs";

import mime from "mime-types";

import { Group } from "../session.js";
import { Handler, HttpMethod, HttpStatus, TryNext } from "../handler.js";

@Handler({
  pattern: "/:slug(.*)",
  method: HttpMethod.Get,
})
export class NodeStaticFilesHandler {
  @Group() #slug = "";
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
   * @returns {Promise<SessionResponse>}
   */
  async #createResponse(path) {
    if (await this.#exists(path)) {
      const stats = await promises.stat(path);

      if (stats.isSymbolicLink() && !this.#followSymlinks) {
        return new Response(undefined, { status: HttpStatus.Forbidden });
      } else if (stats.isDirectory()) {
        return this.#createResponse(join(path, "index.html"));
      } else {
        return new Response(Readable.toWeb(createReadStream(path)), {
          status: HttpStatus.Ok,
          headers: {
            "content-type": mime.lookup(path) || "application/octet-stream",
          },
        });
      }
    } else {
      return TryNext;
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
