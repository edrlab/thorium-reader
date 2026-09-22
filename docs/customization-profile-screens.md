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

The browser first parses the stylesheet into CSSOM rules and gives Thorium a `selectorText` for each retained style rule. Thorium then parses every selector list with [`css-selector-parser`](https://github.com/mdevils/css-selector-parser) in strict Selectors Level 4 mode. The AST is checked directly, without a second normalized model:

1. An optional ancestor must be exactly `body[data-theme]` or `body[data-theme="value"]`, without a namespace, another compound condition, a case-sensitivity modifier, or an operator other than `=`. It must be connected to the profile root by descendant whitespace.
2. The first item in the profile-root compound must be the exact `custom-profile-screen` class. Because the parser decodes CSS identifiers, a valid escaped spelling such as `.custom-profile-\73 creen` is also accepted, while lookalikes remain rejected.
3. With no following compound, the selector targets the profile root and is safe.
4. When another compound follows the root, its first combinator must be descendant whitespace or child (`>`). A sibling (`+` or `~`) or column (`||`) combinator at this position is rejected because it can target content outside the root.
5. Later combinators cannot escape the subtree after the selector has entered it, so they do not affect the containment decision. For example, `.custom-profile-screen .card + .card` is safe, while `.custom-profile-screen + .card` is not.

An empty selector list, a parser exception, an unsafe selector in a list, an unknown CSS rule shape, or an unsupported global at-rule causes validation to fail closed. `css-selector-parser` only provides the AST; the containment checks in `selectorCssParser.ts` remain the Thorium security policy.

### Test strategy and limitations

`style.test.ts` exercises both enforcement layers. Fourteen stylesheet tests pass CSS through CSSOM and verify selector lists, grouping rules, resource-loading and global at-rules, executable legacy values, escaped identifiers, and parser failures. A table of 42 direct selector cases covers the policy independently of CSSOM, including theme qualifiers, compound conditions, pseudo-classes, attributes containing combinator characters, namespaces, escaped lookalikes, partial selector lists, nesting selectors, malformed input, and every relevant combinator position.

The suite is intentionally exhaustive for the Thorium policy, not for the complete CSS grammar. Important limits remain:

- JSDOM and the Chromium version embedded by Electron may normalize or discard stylesheet syntax differently. The direct selector tests reduce this blind spot, but they do not replace an Electron integration check.
- A future parser version can change its AST or accepted grammar. The validator catches exceptions and rejects unexpected structures, but dependency upgrades still require the focused suite, TypeScript checks, the full test suite, and the Library renderer build.
- Failing closed protects Thorium-owned UI but may reject a valid customization when new CSS syntax is not yet understood.
- A single parser removes differential cross-checking. Security now depends on the parser's tests, Thorium's explicit policy corpus, and review of the small AST-to-policy function.

### Code cost and security value

The final selector validator is 60 physical lines, of which 45 are non-blank non-comment lines. The stylesheet traversal and unsafe-value checks in `style.ts` add 57 physical lines, or 34 non-blank non-comment lines. Removing the custom scanner, Parsel adapter, and normalized policy deletes 299 physical source lines and removes the Parsel development dependency.

This reduction makes the production decision easier to audit and eliminates the maintenance risk of three implementations drifting apart. The trade-off is that `css-selector-parser` is now a production dependency and contributes code not represented by the local line count. Its strict grammar provides standards-compliant identifier decoding and avoids maintaining a handwritten selector parser, while the Thorium-specific allow/deny policy remains explicit and covered by 56 focused tests.

Thorium addresses each screen with an internal `/profile/:screenId` route. The identifier is derived from the manifest `href`; a route can only load the localized `rel: "screen"` resource it resolves to in the active manifest.
