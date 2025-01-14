import { appendChild, removeElement } from "domutils";

import { type HtmlNodesCollection } from "./collect-html-nodes.js";
import { type Options } from "./options.js";
import { type VirtualFile } from "./virtual-file.js";
import { createReferenceToNonExistendPortalMessage } from "./diagnostics.js";
import {
  getLocationOfHtmlNode,
  replaceElementWithMultiple,
} from "./html-nodes.js";

export function evaluatePortals(
  htmlNodesCollection: HtmlNodesCollection,
  file: VirtualFile,
  options: Options,
): void {
  htmlNodesCollection.transferrableElements.forEach((transferrableElement) => {
    const portalName = transferrableElement.attribs.portal;
    // Do not retain portal's name as an attribute in HTML.
    delete transferrableElement.attribs.portal;

    if (portalName) {
      const portal = htmlNodesCollection.portals[portalName];

      if (portal) {
        appendChild(portal, transferrableElement);
      } else {
        options.diagnostics.publish(
          createReferenceToNonExistendPortalMessage({
            name: portalName,
            sourceFile: file,
            location: getLocationOfHtmlNode(transferrableElement),
          }),
        );
        removeElement(transferrableElement);
      }
    }
  });

  for (const portalName in htmlNodesCollection.portals) {
    const portal = htmlNodesCollection.portals[portalName];

    replaceElementWithMultiple(portal, portal.childNodes);
  }

  htmlNodesCollection.portals = {};
  htmlNodesCollection.transferrableElements.length = 0;
}
