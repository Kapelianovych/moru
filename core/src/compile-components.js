/**
 * @import { Element } from "domhandler";
 *
 * @import { ModuleCompiler } from "./compile-html.js";
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { SlotContentCompiler } from "./slot-content-compiler.js";
 * @import { HtmlNodesCollection } from "./collect-html-nodes.js";
 * @import { Options } from "./options.js";
 */

import { parseHtml } from "./parse-html.js";
import { replaceElementWithMultiple } from "./html-nodes.js";
import { createLifecycle } from "./lifecycle.js";
import { createEmptyHtmlNodesCollection } from "./collect-html-nodes.js";

/**
 * @param {HtmlNodesCollection} htmlNodesCollection
 * @param {ModuleCompiler} compileModule
 * @param {Map<Element, Record<string, SlotContentCompiler>>} slotContentCompilersByComponent
 * @param {Options} options
 * @returns {Promise<void>}
 */
export async function compileComponents(
  htmlNodesCollection,
  compileModule,
  slotContentCompilersByComponent,
  options,
) {
  for (const { url, node } of htmlNodesCollection.components) {
    const slotContentCompilers =
      /** @type {Record<string, SlotContentCompiler>} */ (
        slotContentCompilersByComponent.get(node)
      );

    const componentContent = await options.readFileContent(url);
    /** @type {VirtualFile} */
    const componentFile = {
      url,
      content: componentContent,
    };
    const ast = parseHtml(componentFile);
    /** @type {Record<string, unknown>} */
    const currentModuleExportedValues = options.exports;
    const lifecycle = createLifecycle();
    const localHtmlNodesCollection = createEmptyHtmlNodesCollection();

    localHtmlNodesCollection.fragments = htmlNodesCollection.fragments;
    localHtmlNodesCollection.portals = htmlNodesCollection.portals;
    localHtmlNodesCollection.transferrableElements =
      htmlNodesCollection.transferrableElements;
    localHtmlNodesCollection.raws = htmlNodesCollection.raws;

    options.exports = {};
    options.properties = node.attribs;

    await compileModule({
      ast,
      file: componentFile,
      lifecycle,
      htmlNodesCollection: localHtmlNodesCollection,
      compilerOptions: options,
      slotContentCompilersFromParent: slotContentCompilers,
    });

    options.exports = currentModuleExportedValues;

    replaceElementWithMultiple(node, ast.children);
  }

  htmlNodesCollection.components.length = 0;
}
