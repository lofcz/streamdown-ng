import type { Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/** Preserve HTML a consumer's rehype plugins did not parse, or omit it. */
export const escapeRawHtml = (tree: Root, skipHtml = false): void => {
  visit(tree, "raw", (node, index, parent) => {
    if (!parent || index === undefined) {
      return;
    }
    if (skipHtml) {
      parent.children.splice(index, 1);
      return index;
    }
    parent.children[index] = {
      type: "text",
      value: node.value,
      position: node.position,
    };
  });
};

export const rehypeRawFallback: Plugin<[boolean?], Root> =
  (skipHtml) => (tree) => {
    escapeRawHtml(tree, skipHtml);
  };
