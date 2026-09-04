import { Guard } from "./guard.js";
import { HttpStatus } from "./handler.js";

@Guard()
export class DefaultGuard {
  /**
   * @param {unknown} error
   */
  catch(error) {
    return new Response(undefined, {
      status: HttpStatus.InternalServerError,
    });
  }
}
