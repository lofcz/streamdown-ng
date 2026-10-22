const footnoteDefinitionPattern = /\[\^[\w-]{1,200}\]:/;
const linkDefinitionPattern = /^ {0,3}\[[^\]]+\]:/m;

// These checks run on the whole document for every streaming update. Each
// keeps the previous input and its result; when the new input extends it,
// only the region where a new match could end is tested again.
interface ScanMemo {
  found: boolean;
  input: string;
}

const extendsMemo = (memo: ScanMemo | null, input: string): memo is ScanMemo =>
  memo !== null &&
  input.length >= memo.input.length &&
  input.startsWith(memo.input);

// The longest footnote match: "[^", a 200-character label, "]", one more.
const footnoteWindow = 205;
// A footnote reference is `[^label]` not followed by ":", that is
// /\[\^[\w-]{1,200}\](?!:)/. Its `(?!:)` can drop a match at the very end of
// the input once ":" arrives.
// A match followed by a known non-colon character is permanent, so track
// those and test the end of the input separately.
const followedFootnoteReferencePattern = /\[\^[\w-]{1,200}\][^:]/;
const trailingFootnoteReferencePattern = /\[\^[\w-]{1,200}\]$/;

export const createDefinitionScanner = () => {
  let footnoteReferenceMemo: ScanMemo | null = null;
  let footnoteDefinitionMemo: ScanMemo | null = null;
  let linkDefinitionMemo: ScanMemo | null = null;

  const footnoteTail = (memo: ScanMemo, input: string): string =>
    input.slice(Math.max(0, memo.input.length - footnoteWindow));

  const hasFootnoteReference = (input: string): boolean => {
    const memo = footnoteReferenceMemo;
    const followed = extendsMemo(memo, input)
      ? memo.found ||
        followedFootnoteReferencePattern.test(footnoteTail(memo, input))
      : followedFootnoteReferencePattern.test(input);
    footnoteReferenceMemo = { input, found: followed };
    return (
      followed ||
      trailingFootnoteReferencePattern.test(input.slice(-footnoteWindow))
    );
  };

  const hasFootnoteDefinition = (input: string): boolean => {
    const memo = footnoteDefinitionMemo;
    const found = extendsMemo(memo, input)
      ? memo.found || footnoteDefinitionPattern.test(footnoteTail(memo, input))
      : footnoteDefinitionPattern.test(input);
    footnoteDefinitionMemo = { input, found };
    return found;
  };

  const hasLinkDefinition = (input: string): boolean => {
    const memo = linkDefinitionMemo;
    let found: boolean;
    if (!extendsMemo(memo, input)) {
      found = linkDefinitionPattern.test(input);
    } else if (memo.found) {
      found = true;
    } else {
      // A new match ends after the previous input, and its label holds no "]",
      // so it starts on the line after the previous input's last "]" (ignoring
      // its final character, which a new ":" can follow).
      const previousLength = memo.input.length;
      const bracket =
        previousLength >= 2
          ? memo.input.lastIndexOf("]", previousLength - 2)
          : -1;
      const start = bracket < 0 ? 0 : input.lastIndexOf("\n", bracket) + 1;
      found = linkDefinitionPattern.test(input.slice(start));
    }
    linkDefinitionMemo = { input, found };
    return found;
  };

  return { hasFootnoteReference, hasFootnoteDefinition, hasLinkDefinition };
};

export type DefinitionScanner = ReturnType<typeof createDefinitionScanner>;
