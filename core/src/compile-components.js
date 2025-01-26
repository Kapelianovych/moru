/** @import { ChildNode, Element } from "domhandler"; */

/**
 * @import {
 *   ModuleCompiler,
 *   ScopePreCompiler,
 *   ScopePreCompilerOptions,
 * } from "./compile-html.js";
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { HtmlSlotElement } from "./html-nodes.js";
 */

import { parseHtml } from "./parse-html.js";
import { replaceElementWithMultiple } from "./html-nodes.js";
import { createComponentMissingExportMessage } from "./diagnostics.js";
import { getLocationOfHtmlNode, isHtmlSlottableElement } from "./html-nodes.js";
import { augmentLocalThis } from "./local-this.js";

/**
 * @param {ScopePreCompilerOptions} scopePreCompilerOptions
 * @param {ScopePreCompiler} preCompileScope
 * @param {ModuleCompiler} compileModule
 * @returns {Promise<void>}
 */
export async function compileComponents(
  scopePreCompilerOptions,
  preCompileScope,
  compileModule,
) {
  for (const {
    url,
    node,
    assignedAttributes,
    hasAssignDefinitions,
  } of scopePreCompilerOptions.htmlNodesCollection.components) {
    const componentContent =
      await scopePreCompilerOptions.compilerOptions.readFileContent(url);
    /** @type {VirtualFile} */
    const componentFile = {
      url,
      content: componentContent,
    };
    const ast = parseHtml(componentFile);
    /** @type {Array<HtmlSlotElement>} */
    const childSlots = [];
    /** @type {Record<string, unknown>} */
    const currentModuleExportedValues =
      scopePreCompilerOptions.compilerOptions.exports;
    /** @type {Array<HtmlSlotElement>} */
    const currentModuleSlots =
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
        assignedAttributes,
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

/**
 * @param {Element} componentElement
 * @returns {Record<string, Array<ChildNode>>}
 */
function getComponentChildrenGroupedBySlots(componentElement) {
  /** @type {Record<string, Array<ChildNode>>} */
  const groups = {
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

/**
 * @param {Element} node
 * @param {Record<string, string>} assignedAttributes
 * @param {ScopePreCompilerOptions} scopePreCompilerOptions
 * @param {ScopePreCompiler} preCompileScope
 * @returns {Promise<void>}
 */
async function evaluateChildren(
  node,
  assignedAttributes,
  scopePreCompilerOptions,
  preCompileScope,
) {
  /** @type {Array<VoidFunction>} */
  const rollbacks = [];

  for (const name in assignedAttributes) {
    if (name in scopePreCompilerOptions.compilerOptions.exports) {
      const importName = assignedAttributes[name];

      const rollback = augmentLocalThis(
        scopePreCompilerOptions.localThis,
        importName,
        scopePreCompilerOptions.compilerOptions.exports[name],
      );

      rollbacks.push(rollback);
    } else {
      scopePreCompilerOptions.compilerOptions.diagnostics.publish(
        createComponentMissingExportMessage({
          location: getLocationOfHtmlNode(node),
          sourceFile: scopePreCompilerOptions.file,
          componentUrl:
            scopePreCompilerOptions.htmlNodesCollection.imports[node.tagName],
          importedVariableName: name,
        }),
      );
    }
  }

  await preCompileScope({ ...scopePreCompilerOptions, ast: node });

  rollbacks.forEach((rollback) => rollback());
}
