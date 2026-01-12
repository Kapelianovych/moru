/**
 * @import { Document, Element } from "domhandler";
 *
 * @import { Options } from "./options.js";
 * @import { LocalThis } from "./local-this.js";
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { PublicNameWithAlias } from "./run-build-scripts.js";
 * @import { HtmlNodesCollection } from "./collect-html-nodes.js";
 * @import { Lifecycle, LifecyclePhaseSubscriber } from "./lifecycle.js";
 * @import { SlotContentCompiler } from "./slot-content-compiler.js";
 */

import { rebaseUrls } from "./url-rebaser.js";
import { evaluateLoops } from "./evaluate-loops.js";
import { evaluatePortals } from "./evaluate-portals.js";
import { evaluateExports } from "./evaluate-exports.js";
import { createLocalThis } from "./local-this.js";
import { inlineClientData } from "./inline-client-data.js";
import { compileComponents } from "./compile-components.js";
import { evaluateConditionals } from "./evaluate-conditionals.js";
import { evaluateInHtmlExpressions } from "./in-html-expressions.js";
import { evaluateMarkupDefinitions } from "./evaluate-markup-definitions.js";
import { replaceElementWithMultiple } from "./html-nodes.js";
import { runBuildScripts } from "./run-build-scripts.js";
import { createLifecycle, LifecyclePhase } from "./lifecycle.js";
import {
  collectHtmlNodes,
  createEmptyHtmlNodesCollection,
} from "./collect-html-nodes.js";
import { evaluateLeafSlots } from "./evaluate-leaf-slots.js";
import { createSlotContentCompilersForComponents } from "./slot-content-compiler.js";
import { evaluateDynamics } from "./evaluate-dynamics.js";

/**
 * @param {Document} ast
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {Promise<void>}
 */
export async function compileHtml(ast, file, options) {
  const htmlNodesCollection = createEmptyHtmlNodesCollection();

  await compileModule({
    ast,
    file,
    compilerOptions: options,
    htmlNodesCollection,
    slotContentCompilersFromParent: {},
  });

  evaluatePortals(htmlNodesCollection, file, options);

  removeArtifacts(htmlNodesCollection);
}

/**
 * @typedef {Object} ModuleCompilerOptions
 * @property {Document | Element} ast
 * @property {VirtualFile} file
 * @property {Options} compilerOptions
 * @property {HtmlNodesCollection} htmlNodesCollection
 * @property {Lifecycle} [lifecycle]
 * @property {Record<string, SlotContentCompiler>} slotContentCompilersFromParent
 */

/**
 * @callback ModuleCompiler
 * @param {ModuleCompilerOptions} options
 * @returns {Promise<void>}
 */

/**
 * @param {ModuleCompilerOptions} options
 * @returns {Promise<void>}
 */
async function compileModule(options) {
  const nodes = createEmptyHtmlNodesCollection();
  const localThis = createLocalThis();
  /** @type {Array<PublicNameWithAlias>} */
  const publicNames = [];

  options.lifecycle ??= createLifecycle();

  // These parts must be shared across all components of one compilation unit,
  // because they are handled when the combined AST is ready.
  nodes.fragments = options.htmlNodesCollection.fragments;
  nodes.portals = options.htmlNodesCollection.portals;
  nodes.transferrableElements =
    options.htmlNodesCollection.transferrableElements;
  nodes.raws = options.htmlNodesCollection.raws;

  /** @type {ScopePreCompilerOptions} */
  const scopePreCompilerOptions = {
    ast: options.ast,
    file: options.file,
    localThis,
    compilerOptions: options.compilerOptions,
    htmlNodesCollection: nodes,
    publicNames,
    onAfterRender: options.lifecycle.onAfterRender,
  };

  await preCompileScope(scopePreCompilerOptions);

  const slotContentCompilersForComponents =
    createSlotContentCompilersForComponents(
      nodes,
      localThis,
      preCompileScope,
      options.lifecycle,
      publicNames,
      compileModule,
      options.slotContentCompilersFromParent,
      options.file,
      options.compilerOptions,
      options.compilerOptions.properties,
    );

  await compileComponents(
    nodes,
    compileModule,
    slotContentCompilersForComponents,
    options.compilerOptions,
  );

  evaluateExports(nodes, localThis, options.file, options.compilerOptions);

  await evaluateLeafSlots(nodes, options.slotContentCompilersFromParent);

  await inlineClientData(
    nodes,
    localThis,
    publicNames,
    options.file,
    options.compilerOptions,
  );

  await options.lifecycle.commit(LifecyclePhase.AfterRender);
}

/**
 * @typedef {Object} ScopePreCompilerOptions
 * @property {Document | Element} ast
 * @property {VirtualFile} file
 * @property {LocalThis} localThis
 * @property {Array<PublicNameWithAlias>} publicNames
 * @property {Options} compilerOptions
 * @property {HtmlNodesCollection} htmlNodesCollection
 * @property {LifecyclePhaseSubscriber} onAfterRender
 */

/**
 * @callback ScopePreCompiler
 * @param {ScopePreCompilerOptions} options
 * @returns {Promise<void>}
 */

/**
 * @param {ScopePreCompilerOptions} options
 * @returns {Promise<void>}
 */
async function preCompileScope(options) {
  const scopedNodes = createEmptyHtmlNodesCollection();

  // All imports can be defined only at the beginning of the component
  // and then are shared between all of its scopes.
  scopedNodes.imports = options.htmlNodesCollection.imports;
  // Even though export can be defined at the top level and there is no point in
  // to pass it inside every scope, it has to be passed into the first one.
  scopedNodes.exports = options.htmlNodesCollection.exports;
  // Fragments with a name should be available in nested scopes.
  scopedNodes.getParentMarkupDefinitionFor = (name) => {
    return (
      parentHtmlNodesCollection.markupDefinitions[name] ??
      parentHtmlNodesCollection.getParentMarkupDefinitionFor?.(name)
    );
  };

  const parentHtmlNodesCollection = options.htmlNodesCollection;
  options.htmlNodesCollection = scopedNodes;

  collectHtmlNodes(
    options.ast,
    options.htmlNodesCollection,
    options.file,
    options.compilerOptions,
  );

  await runBuildScripts(
    options.htmlNodesCollection,
    options.localThis,
    options.publicNames,
    options.ast,
    options.onAfterRender,
    options.file,
    options.compilerOptions,
  );

  await evaluateInHtmlExpressions(
    options.htmlNodesCollection,
    options.localThis,
    options.onAfterRender,
    options.file,
    options.compilerOptions,
  );

  await evaluateDynamics(
    options.htmlNodesCollection,
    options.file,
    options.compilerOptions,
  );

  rebaseUrls(
    options.htmlNodesCollection,
    options.file,
    options.compilerOptions,
  );

  await evaluateMarkupDefinitions(options, preCompileScope);

  await evaluateConditionals(options, preCompileScope);

  await evaluateLoops(options, preCompileScope);

  options.htmlNodesCollection = parentHtmlNodesCollection;

  // Collect leaf nodes gathered from scopes.
  options.htmlNodesCollection.slots.push(...scopedNodes.slots);
  // Collect parts handled after components.
  options.htmlNodesCollection.fragments.push(...scopedNodes.fragments);
  Object.assign(options.htmlNodesCollection.portals, scopedNodes.portals);
  options.htmlNodesCollection.transferrableElements.push(
    ...scopedNodes.transferrableElements,
  );
  options.htmlNodesCollection.raws.push(...scopedNodes.raws);
  options.htmlNodesCollection.clientScripts.push(...scopedNodes.clientScripts);
  options.htmlNodesCollection.components.push(...scopedNodes.components);
}

/**
 * @param {HtmlNodesCollection} htmlNodesCollection
 * @returns {void}
 */
function removeArtifacts(htmlNodesCollection) {
  htmlNodesCollection.fragments.forEach((fragment) => {
    replaceElementWithMultiple(fragment, fragment.childNodes);
  });
  htmlNodesCollection.raws.forEach((raw) => {
    replaceElementWithMultiple(raw, raw.childNodes);
  });

  htmlNodesCollection.fragments.length = 0;
  htmlNodesCollection.raws.length = 0;
  htmlNodesCollection.markupDefinitions = {};
}
