/**
 * @import { ChildNode, Element } from "domhandler";
 *
 * @import { Options } from "./options.js";
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { LocalThis } from "./local-this.js";
 * @import { HtmlSlotElement } from "./html-nodes.js";
 * @import { HtmlNodesCollection } from "./collect-html-nodes.js";
 * @import { ScopePreCompiler, ScopePreCompilerOptions, ModuleCompiler } from "./compile-html.js";
 * @import { Lifecycle } from "./lifecycle.js";
 * @import { PublicNameWithAlias } from "./run-build-scripts.js";
 */

import { appendChild } from "domutils";

import { augmentLocalThis } from "./local-this.js";
import {
  getLocationOfHtmlNode,
  isHtmlSlottableElement,
  replaceElementWithMultiple,
} from "./html-nodes.js";
import { createComponentMissingExportMessage } from "./diagnostics.js";
import { evaluateLeafSlots } from "./evaluate-leaf-slots.js";
import { compileComponents } from "./compile-components.js";
import { createEmptyHtmlNodesCollection } from "./collect-html-nodes.js";
import { evaluateExports } from "./evaluate-exports.js";

/**
 * @callback SlotContentCompiler
 * @param {HtmlSlotElement} slotElement
 * @returns {Promise<void>}
 */

/**
 * @param {HtmlNodesCollection} htmlNodesCollection
 * @param {LocalThis} localThis
 * @param {ScopePreCompiler} preCompileScope
 * @param {Lifecycle} lifecycle
 * @param {Array<PublicNameWithAlias>} publicNames
 * @param {ModuleCompiler} compileModule
 * @param {Record<string, SlotContentCompiler>} slotContentCompilersFromParent
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {Map<Element, Record<string, SlotContentCompiler>>}
 */
export function createSlotContentCompilersForComponents(
  htmlNodesCollection,
  localThis,
  preCompileScope,
  lifecycle,
  publicNames,
  compileModule,
  slotContentCompilersFromParent,
  file,
  options,
) {
  /** @type {Map<Element, Record<string, SlotContentCompiler>>} */
  const slotContentCompilersGroupedByComponent = new Map();

  for (const { node, assignedAttributes } of htmlNodesCollection.components) {
    const slotContentCompilers = createSlotContentCompilers(
      node,
      assignedAttributes,
      localThis,
      htmlNodesCollection,
      preCompileScope,
      lifecycle,
      publicNames,
      compileModule,
      slotContentCompilersFromParent,
      file,
      options,
    );

    slotContentCompilersGroupedByComponent.set(node, slotContentCompilers);
  }

  return slotContentCompilersGroupedByComponent;
}

/**
 * @param {Element} componentElement
 * @param {Record<string, string>} assignedAttributes
 * @param {LocalThis} localThis
 * @param {HtmlNodesCollection} htmlNodesCollection
 * @param {ScopePreCompiler} preCompileScope
 * @param {Lifecycle} lifecycle
 * @param {Array<PublicNameWithAlias>} publicNames
 * @param {ModuleCompiler} compileModule
 * @param {Record<string, SlotContentCompiler>} slotContentCompilersFromParent
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {Record<string, SlotContentCompiler>}
 */
function createSlotContentCompilers(
  componentElement,
  assignedAttributes,
  localThis,
  htmlNodesCollection,
  preCompileScope,
  lifecycle,
  publicNames,
  compileModule,
  slotContentCompilersFromParent,
  file,
  options,
) {
  /** @type {Record<string, SlotContentCompiler>} */
  const compilersGroupedBySlotName = {};

  const elementsGroupedBySlotNames =
    getComponentChildrenGroupedBySlots(componentElement);

  for (const slotName in elementsGroupedBySlotNames) {
    const clonedComponentElement = componentElement.cloneNode(false);
    const children = elementsGroupedBySlotNames[slotName];

    children.forEach((child) => {
      appendChild(clonedComponentElement, child);
    });

    compilersGroupedBySlotName[slotName] = async (slotElement) => {
      const childrenHtmlNodesCollection = createEmptyHtmlNodesCollection();

      childrenHtmlNodesCollection.clientScripts =
        htmlNodesCollection.clientScripts;
      childrenHtmlNodesCollection.exports = htmlNodesCollection.exports;
      childrenHtmlNodesCollection.fragments = htmlNodesCollection.fragments;
      childrenHtmlNodesCollection.getParentMarkupDefinitionFor =
        htmlNodesCollection.getParentMarkupDefinitionFor;
      childrenHtmlNodesCollection.imports = htmlNodesCollection.imports;
      childrenHtmlNodesCollection.markupDefinitions =
        htmlNodesCollection.markupDefinitions;
      childrenHtmlNodesCollection.portals = htmlNodesCollection.portals;
      childrenHtmlNodesCollection.raws = htmlNodesCollection.raws;
      childrenHtmlNodesCollection.transferrableElements =
        htmlNodesCollection.transferrableElements;

      const rollbacks = extendLocalThis(
        clonedComponentElement,
        assignedAttributes,
        localThis,
        childrenHtmlNodesCollection,
        file,
        options,
      );

      /** @type {ScopePreCompilerOptions} */
      const scopePreCompilerOptions = {
        ast: clonedComponentElement,
        file,
        localThis,
        compilerOptions: options,
        onAfterRender: lifecycle.onAfterRender,
        publicNames,
        htmlNodesCollection: childrenHtmlNodesCollection,
      };

      await preCompileScope(scopePreCompilerOptions);

      const slotContentCompilersForComponents =
        createSlotContentCompilersForComponents(
          childrenHtmlNodesCollection,
          localThis,
          preCompileScope,
          lifecycle,
          publicNames,
          compileModule,
          slotContentCompilersFromParent,
          file,
          options,
        );

      await compileComponents(
        childrenHtmlNodesCollection,
        compileModule,
        slotContentCompilersForComponents,
        options,
      );

      evaluateExports(childrenHtmlNodesCollection, localThis, file, options);

      await evaluateLeafSlots(
        childrenHtmlNodesCollection,
        slotContentCompilersFromParent,
      );

      replaceElementWithMultiple(slotElement, clonedComponentElement.children);

      rollbacks.forEach((rollback) => rollback());
    };
  }

  return compilersGroupedBySlotName;
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
 * @param {Element} componentElement
 * @param {Record<string, string>} assignedAttributes
 * @param {LocalThis} localThis
 * @param {HtmlNodesCollection} htmlNodesCollection
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {Array<VoidFunction>}
 */
function extendLocalThis(
  componentElement,
  assignedAttributes,
  localThis,
  htmlNodesCollection,
  file,
  options,
) {
  /** @type {Array<VoidFunction>} */
  const rollbacks = [];

  for (const name in assignedAttributes) {
    if (name in options.exports) {
      const importName = assignedAttributes[name];

      const rollback = augmentLocalThis(
        localThis,
        importName,
        options.exports[name],
      );

      rollbacks.push(rollback);
    } else {
      options.diagnostics.publish(
        createComponentMissingExportMessage({
          location: getLocationOfHtmlNode(componentElement),
          sourceFile: file,
          componentUrl: htmlNodesCollection.imports[componentElement.tagName],
          importedVariableName: name,
        }),
      );
    }
  }

  return rollbacks;
}
