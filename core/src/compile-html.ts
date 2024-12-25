import { appendChild } from "domutils";
import type { Document, Element } from "domhandler";

import type { Options } from "./options.js";
import { rebaseUrls } from "./url-rebaser.js";
import type { VirtualFile } from "./virtual-file.js";
import { evaluateLoops } from "./evaluate-loops.js";
import { inlineClientData } from "./inline-client-data.js";
import { compileComponents } from "./compile-components.js";
import { evaluateConditionals } from "./evaluate-conditionals.js";
import { evaluateInHtmlExpressions } from "./in-html-expressions.js";
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
  // Make a copy, so the original store won't be changed.
  options.buildStore = new Map(options.buildStore);

  await prepareIR({
    ast,
    file,
    compilerOptions: options,
    htmlNodesCollection,
  });

  removeArtifacts(htmlNodesCollection);
}

export interface IRCompilerOptions {
  ast: Document | Element;
  file: VirtualFile;
  compilerOptions: Options;
  htmlNodesCollection: HtmlNodesCollection;
}

export interface IRCompiler {
  (options: IRCompilerOptions): Promise<void>;
}

async function prepareIR(options: IRCompilerOptions): Promise<void> {
  const nodes: HtmlNodesCollection = createEmptyHtmlNodesCollection();
  const localThis: Record<string, unknown> = {};
  const publicNames: Array<PublicNameWithAlias> = [];

  // These parts must be shared across all component of one unit,
  // because they are handled when combined AST is ready.
  nodes.slots = options.htmlNodesCollection.slots;
  nodes.fragments = options.htmlNodesCollection.fragments;
  nodes.portals = options.htmlNodesCollection.portals;
  nodes.transferrableElements =
    options.htmlNodesCollection.transferrableElements;
  nodes.raws = options.htmlNodesCollection.raws;

  await preCompile({
    ast: options.ast,
    file: options.file,
    localThis,
    compilerOptions: options.compilerOptions,
    htmlNodesCollection: nodes,
    publicNames,
  });

  inlineClientData(
    nodes,
    localThis,
    publicNames,
    options.file,
    options.compilerOptions,
  );

  await compileComponents(
    nodes,
    prepareIR,
    options.file,
    options.compilerOptions,
  );
}

export interface PreCompileOptions {
  ast: Document | Element;
  file: VirtualFile;
  localThis: Record<string, unknown>;
  publicNames: Array<PublicNameWithAlias>;
  compilerOptions: Options;
  htmlNodesCollection: HtmlNodesCollection;
}

export interface PreCompiler {
  (options: PreCompileOptions): Promise<void>;
}

async function preCompile(options: PreCompileOptions): Promise<void> {
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

  await evaluateConditionals(options, preCompile);

  await evaluateLoops(options, preCompile);
}

function removeArtifacts(htmlNodesCollection: HtmlNodesCollection): void {
  htmlNodesCollection.transferrableElements.forEach((transferrableElement) => {
    const portalName = transferrableElement.attribs.portal;
    delete transferrableElement.attribs.portal;

    if (portalName) {
      const portal = htmlNodesCollection.portals[portalName];

      appendChild(portal, transferrableElement);
    }
  });

  for (const portalName in htmlNodesCollection.portals) {
    const portal = htmlNodesCollection.portals[portalName];

    replaceElementWithMultiple(portal, portal.childNodes);
  }

  htmlNodesCollection.fragments.forEach((fragment) => {
    replaceElementWithMultiple(fragment, fragment.childNodes);
  });
  htmlNodesCollection.raws.forEach((raw) => {
    replaceElementWithMultiple(raw, raw.childNodes);
  });

  htmlNodesCollection.portals = {};
  htmlNodesCollection.transferrableElements.length = 0;
  htmlNodesCollection.fragments.length = 0;
  htmlNodesCollection.raws.length = 0;
}
