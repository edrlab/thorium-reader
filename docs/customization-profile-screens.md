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

Thorium addresses each screen with an internal `/profile/:screenId` route. The identifier is derived from the manifest `href`; a route can only load the localized `rel: "screen"` resource it resolves to in the active manifest.
