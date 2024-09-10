import { isDev } from "moru";

import { isClient } from "./constants.js";

if (isDev && isClient) {
  console.warn(
    "The server-side connector must not be used in the client-side code.",
  );
}
