import type { Document, Element } from "domhandler";

import type { Options } from "./options.js";
import { rebaseUrls } from "./url-rebaser.js";
import type { VirtualFile } from "./virtual-file.js";
import { evaluateLoops } from "./evaluate-loops.js";
import { evaluatePortals } from "./evaluate-portals.js";
import { evaluateExports } from "./evaluate-exports.js";
import { inlineClientData } from "./inline-client-data.js";
import { compileComponents } from "./compile-components.js";
import { evaluateConditionals } from "./evaluate-conditionals.js";
import { evaluateInHtmlExpressions } from "./in-html-expressions.js";
import { evaluateMarkupDefinitions } from "./evaluate-markup-definitions.js";
import { replaceElementWithMultiple } from "./html-nodes.js";
import {
  type PublicNameWithAlias,
  runBuildScripts,
} from "./run-build-scripts.js";
import {
  collectHtmlNodes,
  createEmptyHtmlNodesCollection,
  type HtmlNodesCollection,
} from "./collect-html-nodes.js";

export async function compileHtml(
  ast: Document,
  file: VirtualFile,
  options: Options,
): Promise<void> {
  const htmlNodesCollection = createEmptyHtmlNodesCollection();

  await compileModule({
    ast,
    file,
    compilerOptions: options,
    htmlNodesCollection,
  });

  evaluatePortals(htmlNodesCollection, file, options);

  removeArtifacts(htmlNodesCollection);
}

export interface ModuleCompilerOptions {
  ast: Document | Element;
  file: VirtualFile;
  compilerOptions: Options;
  htmlNodesCollection: HtmlNodesCollection;
}

export interface ModuleCompiler {
  (options: ModuleCompilerOptions): Promise<void>;
}

async function compileModule(options: ModuleCompilerOptions): Promise<void> {
  const nodes: HtmlNodesCollection = createEmptyHtmlNodesCollection();
  const localThis: Record<string, unknown> = {};
  const publicNames: Array<PublicNameWithAlias> = [];

  // These parts must be shared across all components of one compilation unit,
  // because they are handled when combined the AST is ready.
  nodes.slots = options.htmlNodesCollection.slots;
  nodes.fragments = options.htmlNodesCollection.fragments;
  nodes.portals = options.htmlNodesCollection.portals;
  nodes.transferrableElements =
    options.htmlNodesCollection.transferrableElements;
  nodes.raws = options.htmlNodesCollection.raws;

  const scopePreCompilerOptions: ScopePreCompilerOptions = {
    ast: options.ast,
    file: options.file,
    localThis,
    compilerOptions: options.compilerOptions,
    htmlNodesCollection: nodes,
    publicNames,
  };

  await preCompileScope(scopePreCompilerOptions);

  await compileComponents(
    scopePreCompilerOptions,
    preCompileScope,
    compileModule,
  );

  evaluateExports(nodes, localThis, options.file, options.compilerOptions);

  inlineClientData(
    nodes,
    localThis,
    publicNames,
    options.file,
    options.compilerOptions,
  );
}

export interface ScopePreCompilerOptions {
  ast: Document | Element;
  file: VirtualFile;
  localThis: Record<string, unknown>;
  publicNames: Array<PublicNameWithAlias>;
  compilerOptions: Options;
  htmlNodesCollection: HtmlNodesCollection;
}

export interface ScopePreCompiler {
  (options: ScopePreCompilerOptions): Promise<void>;
}

async function preCompileScope(
  options: ScopePreCompilerOptions,
): Promise<void> {
  const scopedNodes: HtmlNodesCollection = createEmptyHtmlNodesCollection();

  // All imports can be defined only at the beginning of the component
  // and then are shared between all of its scopes.
  scopedNodes.imports = options.htmlNodesCollection.imports;
  // Even though exporte can be defined at the top level and there is not point
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

  evaluateMarkupDefinitions(
    options.htmlNodesCollection,
    options.file,
    options.compilerOptions,
  );

  await runBuildScripts(
    options.htmlNodesCollection,
    options.localThis,
    options.publicNames,
    options.ast,
    options.file,
    options.compilerOptions,
  );

  await evaluateInHtmlExpressions(
    options.htmlNodesCollection,
    options.localThis,
    options.file,
    options.compilerOptions,
  );

  rebaseUrls(
    options.htmlNodesCollection,
    options.file,
    options.compilerOptions,
  );

  await evaluateConditionals(options, preCompileScope);

  await evaluateLoops(options, preCompileScope);

  options.htmlNodesCollection = parentHtmlNodesCollection;

  // These parts must be shared across all components of one compilation unit,
  // because they are handled when combined the AST is ready.
  options.htmlNodesCollection.slots.push(...scopedNodes.slots);
  options.htmlNodesCollection.fragments.push(...scopedNodes.fragments);
  Object.assign(options.htmlNodesCollection.portals, scopedNodes.portals);
  options.htmlNodesCollection.transferrableElements.push(
    ...scopedNodes.transferrableElements,
  );
  options.htmlNodesCollection.raws.push(...scopedNodes.raws);
  options.htmlNodesCollection.clientScripts.push(...scopedNodes.clientScripts);
  options.htmlNodesCollection.components.push(...scopedNodes.components);
}

function removeArtifacts(htmlNodesCollection: HtmlNodesCollection): void {
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
