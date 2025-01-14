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
    if ("portal" in transferrableElement.attribs) {
      // If the portal attribute value was an expression and it evaluated to undefined,
      // then it was deleted, so checking for a key is sufficient here to check that
      // its value not defined.
      const portalName = transferrableElement.attribs.portal!;
      // Do not retain portal's name as an attribute in HTML.
      delete transferrableElement.attribs.portal;
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
    } else {
      // The element was explicitly marked as transferrable, so when getting destination's name
      // is not possible, the compiler has to remove the element, for it was not indended to
      // appear at the current position anyway.
      removeElement(transferrableElement);
    }
  });

  for (const portalName in htmlNodesCollection.portals) {
    const portal = htmlNodesCollection.portals[portalName];

    replaceElementWithMultiple(portal, portal.childNodes);
  }

  htmlNodesCollection.portals = {};
  htmlNodesCollection.transferrableElements.length = 0;
}
