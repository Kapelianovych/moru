/**
 * @import { RequestHandler } from "./handle.js";
 */

import { join, resolve } from "node:path";
import { createReadStream, existsSync } from "node:fs";

import mime from "mime";

import { extractUrl } from "./request.js";

/**
 * @param {string} directory
 * @return {RequestHandler}
 */
export function files(directory) {
  return (request, response, next) => {
    const url = extractUrl(request);
    let filePath = resolve(...directory.split("/"), ...url.pathname.split("/"));

    if (existsSync(filePath)) {
      const mimeType = mime.getType(filePath);
      const indexFilePath = join(filePath, "index.html");

      if (mimeType != null) {
        response.statusCode = 200;
        response.setHeader("content-type", mimeType);
      } else if (existsSync(indexFilePath)) {
        response.statusCode = 200;
        response.setHeader("content-type", "text/html");
        filePath = indexFilePath;
      } else {
        filePath = "";
      }

      if (filePath.length > 0) {
        createReadStream(filePath).pipe(response);
      } else {
        next();
      }
    } else {
      next();
    }
  };
}
