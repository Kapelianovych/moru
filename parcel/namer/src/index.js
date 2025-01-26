import { normalize } from "node:path";

import { Namer } from "@parcel/plugin";

const HTML_PAGE_SUFFIX = ".page";

export default new Namer({
  name({ bundle, bundleGraph }) {
    if (bundle.type === "html") {
      const bundleGroup =
        bundleGraph.getBundleGroupsContainingBundle(bundle)[0];
      const isEntry = bundleGraph.isEntryBundleGroup(bundleGroup);
      const entryAsset = bundle.getMainEntry();

      if (isEntry) {
        const entryRoot = bundleGraph.getEntryRoot(bundle.target);
        const outputFilePath = normalize(entryAsset?.filePath ?? "/index.html");

        return outputFilePath
          .replace(entryRoot, "")
          .replace(HTML_PAGE_SUFFIX, "")
          .slice(1);
      }
    }
  },
});
