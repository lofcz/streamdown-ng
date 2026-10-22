import type { Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const PREFIX = "user-content-";
const protect = (value: string): string =>
  value.startsWith(PREFIX) ? value : PREFIX + value;

/**
 * Protect identifiers reaching native DOM elements. A mapped custom tag's
 * props are application data (for example an entity ID), and data-only child
 * nodes have already been serialized before this pass.
 *
 * Footnote IDs from remark-rehype already carry this prefix. Keeping it once
 * avoids changing their references and return links.
 */
export const rehypeProtectIdentifiers: Plugin<[string[]?], Root> =
  (componentTags = []) =>
  (tree) => {
    const customTags = new Set(componentTags);
    visit(tree, "element", (node) => {
      if (customTags.has(node.tagName)) {
        return;
      }
      for (const property of ["id", "name"] as const) {
        const value = node.properties[property];
        if (typeof value !== "string" && typeof value !== "number") {
          continue;
        }
        node.properties[property] = protect(String(value));
      }
      // References may live in a different streaming block from their target.
      // Use the same namespace for every local reference, including footnotes.
      for (const property of [
        "ariaDescribedBy",
        "ariaLabelledBy",
        "htmlFor",
        "headers",
      ]) {
        const value = node.properties[property];
        if (Array.isArray(value)) {
          node.properties[property] = value.map((part) =>
            protect(String(part))
          );
        } else if (typeof value === "string" && value) {
          node.properties[property] = value.split(/\s+/).map(protect).join(" ");
        }
      }
      const href = node.properties.href;
      if (
        node.tagName === "a" &&
        typeof href === "string" &&
        href.startsWith("#") &&
        href.length > 1
      ) {
        node.properties.href = `#${protect(href.slice(1))}`;
      }
    });
  };
