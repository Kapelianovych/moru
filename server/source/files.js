import { sep, resolve, extname } from "node:path";
import { existsSync, createReadStream } from "node:fs";

import mime from "mime";

import { group } from "./session.js";
import {
  handler,
  HandlerResponse,
  HttpMethod,
  HttpStatus,
  SkipHandler,
} from "./handler.js";

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
   * @param {string} [prefix]
   */
  constructor(prefix) {
    this.#prefix = prefix ?? "";
  }

  handle() {
    let filePath = resolve(this.#prefix, this.#slug.slice(1));
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

    if (existsSync(filePath)) {
      return new HandlerResponse(
        HttpStatus.Ok,
        {
          "content-type": mimeType,
        },
        createReadStream(filePath),
      );
    } else {
      return SkipHandler;
    }
  }
}
