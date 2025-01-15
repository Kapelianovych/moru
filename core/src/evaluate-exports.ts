import { type HtmlNodesCollection } from "./collect-html-nodes.js";
import { findAndEvaluateInHtmlExpressionsIn } from "./in-html-expressions.js";
import { createUrlCreator, type UrlCreator } from "./location.js";
import { type Options } from "./options.js";
import { type VirtualFile } from "./virtual-file.js";

export async function evaluateExports(
  collection: HtmlNodesCollection,
  localThis: Record<string, unknown>,
  file: VirtualFile,
  options: Options,
): Promise<void> {
  const url: UrlCreator = createUrlCreator(file, options);

  for (const exportVariableName in collection.exports) {
    const node = collection.exports[exportVariableName];

    options.exports[exportVariableName] =
      await findAndEvaluateInHtmlExpressionsIn(
        node.attribs.value,
        localThis,
        node,
        url,
        file,
        options,
      );
  }
}
