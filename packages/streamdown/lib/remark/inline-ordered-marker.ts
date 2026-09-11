import type {
  BlockContent,
  DefinitionContent,
  List,
  ListItem,
  Paragraph,
  Root,
  Text,
} from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

type ItemChild = BlockContent | DefinitionContent;

/**
 * A number immediately after a list marker (`- 23. října`, `1. 23) foo`) is,
 * per CommonMark, the start of a nested ordered list — so `<li><ol
 * start="23"><li>října</li></ol></li>`. That is never what streamed prose
 * means: it is a date, a version, a count. Fold the marker back into the
 * item's text when the ordered list is the item's first child, starts on the
 * same line as the parent marker, and has exactly one item (deliberate nested
 * lists live on their own indented lines).
 */
const isInlineOrderedMarker = (item: ListItem, list: List): boolean => {
  if (!(list.ordered && list.children.length === 1)) {
    return false;
  }
  const itemLine = item.position?.start.line;
  const listLine = list.position?.start.line;
  return itemLine !== undefined && itemLine === listLine;
};

const markerText = (
  source: string,
  list: List,
  firstBlock: ItemChild | undefined
): string => {
  const from = list.position?.start.offset;
  const to = firstBlock?.position?.start.offset;
  if (from !== undefined && to !== undefined && to > from) {
    return source.slice(from, to).trimEnd();
  }
  return `${list.start ?? 1}.`;
};

const foldMarker = (item: ListItem, list: List, source: string): void => {
  const nested = list.children[0];
  const [firstBlock, ...restBlocks] = nested.children;
  const marker = markerText(source, list, firstBlock);

  let lead: ItemChild[];
  if (firstBlock?.type === "paragraph") {
    const [firstInline, ...restInline] = firstBlock.children;
    const paragraph: Paragraph = {
      ...firstBlock,
      children:
        firstInline?.type === "text"
          ? [
              { ...firstInline, value: `${marker} ${firstInline.value}` },
              ...restInline,
            ]
          : [
              { type: "text", value: `${marker} ` } as Text,
              ...firstBlock.children,
            ],
    };
    if (list.position && firstBlock.position) {
      paragraph.position = {
        start: list.position.start,
        end: firstBlock.position.end,
      };
    }
    lead = [paragraph, ...restBlocks];
  } else {
    const paragraph: Paragraph = {
      type: "paragraph",
      children: [{ type: "text", value: marker } as Text],
    };
    if (list.position) {
      paragraph.position = { start: list.position.start, end: list.position.start };
    }
    lead = [paragraph, ...nested.children];
  }

  item.children = [...lead, ...item.children.slice(1)];
  if (nested.spread) {
    item.spread = true;
  }
};

export const remarkInlineOrderedMarker: Plugin<[], Root> =
  () => (tree, file) => {
    const source = typeof file?.value === "string" ? file.value : "";
    visit(tree, "listItem", (item: ListItem) => {
      const first = item.children[0];
      if (first?.type === "list" && isInlineOrderedMarker(item, first)) {
        foldMarker(item, first, source);
      }
    });
  };
