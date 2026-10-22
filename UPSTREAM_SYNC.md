# Upstream sync — 2026-10-22

Synchronized the fork from `3c1e65f` with
[`vercel/streamdown@c5e44d8`](https://github.com/vercel/streamdown/commit/c5e44d8).
All seven new upstream commits are retained in merge history. Fork package
names and versions, publishing policy, documentation components, diagram
adapters, custom tags, smoothing, effects, and incremental rendering remain.

## New and recently updated PRs

Reviewed all 25 open upstream PRs with the GitHub CLI. The primary window was
October 17–22, also checking updates back to October 8 and recently closed PRs.
Fetched candidate heads and inspected their commits, diffs, checks, and reviews.
Upstream main and the selected heads of #670, #682, #692, #693, and #695
are retained in merge history. #685 and #689 are adapted through the
corresponding commits in #670.

| Upstream PR | Decision | Reason and adaptation |
| --- | --- | --- |
| [#670 — updated emphasis engine](https://github.com/vercel/streamdown/pull/670) | Updated through `321668c` | Keeps the previously integrated 13 emphasis commits and adds current-block link completion. Preserves pending inline markers, incomplete-image placeholders, and empty-list whitespace. |
| [#685 — current-block links](https://github.com/vercel/streamdown/pull/685) | Integrated through #670 | Uses #670's adaptation to the CommonMark engine rather than duplicating the independent PR's older scanner. Includes its standalone remend regression cases. |
| [#689 — repair the streaming tail](https://github.com/vercel/streamdown/pull/689) | Relevant optimization adapted through #670 | The fork already repairs only the trailing block and incrementally lexes the tail, including custom-tag messages. Retains that implementation instead of adding a second repair pass. Ports incremental footnote and reference-definition checks, with scanner state per message rather than upstream's module-level memos. Tests compare incremental parsing with full parsing on every prefix and the scans with full regexes. |
| [#693 — stable Mermaid SVG markup](https://github.com/vercel/streamdown/pull/693) | Integrated and generalized | Memoizes the HTML object in the shared SVG renderer, preserving DOM across context updates for Mermaid, PlantUML, Vega, SMILES, and additional SVG engines. Keeps diagram chunks lazy. |
| [#682 — revised lazy animation](https://github.com/vercel/streamdown/pull/682) | Updated through `f477852` | Counts committed text while the engine loads and transfers its exact offset to the fade. Preserves the released main/core/animate API, eager engines, effect seeds, smoothing, bounded retries, atomic code-block animation, skipped tables, and actual browser animation draining. Includes discarded-render, hydration, counter-parity, and plugin-identity tests. |
| [#695 — raw HTML ID hardening](https://github.com/vercel/streamdown/pull/695) | Integrated with compatibility correction | Protects native HTML IDs and names after payload extraction, with one `user-content-` prefix. Local fragment and accessibility references use the same namespace across streaming blocks. Preserves application identifier props for mapped custom components (including Sciobot's entity IDs) and data-only payloads. Unmapped custom DOM elements are protected too. Explicit replacement rehype pipelines retain their own policy. |
| [#692 — KaTeX patch](https://github.com/vercel/streamdown/pull/692) | Integrated | Updates math and website dependencies to `^0.18.2`, including KaTeX's settings prototype-pollution fix. Bundles the rehype adapter with its shared utilities external so the published renderer uses the package's declared KaTeX runtime instead of rehype-katex's private 0.16.x copy. A built-consumer test verifies which runtime actually renders. Preserves the fork's other direct dependency versions. |
| [#657 — RTL](https://github.com/vercel/streamdown/pull/657) | Already covered | The updated head offers no additional behavior beyond the fork's logical utilities and merge configuration. Upstream main now contains #654; retain the fork's broader diagram controls, list styling, wrapping, and prefix support. |
| [#674 — CJK autolinks](https://github.com/vercel/streamdown/pull/674) | Already covered | Head unchanged from the prior sync; retain the fork's correction for URL underscores before CJK punctuation. |
| [#690 — Version Packages](https://github.com/vercel/streamdown/pull/690) | Not applied | Fork releases and package identities are independent. |
| [#696 — Geistdocs 2.12.4](https://github.com/vercel/streamdown/pull/696) | Not applied | The fork retains its local documentation components and Geistdocs 1.x. The upstream website migration is incompatible with that setup. |
| [#346 — code headers](https://github.com/vercel/streamdown/pull/346) | Not applied | Recently closed, with no code updates since January. Its inline component recreation, `any` props, and build/workspace changes do not fit this fork; exported code-block primitives and custom renderers already support composing actions. |

The other reviewed open PRs remain covered by the previous sync or existing
fork implementations. Closed #688 and #687 were replaced by #689 and #692;
closed #606 only proposed temporary homepage copy.

## New upstream main changes

- Integrates #684: fenced code inside custom tags keeps its blank lines without
  visible HTML-comment placeholders. Retains the fork's code-range-aware tag
  recognition and self-closing-tag handling.
- Integrates #614: `codeBlockRawLanguages` renders selected fences verbatim,
  with no highlighting or controls. Custom renderers and all fork diagram
  plugins take precedence. Raw code stays LTR and honors prefixed classes.
- Updates both apps to pinned Next.js 16.3.8 from #649.
- Reconciles #654 RTL and upstream release metadata against the already released
  fork changes, without duplicating their changesets or changing fork versions.
- Leaves upstream Geistdocs upgrades out of the fork website.

## Validation

- `pnpm build:packages`: all 12 package builds and declarations pass.
- `pnpm exec turbo run build --filter=website --filter=test --concurrency=1`:
  all 14 tasks pass, including both applications on Next.js 16.3.8.
- `pnpm exec turbo run test --concurrency=1 -- --maxWorkers=2 --testTimeout=60000`:
  all 12 package tasks pass, with 2,558 passing tests and the existing
  corpus-dependent benchmark skipped. After binding the published math adapter
  to its declared KaTeX runtime, all 14 math tests pass, including one new
  built-consumer regression; total coverage is 2,559 distinct passing tests.
- `NUM_RUNS=20000 pnpm --filter @lofcz/remend exec vitest run
  __tests__/emphasis-oracle.test.ts __tests__/streaming-properties.test.ts
  --maxWorkers=2 --testTimeout=60000`: all 16 tests pass, with 20,000 samples
  per configurable property.
- Production consumer tests verify main/core raw-HTML behavior, minified parser
  compatibility, deferred animation and diagram chunks, and NodeNext/Bundler
  declaration types. New coverage includes committed animation handoffs,
  source-block parsing equivalence, native HTML IDs, cross-block local links,
  footnote accessibility targets, custom component IDs, and structured payloads.
- The built math consumer intercepts its direct KaTeX dependency and confirms
  that it renders the formula. Packed math contents include the adapter,
  declarations, explicit runtime dependencies, and the upstream MIT notice.
- `pnpm check`: all 495 checked files pass. The changeset action's nine tests
  pass, and all eight incoming changesets satisfy the fork's patch policy.
  Release planning includes Streamdown, remend, and math; package versions
  remain unchanged.
- The final frozen lockfile check passes. `git diff --check` passes.
  Upstream main `c5e44d8` and the selected PR heads listed above are ancestors
  of the result.

---

# Upstream sync — 2026-10-17

The fork was synchronized from `d5de4b4` with
[`vercel/streamdown@fea4ef5`](https://github.com/vercel/streamdown/commit/fea4ef5baada951c0f907e29669d1cba1f8beec1).
All 21 incoming upstream commits are represented in the merge history. Existing
ports were reconciled with their upstream versions instead of applied twice.

## Open PR review

Reviewed with `gh pr list`, `gh pr view`, `gh pr diff`, and fetched PR heads.
The primary window was October 3–17, with older recently updated PRs checked
for overlap. GitHub check results were advisory; selected changes were built
and tested in this fork.

| Upstream PR | Decision | Reason and adaptation |
| --- | --- | --- |
| [#670 — CommonMark emphasis engine](https://github.com/vercel/streamdown/pull/670) | Integrated | Replaces superseded per-marker counting with delimiter matching, correct nesting, block boundaries, and escaped-marker handling. All 13 original PR commits are retained. Preserves the fork's opt-in `pendingInlineMarkers`, empty-list whitespace, and incomplete-image placeholders. Includes parser-oracle tests. |
| [#653 — close the currently open math block](https://github.com/vercel/streamdown/pull/653) | Integrated | Fixes single-line math after earlier multiline math and unfinished formulas inside table cells. Original commit retained through cherry-pick attribution. |
| [#674 — CJK bold autolinks](https://github.com/vercel/streamdown/pull/674) | Integrated with correction | Restores bold links before CJK punctuation. Corrects the reported regression where `foo__https://example.com/__、英語版` incorrectly loses URL underscores. Tests cover ASCII, CJK, accented letters, and combining marks. |
| [#657 — logical RTL utilities](https://github.com/vercel/streamdown/pull/657) | Integrated with adaptation | Mirrors lists, quotes, headers, images, and menus. Retains fork list-depth styling, table wrapping, image lightboxes, prefixed classes, and CSV BOM handling. Fixes the PR's inferred array types so declaration builds pass. |
| [#654 — logical RTL classes](https://github.com/vercel/streamdown/pull/654) | Selected additions integrated | Shares the main changes with #657. Adapts additional modal and diagram controls to the fork's shared renderer and updates exported Tailwind classes. Keeps code blocks explicitly LTR. |
| [#668 — quiet partial Mermaid errors](https://github.com/vercel/streamdown/pull/668) | Integrated with adaptation | Keeps the loader while an incomplete chart streams and shows final errors after fence closure. Applied to the shared diagram renderer. Final renders bypass streaming cooldowns even when chart text is unchanged. |
| [#680 — lazy Mermaid block](https://github.com/vercel/streamdown/pull/680) | Already covered | The fork already loads `DiagramCodeBlock` with one dynamic import, including chart and controls, for every SVG diagram plugin. Retained this broader implementation. |
| [#678 — drain animation backlog](https://github.com/vercel/streamdown/pull/678) | Already covered | The fork waits for actual browser animations, including delays, rather than a calculated timer. Existing tests cover the final chunk, resumed streams, content changes during drain, and unrelated/infinite animations. |
| [#663 — optional raw-HTML core entry](https://github.com/vercel/streamdown/pull/663) | Integrated with correction | Adds `@lofcz/streamdown/core` without `rehype-raw` or `parse5`. Removes the PR's function-name detection, which failed under production minification. Supplied parsers run normally; residual raw nodes become text before sanitization or are omitted with `skipHtml`. Minified consumer tests cover renamed parsers, sanitization, literal HTML, and the dependency boundary. Original PR commit retained. |
| [#682 — lazy word-fade engine](https://github.com/vercel/streamdown/pull/682) | Integrated with adaptation | Adds `@lofcz/streamdown/animate` and a shared lazy loader for main and core entries, with bounded retry and an eager plugin option. Preserves fork effects, smoothing, actual browser animation draining, and processor identity isolation. Animation history follows block IDs; deterministic effect seeds support eager hydration. Tests cover cold/warm hydration, late loading, engine replacement, effect callback changes, head edits, growing lines, and production bundle boundaries. Original PR commit retained. |
| [#662 — Geistdocs dependency update](https://github.com/vercel/streamdown/pull/662) | Not applied | Upstream uses Geistdocs v2; the fork retains its local documentation components and current dependency line. An upstream website migration would overwrite fork functionality. |
| [#649 — Next.js dependency pin](https://github.com/vercel/streamdown/pull/649) | Superseded by upstream main | Applied upstream main's newer Next.js 16.3.7 to both apps instead of the PR's 16.3.6 pin. |
| [#648 — upstream release PR](https://github.com/vercel/streamdown/pull/648) | Not applied | Fork package names, release versions, and publishing workflow are independent. Incoming changesets use fork package names. |
| [#625 — smooth streaming](https://github.com/vercel/streamdown/pull/625), [#626 — animation effects](https://github.com/vercel/streamdown/pull/626) | Already integrated | The fork already includes smoothing, animation lifetime fixes, and the effects package. |
| [#630 — incomplete HTML classifier](https://github.com/vercel/streamdown/pull/630) | Already integrated | The fork already includes the plausible-tag classifier and its regression coverage. |

## Reconciliation choices

- Adopted upstream's container-aware remend scanner and cache cleanup, plus
  the new emphasis engine. Kept fork pending-marker and image-placeholder behavior.
- Adopted the cost-bounded highlight LRU and skipped caching unfinished code.
  Preserved object identity for custom themes with identical names and full-source
  cache keys, which upstream's implementation would regress.
- Added cross-block reference-link resolution, including nested definitions,
  while retaining parser state per component and avoiding duplicate tail lexing.
- Adopted CJK character animation, root `data-*`/`aria-*` forwarding, and the
  caret hydration optimization. Retained the caret observer for lazy/custom hosts.
  Upstream Mermaid translation keys are accepted as aliases, with fork keys
  taking precedence.
- Kept the shared diagram adapters, Mermaid auto-fix, diagram plugins, browser
  animation draining, custom scrollable support, and stable code scroll geometry.
- Kept the fork's website, package identities, versions, build scripts,
  publishing and deployment configuration, and CI policy. Upstream
  signed-commit enforcement
  was not installed as a new fork policy.
- Updated both apps to upstream main's Next.js 16.3.7 and applied the OG image
  proxy exclusion to the fork's middleware.
- Added upstream's released/local comparison page, using published fork
  packages as the released baseline. The app build also exposed an existing
  OverlayScrollbars ref type mismatch; the adapter now consumes the native
  div ref rather than forwarding it to a different component-instance type.
  The live model catalog is fetched at request time so builds do not require
  AI Gateway credentials.

The emphasis change consolidates built-in handlers at priority 30. Custom remend
handlers ordered against the previous emphasis priorities may need adjustment;
this is documented in the changeset and termination documentation. Changesets
follow the fork's existing patch-release policy.

## Validation

- `pnpm build:packages`: all 12 package builds and declaration generation pass,
  including the public `HighlightResult` and `HighlightToken` exports.
- `pnpm exec turbo run build --filter=website --filter=test --concurrency=1`:
  all 14 tasks pass; both apps build on Next.js 16.3.7.
- `pnpm exec turbo run test --concurrency=1 -- --maxWorkers=4 --testTimeout=60000`:
  all 12 package tasks pass, covering 2,457 tests. One corpus-dependent
  benchmark is intentionally skipped. Follow-up suites pass for the added
  translation aliases, final Mermaid cooldown, static mount count, and caret
  hydration. Package scheduling was limited after an initial parallel run
  exhausted worker startup time while the website was also building.
- `NUM_RUNS=20000 pnpm --filter @lofcz/remend exec vitest run --maxWorkers=2
  --testTimeout=60000 __tests__/emphasis-oracle.test.ts
  __tests__/streaming-properties.test.ts`: all 16 tests pass, with 20,000 samples
  per configurable randomized property.
- `pnpm check`: all 469 checked files pass.
- Changeset action: all nine tests pass. All 13 incoming fork changesets pass
  the existing patch-release policy. Release planning includes Streamdown,
  remend, CJK, and code highlighting; published versions were not changed.
- Production consumer bundling confirms that the fork's SVG diagram block
  actions and fullscreen controls remain behind dynamic imports, using the
  bundle helper from upstream PR #680.
- Built website HTTP smoke checks: `/opengraph-image.png` returns `200 image/png`
  without a locale redirect, `/docs/configuration` returns `200 text/html`, and
  `/sitemap.xml` returns `200 application/xml`.
- `git diff --check` passes. Upstream `fea4ef5` is an ancestor of the result.

## Follow-up validation for #663 and #682

Both previously deferred PRs are integrated with their original commits retained.
The core entry lets supplied parsers run before escaping residual HTML, removing
the minification-sensitive registry entirely. The animation entry retains fork
effects, smoothing, browser animation draining, and processor identity caching.
Block history follows source Markdown before remend adds closing markers, so
growing emphasis and list lines preserve their DOM and animation state.

- All 12 package builds and declaration generation pass.
- Both Next.js applications build: all 14 build tasks pass.
- All 12 package test tasks pass: 2,500 tests, with the existing corpus-dependent
  benchmark skipped. A subsequent 37-test focused run passes after ESM declaration
  references were corrected, including two new TypeScript consumer checks for
  NodeNext and bundler resolution.
- Production consumer builds verify literal HTML without `rehype-raw`/`parse5`,
  renamed minified parsers with sanitization, and lazy animation boundaries for
  both main and core entries. Built rendering tests also exercise both entries
  alongside the legacy standalone animation plugin.
- Cold and warm hydration, eager effect hydration, late engine arrival, bounded
  retries, engine replacement, callback changes, head edits, incomplete emphasis,
  smoothing, and final browser animation draining have regression coverage.
- Package exports and tarball contents include core, animate, Tailwind classes,
  CSS, and declarations. Both new changesets follow the fork's patch policy;
  package versions remain unchanged.
- `pnpm check` passes for all 484 checked files, and `git diff --check` passes.
