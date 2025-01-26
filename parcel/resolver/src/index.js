import { isAbsolute } from "node:path";

import { Resolver } from "@parcel/plugin";

export default new Resolver({
  resolve({ specifier }) {
    if (isAbsolute(specifier)) {
      return { filePath: specifier };
    }
  },
});
