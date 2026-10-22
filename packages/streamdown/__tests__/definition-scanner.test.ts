import { describe, expect, it } from "vitest";
import { createDefinitionScanner } from "../lib/definition-scanner";
import { parseMarkdownIntoBlocks, parseMarkdownIntoBlocksIncremental } from "../lib/parse-blocks";

// The full-document patterns that the incremental checks replace.
const footnoteReferencePattern = /\[\^[\w-]{1,200}\](?!:)/;
const footnoteDefinitionPattern = /\[\^[\w-]{1,200}\]:/;
const linkDefinitionPattern = /^ {0,3}\[[^\]]+\]:/m;

const chunked = (text: string, seed: number): string[] => {
  const chunks: string[] = [];
  let state = seed;
  for (let index = 0; index < text.length; ) {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    const size = 1 + (state % 4);
    chunks.push(text.slice(index, index + size));
    index += size;
  }
  return chunks;
};

describe("incremental footnote and link-definition checks", () => {
  // Parsing an unrelated document first resets each check's memo, so the
  // second call is a full check of that prefix.
  const fresh = (input: string): string[] => {
    parseMarkdownIntoBlocks("unrelated reset document\n");
    return parseMarkdownIntoBlocks(input);
  };

  it("matches a full check at every prefix", () => {
    const label = "x".repeat(200);
    const inputs = [
      "Intro paragraph.\n\nSee note [^1] here.\n\nMore text.\n",
      "Intro.\n\nText [^a]: is a definition.\n\nMore.\n",
      `Intro.\n\nLong [^${label}] label.\n\nMore [^${label}x] too long.\n`,
      "Intro [x](/u).\n\nThen\n[ref]: https://example.com\n\nafter\n",
      "a ] b\n\n[multi\nline]: /u\n\nend\n",
      "> [q]: /quoted\n\npara\n",
    ];
    for (const document of inputs) {
      for (const seed of [1, 2]) {
        let previous = null;
        let text = "";
        for (const chunk of chunked(document, seed)) {
          text += chunk;
          const expected = fresh(text);
          previous = parseMarkdownIntoBlocksIncremental(text, previous);
          expect(previous.blocks).toEqual(expected);
        }
      }
    }
  });

  it("gives each check the same answer as its full regex", () => {
    const { hasFootnoteReference, hasFootnoteDefinition, hasLinkDefinition } = createDefinitionScanner();
    const checks = [
      [hasFootnoteReference, footnoteReferencePattern],
      [hasFootnoteDefinition, footnoteDefinitionPattern],
      [hasLinkDefinition, linkDefinitionPattern],
    ] as const;
    const pieces = [
      "[",
      "]",
      "^",
      ":",
      "-",
      "a",
      " ",
      "\n",
      "\n\n",
      "[^n]",
      "]:",
      "[x]: /u",
    ];
    let state = 7717;
    for (let run = 0; run < 300; run += 1) {
      let text = "";
      for (let step = 0; step < 80; step += 1) {
        state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
        text += pieces[state % pieces.length];
        for (const [check, pattern] of checks) {
          expect(check(text)).toBe(pattern.test(text));
        }
      }
    }
  });
});
