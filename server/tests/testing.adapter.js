import { Adapter } from "../source/index.js";

@Adapter()
export class TestingAdapter {
  /**
   * @param {function(Response, Response): void} callback
   */
  static withRespondWith(callback) {
    return @Adapter()
    class {
      respondWith = callback;
      /**
       * @param {Request} request
       */
      createWebRequest(request) {
        return request;
      }
    };
  }
  /**
   * @param {Request} request
   */
  createWebRequest(request) {
    return request;
  }
  /**
   * @param {Response} webResponse
   * @param {Response} response
   */
  respondWith(webResponse, response) {}
}
