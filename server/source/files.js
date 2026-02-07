import { sep, resolve, extname } from "node:path";
import { promises, constants, createReadStream } from "node:fs";

import mime from "mime";

import { group } from "./session.js";
import {
  handler,
  HandlerResponse,
  HttpMethod,
  HttpStatus,
  SkipHandler,
} from "./handler.js";

/**
 * @typedef {Object} StaticFilesHandlerOptions
 * @property {string} [prefix]
 * @property {boolean} [followSymlinks]
 */

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
   * @param {StaticFilesHandlerOptions} [options]
   */
  constructor(options) {
    this.#prefix = resolve(options?.prefix ?? "");
    this.#followSymlinks = options?.followSymlinks ?? false;
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
          return new HandlerResponse(HttpStatus.Forbidden, {}, undefined);
        } else {
          return new HandlerResponse(
            HttpStatus.Ok,
            {
              "content-type": mimeType,
            },
            createReadStream(filePath),
          );
        }
      } else {
        return SkipHandler;
      }
    } else {
      return new HandlerResponse(HttpStatus.Forbidden, {}, undefined);
    }
  }
}
