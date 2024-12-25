import render from "dom-serializer";

import type { Document } from "domhandler";

export function generateHtml(document: Document): string {
  return render(document);
}
