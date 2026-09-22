# Customization profile screens

A customization manifest can add Library navigation pages with `rel: "screen"` links. Thorium displays the links matching the application locale; when none match, it uses English and language-neutral links in manifest order.

Profile screen documents must follow this contract:

- Use `text/html` (or omit the link type) and provide exactly one `<h1>`.
- Do not add a `<main>` landmark. Thorium owns the page `<main>`; any nested `<main>` is converted to `<section class="profile-content">`.
- Do not use scripts, frames, embedded objects, external stylesheets, `@import`, or `@font-face`.
- Inline `<style>` rules must target `.custom-profile-screen` or a descendant. A `body[data-theme]` condition may precede that selector.
- Do not set application typography. Thorium enforces its Nunito font and standard heading and text sizes.
- Inline layout and color styles are allowed. Thorium sanitizes the markup before rendering it.

Thorium addresses each screen with an internal `/profile/:screenId` route. The identifier is derived from the manifest `href`; a route can only load the localized `rel: "screen"` resource it resolves to in the active manifest.
