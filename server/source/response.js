/**
 * @import { ServerResponse, IncomingMessage } from "node:http";
 */

/**
 * @param {ServerResponse<IncomingMessage>} response
 * @param {unknown} data
 */
export function sendJson(response, data) {
  response.setHeader("content-type", "application/json");
  response.write(JSON.stringify(data));
  response.end();
}
