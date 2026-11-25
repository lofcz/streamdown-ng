import { decodeNamedCharacterReference } from "decode-named-character-reference";
import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

const PREFIX = "user-content-";
const DOUBLED_PREFIX = `${PREFIX}${PREFIX}`;
const WHITESPACE = /\s+/;
const RAW_HTML_ID_PATTERN = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
const CHARACTER_REFERENCE_PATTERN =
  /&(?:#(\d+)|#x([\da-f]+)|([a-z][\da-z]*));/gi;

const protect = (value: string): string => {
  if (value.startsWith(DOUBLED_PREFIX)) {
    return value.slice(PREFIX.length);
  }
  return value.startsWith(PREFIX) ? value : PREFIX + value;
};

/** Decode HTML character references (`&amp;`, `&#233;`, `&#xe9;`) in an attribute value. */
function decodeCharacterReferences(value: string): string {
  return value.replace(
    CHARACTER_REFERENCE_PATTERN,
    (reference, decimal, hex, name) => {
      if (name) {
        return decodeNamedCharacterReference(name) || reference;
      }
      const codePoint = Number.parseInt(decimal ?? hex, decimal ? 10 : 16);
      return codePoint > 0 && codePoint <= 0x10_ff_ff
        ? String.fromCodePoint(codePoint)
        : reference;
    }
  );
}

/** Decode a percent-encoded URL fragment, falling back to the raw value. */
function decodeFragment(fragment: string): string {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}

/** Collect the ids declared by raw HTML attributes in a markdown document. */
export function collectRawHtmlIds(markdown: string): ReadonlySet<string> {
  const ids = new Set<string>();
  if (!markdown.includes("id")) {
    return ids;
  }
  for (const match of markdown.matchAll(RAW_HTML_ID_PATTERN)) {
    const id = match[1] ?? match[2] ?? match[3];
    if (id) {
      ids.add(decodeCharacterReferences(id));
    }
  }
  return ids;
}

export interface ProtectIdentifiersOptions {
  componentTags?: Iterable<string>;
  /**
   * Raw HTML ids declared elsewhere in the document. Streaming renders each
   * block separately, so a link can point at an id that lives in another block.
   */
  documentIds?: ReadonlySet<string>;
}

const protectProperties = (node: Element, targets: Set<string>): void => {
  for (const property of ["id", "name"] as const) {
    const value = node.properties[property];
    if (typeof value === "string" || typeof value === "number") {
      const normalized = protect(String(value));
      node.properties[property] = normalized;
      if (property === "id" && normalized.startsWith(PREFIX)) {
        targets.add(normalized.slice(PREFIX.length));
      }
    }
  }
};

const protectReferences = (
  node: Element,
  targets: Set<string>,
  documentIds?: ReadonlySet<string>
): void => {
  for (const property of [
    "ariaDescribedBy",
    "ariaLabelledBy",
    "htmlFor",
    "headers",
  ]) {
    const value = node.properties[property];
    if (Array.isArray(value)) {
      node.properties[property] = value.map((part) => protect(String(part)));
    } else if (typeof value === "string" && value) {
      node.properties[property] = value
        .split(WHITESPACE)
        .map(protect)
        .join(" ");
    }
  }
  const href = node.properties.href;
  if (
    node.tagName === "a" &&
    typeof href === "string" &&
    href.startsWith("#") &&
    href.length > 1 &&
    !href.startsWith(`#${PREFIX}`)
  ) {
    // Only rewrite fragment links whose target id was clobbered (in this tree
    // or in another streaming block). Hash routes and host-app anchors stay as
    // written. Hrefs are percent-encoded (non-ASCII ids), while ids are not.
    const decoded = decodeFragment(href.slice(1));
    if (targets.has(decoded) || documentIds?.has(decoded)) {
      node.properties.href = `#${PREFIX}${href.slice(1)}`;
    }
  }
};

/**
 * Protect identifiers reaching native DOM elements. A mapped custom tag's
 * props are application data (for example an entity ID), and data-only child
 * nodes have already been serialized before this pass.
 *
 * Footnote IDs from remark-rehype already carry this prefix. Keeping it once
 * avoids changing their references and return links.
 */
export function rehypeProtectIdentifiers(
  options: string[] | ProtectIdentifiersOptions = []
) {
  const isArray = Array.isArray(options);
  const customTags = new Set(isArray ? options : (options.componentTags ?? []));
  const documentIds = isArray ? undefined : options.documentIds;

  return (tree: Root) => {
    // Keep tree-local additions separate: never copy or mutate shared IDs.
    const targets = new Set<string>();
    visit(tree, "element", (node) => {
      if (customTags.has(node.tagName)) {
        return;
      }
      protectProperties(node, targets);
    });
    visit(tree, "element", (node) => {
      if (customTags.has(node.tagName)) {
        return;
      }
      protectReferences(node, targets, documentIds);
    });
  };
}
