# Customization profile screens

A customization manifest can add Library navigation pages with `rel: "screen"` links. Thorium displays the links matching the application locale; when none match, it uses English and language-neutral links in manifest order.

Profile screen documents must follow this contract:

- Use `text/html` (or omit the link type) and provide exactly one `<h1>`.
- Do not add a `<main>` landmark. Thorium owns the page `<main>`; any nested `<main>` is converted to `<section class="profile-content">`.
- Do not use scripts, frames, embedded objects, external stylesheets, `@import`, `@font-face`, `@keyframes`, or `@page`.
- Inline `<style>` rules must target `.custom-profile-screen` or a descendant. A `body[data-theme]` condition may precede that selector.
- Do not set application typography. Thorium enforces its Nunito font and standard heading and text sizes.
- Inline layout and color styles are allowed. Thorium sanitizes the markup before rendering it.

## Style selector rules

Thorium checks every selector in every inline stylesheet, including each member of a comma-separated selector list and rules nested in grouping at-rules such as `@media` and `@supports`. If any selector is outside the profile screen, Thorium rejects the document.

Every selector must start with the exact `.custom-profile-screen` class. It may optionally be preceded by one `body[data-theme]` condition, either without a value or with an exact value such as `body[data-theme="dark"]`. Conditions may be added to the profile root, and descendant or child combinators may then select content inside it.

Allowed examples:

```css
.custom-profile-screen { color: var(--color-primary); }
.custom-profile-screen.compact:hover { background: white; }
.custom-profile-screen .card + .card { margin-block-start: 1rem; }
.custom-profile-screen > section .card { display: grid; }
body[data-theme="dark"] .custom-profile-screen .card { background: black; }
```

Selectors are rejected when they use another ancestor, merely contain or resemble the scope class, or use a sibling or column combinator directly after the profile root. A sibling combinator between descendants is allowed because its target remains inside the profile screen.

Rejected examples:

```css
body .custom-profile-screen { color: red; }
body[data-other] .custom-profile-screen { color: red; }
:is(.custom-profile-screen, body) { color: red; }
.custom-profile-screen-other { color: red; }
.custom-profile-screen + .thorium-content { display: none; }
.custom-profile-screen, body { color: red; }
```

Only selector scope is validated here. The other stylesheet restrictions still apply: global or resource-loading at-rules such as `@import`, `@font-face`, `@keyframes`, and `@page` are rejected, as are executable legacy CSS values. A parser error also rejects the document.

### Selector validation algorithm

Thorium does not interpret raw selector text as a complete CSS grammar. The browser first parses the stylesheet into CSSOM rules and gives Thorium a normalized `selectorText` for each retained style rule. Invalid or unsupported syntax may be discarded by the browser's CSS parser and therefore cannot affect the document. Thorium applies the following checks to every retained selector:

1. Remove the optional `body[data-theme]` ancestor. No other ancestor prefix is removed or accepted.
2. Require the remaining selector to begin with the exact `.custom-profile-screen` class. The next character must either extend the same compound selector, start a combinator, or end the selector. This rejects lookalikes such as `.custom-profile-screen-other`.
3. Scan the text after the scope class from left to right. During this scan Thorium tracks quoted strings, escape sequences, square brackets, and parentheses. Consequently, characters inside an attribute selector or pseudo-class argument are not mistaken for top-level combinators.
4. Inspect the first top-level combinator. A descendant combinator (whitespace) or child combinator (`>`) is accepted because it moves the target inside the profile root. A sibling combinator (`+` or `~`) or column combinator (`||`) is rejected because it could target an element outside the root.
5. If no combinator follows the profile root, accept the selector because it only adds a class, ID, attribute, or pseudo-class condition to `.custom-profile-screen` itself.

Only the first top-level combinator is decisive. After a descendant or child combinator has moved into the profile subtree, later sibling combinators still select elements within that subtree. For example, `.custom-profile-screen .card + .card` is safe, while `.custom-profile-screen + .card` is not.

This scan is linear in the selector length. An exception from the CSS parser, an unknown retained rule shape, an unsafe selector in a selector list, or an unsupported global at-rule causes validation to fail closed and the profile document to be rejected.

Thorium keeps the handwritten selector validation in `selectorCustom.ts` as the runtime reference implementation, while `style.ts` applies it during stylesheet traversal. No maintained JavaScript policy library directly expresses Thorium's root-containment rule. The test suite compares the custom implementation with two AST-based implementations: [`css-selector-parser`](https://github.com/mdevils/css-selector-parser) and [`parsel-js`](https://github.com/LeaVerou/parsel). Both adapters normalize their parser-specific AST into the same Thorium-owned policy model, and all three implementations run against the complete enforcement corpus. The parser packages are development dependencies and are not included in the production runtime path.

The comparison currently exposes one intentional difference: `css-selector-parser` decodes a valid escaped spelling of `.custom-profile-screen`, while the handwritten scanner and Parsel fail closed on it. Other alternatives were PostCSS with `postcss-selector-parser`, which duplicates CSSOM stylesheet parsing and adds a larger dependency surface; Stylelint, which is intended for build-time linting; general CSS sanitizers, whose policies do not enforce Thorium's containment contract; and the Rust [`css-sanitizer`](https://github.com/levish0/css-sanitizer), which is not a JavaScript dependency and still requires a custom selector-isolation policy.

### Multi-implementation test strategy

`style.test.ts` defines the three selector validators in one parameterized table. Each validator runs against the same complete stylesheet enforcement corpus, covering accepted scope forms, selector lists, nested grouping rules, rejected ancestors, root-level sibling combinators, global at-rules, executable values, and parser failures. A second table exercises the validators directly with selectors for which all implementations must return the same decision.

Parser-specific cases are kept outside the shared table so a known difference cannot silently weaken the common expectations. The escaped profile-root identifier is one such case: `css-selector-parser` accepts it after decoding the escape, while the custom implementation and Parsel reject it. Another test verifies that `profileCssIsSafeAndScoped()` uses the custom implementation by default. Consequently, adding a validator to the table does not change production behavior.

This differential testing has important limits:

- Agreement between three implementations is not proof that the decision is correct. The test expectation remains the policy oracle, and the corpus may omit a CSS grammar edge case.
- The two AST adapters share `selectorPolicy.ts`. A defect in that common policy can therefore make both AST implementations agree incorrectly.
- The tests receive `selectorText` through CSSOM. Differences between JSDOM and the Chromium version embedded by Electron can still expose parser behavior that the unit tests do not reproduce.
- A parser upgrade can change AST shapes or supported syntax. Adapters fail closed on exceptions or unknown structures, but every dependency update still requires the complete comparison suite and the Library renderer build.
- Failing closed prevents a selector from escaping the profile root, but it may reject a valid customization. The comparison measures compatibility as well as security.

### Code cost and security value

The following snapshot counts physical lines and, separately, non-blank non-comment lines. The numbers are included to make the maintenance cost visible; line count is not itself a measure of security.

| Implementation area | Physical lines | Non-blank, non-comment lines | Production path |
| --- | ---: | ---: | --- |
| Custom handwritten validator (`selectorCustom.ts`) | 147 | 84 | Yes |
| Shared AST policy (`selectorPolicy.ts`) | 79 | 51 | No |
| `css-selector-parser` adapter | 59 | 42 | No |
| Parsel adapter | 73 | 55 | No |
| Combined AST comparison layer | 211 | 148 | No |

Parameterizing the existing stylesheet tests and adding explicit differential cases increased `style.test.ts` by a net 66 physical lines. The comparison therefore costs 211 source lines plus 66 test lines, in addition to two development dependencies. The AST comparison layer alone is about 1.4 times the physical size of the custom validator.

This extra code does not currently add a direct runtime security boundary: the custom validator remains the only implementation shipped and executed. Its security value is independent verification. It makes parser ambiguities visible, checks that two established parsers can express the Thorium policy, and provides evidence for a future replacement decision without increasing the Library bundle or its production dependency surface. The trade-off is worthwhile while implementations are being evaluated, but retaining all three indefinitely would increase maintenance and development-time supply-chain exposure. If one AST implementation replaces the custom validator, the unused adapter should be removed and the shared security corpus retained.

### Recommended outcome

`css-selector-parser` is the preferred production target. Its strict parser handles CSS identifier escapes and modern selector grammar more completely than the custom scanner, while its adapter and the shared Thorium policy remain comparable in size to the handwritten implementation. The custom validator is already conservative and fail-closed, so this change primarily improves standards compatibility and long-term maintainability rather than fixing a known selector escape vulnerability. In particular, rejecting the escaped spelling of `.custom-profile-screen` is a compatibility limitation, not a security bypass.

The migration should be staged:

1. Run the complete shared and differential corpus against all three implementations while `selectorCustom.ts` remains the production default.
2. Promote `css-selector-parser` to the production validator after validating the same behavior with the Chromium version embedded by Electron.
3. Keep the custom validator temporarily as an independent test comparison during a stabilization period.
4. Remove the Parsel adapter because its narrower grammar does not add enough independent coverage once `css-selector-parser` is selected.
5. Remove the custom implementation after stabilization, unless comparison tests continue to reveal useful parser regressions. Retain the shared security corpus regardless of the selected implementation.

The parser is not the security policy. `css-selector-parser` only turns selector text into a structured AST; `selectorPolicy.ts` must continue to enforce Thorium's `.custom-profile-screen` containment rule and reject incomplete, unknown, or unsafe structures. Dependency updates must therefore run the full selector corpus, TypeScript checks, and the Library renderer build before release.

Thorium addresses each screen with an internal `/profile/:screenId` route. The identifier is derived from the manifest `href`; a route can only load the localized `rel: "screen"` resource it resolves to in the active manifest.
