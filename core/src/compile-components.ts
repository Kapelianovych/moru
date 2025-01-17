import { type ChildNode, type Element } from "domhandler";

import { parseHtml } from "./parse-html.js";
import { replaceElementWithMultiple } from "./html-nodes.js";
import { createComponentMissingExportMessage } from "./diagnostics.js";
import type {
  ModuleCompiler,
  ScopePreCompiler,
  ScopePreCompilerOptions,
} from "./compile-html.js";
import type { VirtualFile } from "./virtual-file.js";
import {
  getLocationOfHtmlNode,
  type HtmlSlotElement,
  isHtmlSlottableElement,
} from "./html-nodes.js";

export async function compileComponents(
  scopePreCompilerOptions: ScopePreCompilerOptions,
  preCompileScope: ScopePreCompiler,
  compileModule: ModuleCompiler,
): Promise<void> {
  for (const {
    url,
    node,
    exports,
    hasAssignDefinitions,
  } of scopePreCompilerOptions.htmlNodesCollection.components) {
    const componentContent =
      await scopePreCompilerOptions.compilerOptions.readFileContent(url);
    const componentFile: VirtualFile = {
      url,
      content: componentContent,
    };
    const ast = parseHtml(componentFile);
    const childSlots: Array<HtmlSlotElement> = [];
    const currentModuleExportedValues: Record<string, unknown> =
      scopePreCompilerOptions.compilerOptions.exports;
    const currentModuleSlots: Array<HtmlSlotElement> =
      scopePreCompilerOptions.htmlNodesCollection.slots;

    scopePreCompilerOptions.compilerOptions.exports = {};
    scopePreCompilerOptions.htmlNodesCollection.slots = childSlots;
    scopePreCompilerOptions.compilerOptions.properties = node.attribs;

    await compileModule({
      ast,
      file: componentFile,
      htmlNodesCollection: scopePreCompilerOptions.htmlNodesCollection,
      compilerOptions: scopePreCompilerOptions.compilerOptions,
    });

    // Return back current slots, so they can be passed to potential parent component.
    scopePreCompilerOptions.htmlNodesCollection.slots = currentModuleSlots;

    if (hasAssignDefinitions) {
      // We skipped walking over component's children because any expression inside potentially
      // use exported value which are available only at the current point.
      await evaluateChildren(
        node,
        exports,
        scopePreCompilerOptions,
        preCompileScope,
      );
    }

    scopePreCompilerOptions.compilerOptions.exports =
      currentModuleExportedValues;

    const childrenGroupedBySlots = getComponentChildrenGroupedBySlots(node);

    replaceElementWithMultiple(node, ast.children);

    childSlots.forEach((slot) => {
      const slotName = slot.attribs.name || "default";
      const replacerNodes = childrenGroupedBySlots[slotName];

      if (replacerNodes) {
        replaceElementWithMultiple(slot, replacerNodes);
      }

      // Replace nodes only once.
      delete childrenGroupedBySlots[slotName];
    });

    // Empty slots store to avoid populating it up the tree.
    childSlots.length = 0;
  }

  scopePreCompilerOptions.htmlNodesCollection.components.length = 0;
}

function getComponentChildrenGroupedBySlots(
  componentElement: Element,
): Record<string, Array<ChildNode>> {
  const groups: Record<string, Array<ChildNode>> = {
    default: [],
  };

  componentElement.children.forEach((childNode) => {
    if (isHtmlSlottableElement(childNode)) {
      const slotName = childNode.attribs.slot;

      if (slotName) {
        groups[slotName] ??= [];
        groups[slotName].push(childNode);
      } else {
        groups.default.push(childNode);
      }

      delete childNode.attribs.slot;
    } else {
      groups.default.push(childNode);
    }
  });

  return groups;
}

async function evaluateChildren(
  node: Element,
  exportsMap: Record<string, string>,
  scopePreCompilerOptions: ScopePreCompilerOptions,
  preCompileScope: ScopePreCompiler,
): Promise<void> {
  const valuesToRestore: Record<string, unknown> = {};
  const valuesToDelete: Array<string> = [];

  for (const name in exportsMap) {
    if (name in scopePreCompilerOptions.compilerOptions.exports) {
      const importName = exportsMap[name];

      if (importName in scopePreCompilerOptions.localThis) {
        valuesToRestore[importName] =
          scopePreCompilerOptions.localThis[importName];
      } else {
        valuesToDelete.push(importName);
      }

      scopePreCompilerOptions.localThis[importName] =
        scopePreCompilerOptions.compilerOptions.exports[name];
    } else {
      scopePreCompilerOptions.compilerOptions.diagnostics.publish(
        createComponentMissingExportMessage({
          name,
          location: getLocationOfHtmlNode(scopePreCompilerOptions.ast),
          sourceFile: scopePreCompilerOptions.file,
          componentUrl:
            scopePreCompilerOptions.htmlNodesCollection.imports[node.tagName],
        }),
      );
    }
  }

  await preCompileScope({ ...scopePreCompilerOptions, ast: node });

  valuesToDelete.forEach((name) => {
    delete scopePreCompilerOptions.localThis[name];
  });

  Object.assign(scopePreCompilerOptions.localThis, valuesToRestore);
}
