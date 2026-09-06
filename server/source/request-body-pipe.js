import { Pipe } from "./pipe.js";

@Pipe()
export class RequestBodyPipe {
  /**
   * @param {Request} request
   */
  transform(request) {
    const type = request.headers.get("content-type") ?? "text/plain";

    if (type === "application/json") {
      return request.json();
    } else if (
      type === "application/x-www-form-urlencoded" ||
      type === "multipart/form-data"
    ) {
      return request.formData();
    } else if (type.includes("text/")) {
      return request.text();
    } else {
      return request.arrayBuffer();
    }
  }
}
