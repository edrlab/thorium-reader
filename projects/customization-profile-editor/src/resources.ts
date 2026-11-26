import { languageError, makeTextEditor } from "#profile-editor/text";
import type { LocalizedText } from "#profile-editor/text";
import { resourcePath } from "#profile-editor/paths";

export interface Resource extends Record<string, unknown> {
    href?: string;
    rel?: string;
    type?: string;
    title?: LocalizedText;
    language?: string;
    properties?: Record<string, unknown> & { authenticate?: Resource };
}
interface ResourceCard {
    element: HTMLDetailsElement;
    read: () => Resource;
}

const presets: Record<string, Resource> = {
    logo: { rel: "logo", href: "", type: "image/svg+xml" },
    "welcome-image": { rel: "welcome-screen", href: "", type: "image/png" },
    image: { rel: "image", href: "" },
    "welcome-page": { rel: "welcome-screen", href: "", type: "text/html" },
    screen: { rel: "screen", href: "", type: "text/html" },
    catalog: { rel: "catalog", href: "" },
    self: { rel: "self", href: "" },
    link: { href: "" },
    cover: { href: "", type: "image/jpeg" },
    book: { rel: "http://opds-spec.org/acquisition/open-access", href: "", type: "application/epub+zip" },
};
let nextCardId = 0;

export function checkResourceShapes(manifest: Record<string, unknown>) {
    for (const kind of ["images", "links"]) {
        const resources = manifest[kind] as Resource[] | undefined;
        for (const [index, resource] of (resources || []).entries()) {
            const location = `${kind}[${index}]`;
            for (const key of ["href", "rel", "type", "language"]) {
                if (Object.hasOwn(resource, key) && typeof resource[key] !== "string") {
                    throw new Error(`${location}.${key} must be a string.`);
                }
            }
            const title = resource.title;
            if (title !== undefined && typeof title !== "string" && (
                !title || Array.isArray(title) || typeof title !== "object" ||
                Object.values(title).some((text) => typeof text !== "string")
            )) throw new Error(`${location}.title must be text or a language-to-text object.`);
            const properties = resource.properties;
            if (properties !== undefined && (!properties || Array.isArray(properties) || typeof properties !== "object")) {
                throw new Error(`${location}.properties must be an object.`);
            }
            const auth = properties?.authenticate;
            if (auth !== undefined) {
                if (!auth || Array.isArray(auth) || typeof auth !== "object") {
                    throw new Error(`${location}.properties.authenticate must be an object.`);
                }
                for (const key of ["href", "type"]) {
                    if (Object.hasOwn(auth, key) && typeof auth[key] !== "string") {
                        throw new Error(`${location}.properties.authenticate.${key} must be a string.`);
                    }
                }
            }
        }
    }
}

export function hrefError(value: string, localOnly = false, remoteOnly = false): string {
    const location = resourcePath(value);
    if (location.error) return location.error;
    if (localOnly && location.kind === "remote") return "Use a file path relative to the profile folder for this resource.";
    if (remoteOnly || /^https?:/i.test(value)) {
        try {
            const url = new URL(value);
            if (!["http:", "https:"].includes(url.protocol) || !url.hostname) throw new Error();
        } catch {
            return "Enter an absolute HTTP or HTTPS URL.";
        }
    }
    return "";
}

export function mediaTypeError(value: string): string {
    return !value || /^[a-z0-9!#$%&'*+.^_`|~-]+\/[a-z0-9!#$%&'*+.^_`|~-]+(?:\s*;[^\r\n]+)?$/i.test(value)
        ? "" : "Enter a media type such as image/svg+xml or text/html.";
}

export function makeResourceList(
    kind: "images" | "links", onChange: () => void, scope: ParentNode = document, prefix: string = kind, publication = false,
) {
    const container = scope.querySelector<HTMLElement>(`#${prefix}-list`);
    const empty = scope.querySelector<HTMLElement>(`#${prefix}-empty`);
    const add = scope.querySelector<HTMLButtonElement>(`#add-${prefix}`);
    const preset = scope.querySelector<HTMLSelectElement>(`#${prefix}-preset`);
    const noun = publication ? kind === "images" ? "cover" : "book link" : kind === "images" ? "image" : "link";
    let cards: ResourceCard[] = [];
    let present = false;

    function updateOrder() {
        empty.hidden = !!cards.length;
        cards.forEach((card, index) => {
            card.element.querySelector<HTMLButtonElement>(".move-up").disabled = index === 0;
            card.element.querySelector<HTMLButtonElement>(".move-down").disabled = index === cards.length - 1;
            card.element.querySelector(".entry-number").textContent = `${index + 1}.`;
            container.append(card.element);
        });
    }

    function insert(source: Resource, index: number, open: boolean) {
        const original = structuredClone(source);
        const id = `resource-${nextCardId++}`;
        const element = document.createElement("details");
        element.className = "resource-entry";
        element.dataset.kind = publication ? kind === "images" ? "Cover" : "Book link" : kind === "images" ? "Image" : "Link";
        element.open = open;
        element.innerHTML = `
            <summary><span class="entry-number"></span><span class="entry-label"></span><span class="entry-location"></span></summary>
            <div class="entry-fields">
                <div class="entry-actions">
                    <button type="button" class="move-up" aria-label="Move ${noun} up">↑ Up</button>
                    <button type="button" class="move-down" aria-label="Move ${noun} down">↓ Down</button>
                    <button type="button" class="duplicate" aria-label="Duplicate ${noun}">Duplicate</button>
                    <button type="button" class="remove-entry" aria-label="Remove ${noun}">Remove</button>
                </div>
                <label for="${id}-href">Path or URL</label>
                <input id="${id}-href" data-field="href" type="text" required spellcheck="false" placeholder="${kind === "images" ? "images/logo.svg" : "screen/help-en.html or https://example.org/catalog.json"}">
                <p class="hint">Local paths are relative to the profile folder. Keep the referenced files there before packing.</p>
                <div class="resource-columns">
                    <div><label for="${id}-rel">Relation <span class="optional">(optional)</span></label><input id="${id}-rel" data-field="rel" type="text" spellcheck="false" list="${kind}-relations"></div>
                    <div><label for="${id}-type">Media type <span class="optional">(optional)</span></label><input id="${id}-type" data-field="type" type="text" placeholder="${kind === "images" ? "image/svg+xml" : "text/html"}" spellcheck="false"></div>
                </div>
                <label for="${id}-language">Language <span class="optional">(optional)</span></label>
                <input id="${id}-language" data-field="language" type="text" placeholder="en or fr-CA" spellcheck="false">
                <div class="resource-title"></div>
                ${kind === "links" && !publication ? `<div class="authentication">
                    <label class="checkbox-label"><input type="checkbox" class="auth-enabled"> Configure catalog authentication</label>
                    <div class="auth-fields">
                        <label for="${id}-auth-href">Authentication URL <span class="optional">(optional)</span></label>
                        <input id="${id}-auth-href" data-field="auth-href" type="text" spellcheck="false" placeholder="https://example.org/authentication.json">
                        <p class="hint">Leave the URL empty to let Thorium discover authentication.</p>
                        <label for="${id}-auth-type">Authentication media type</label>
                        <input id="${id}-auth-type" data-field="auth-type" type="text" required spellcheck="false" placeholder="application/opds-authentication+json">
                    </div>
                </div>` : ""}
                <p class="hint resource-extras"></p>
                <p class="entry-error" hidden></p>
            </div>`;
        const inputs = new Map<string, HTMLInputElement>();
        for (const input of element.querySelectorAll<HTMLInputElement>("[data-field]")) inputs.set(input.dataset.field, input);
        for (const key of ["href", "rel", "type", "language"]) inputs.get(key).value = source[key] as string || "";
        const readTitle = makeTextEditor(element.querySelector(".resource-title"), `${id}-title`, `${kind === "images" ? "Image" : "Link"} title`, source.title, false, onChange);
        const authEnabled = element.querySelector<HTMLInputElement>(".auth-enabled");
        const sourceAuth = source.properties?.authenticate;
        if (authEnabled) {
            authEnabled.checked = sourceAuth !== undefined;
            inputs.get("auth-href").value = sourceAuth?.href || "";
            inputs.get("auth-type").value = sourceAuth ? sourceAuth.type || "" : "application/opds-authentication+json";
            const toggleAuth = () => {
                element.querySelector<HTMLElement>(".auth-fields").hidden = !authEnabled.checked;
                for (const key of ["auth-href", "auth-type"]) inputs.get(key).disabled = !authEnabled.checked;
            };
            toggleAuth();
            authEnabled.addEventListener("change", () => { toggleAuth(); onChange(); });
        }
        const extras = Object.keys(source).filter((key) => !["href", "rel", "type", "title", "language"].includes(key));
        element.querySelector(".resource-extras").textContent = extras.length ? `Additional fields preserved: ${extras.join(", ")}.` : "";
        const card: ResourceCard = {
            element,
            read() {
                const result = structuredClone(original);
                result.href = inputs.get("href").value;
                for (const key of ["rel", "type", "language"] as const) {
                    const value = inputs.get(key).value;
                    if (value || original[key] === "") result[key] = value;
                    else delete result[key];
                }
                const title = readTitle();
                if (title !== undefined) result.title = title;
                else delete result.title;
                const localOnly = !publication && (kind === "images" ? ["logo", "welcome-screen"].includes(result.rel)
                    : ["screen", "welcome-screen"].includes(result.rel));
                inputs.get("href").setCustomValidity(hrefError(result.href, localOnly, !publication && kind === "links" && result.rel === "catalog"));
                inputs.get("type").setCustomValidity(!publication && kind === "links" && ["screen", "welcome-screen"].includes(result.rel) && result.type && result.type !== "text/html"
                    ? "HTML pages must use text/html, or leave the media type empty." : mediaTypeError(result.type || ""));
                inputs.get("language").setCustomValidity(languageError(result.language || ""));
                if (authEnabled) {
                    const properties = structuredClone(original.properties || {});
                    if (authEnabled.checked) {
                        const auth = structuredClone(sourceAuth || {});
                        const href = inputs.get("auth-href").value;
                        const type = inputs.get("auth-type").value;
                        if (href || Object.hasOwn(sourceAuth || {}, "href") || !sourceAuth) auth.href = href;
                        else delete auth.href;
                        if (type || Object.hasOwn(sourceAuth || {}, "type") || !sourceAuth) auth.type = type;
                        else delete auth.type;
                        inputs.get("auth-href").setCustomValidity(href ? hrefError(href, false, true) : "");
                        inputs.get("auth-type").setCustomValidity(type.split(";")[0].trim().toLowerCase() === "application/opds-authentication+json"
                            ? "" : "Use application/opds-authentication+json for catalog authentication.");
                        properties.authenticate = auth;
                    } else delete properties.authenticate;
                    if (Object.keys(properties).length || original.properties !== undefined) result.properties = properties;
                    else delete result.properties;
                }
                const names: Record<string, string> = publication ? { "http://opds-spec.org/acquisition/open-access": "Book file" } : kind === "images"
                    ? { logo: "Logo", "welcome-screen": "Welcome image", image: "Additional image" }
                    : { screen: "Navigation page", "welcome-screen": "Welcome page", catalog: "Catalog", self: "Self link" };
                element.querySelector(".entry-label").textContent = Object.hasOwn(names, result.rel) ? names[result.rel] : result.rel || `Additional ${noun}`;
                element.querySelector(".entry-location").textContent = result.href || "Enter a path or URL";
                return result;
            },
        };
        cards.splice(index, 0, card);
        element.querySelector(".duplicate").addEventListener("click", () => {
            insert(card.read(), cards.indexOf(card) + 1, true);
            present = true;
            onChange();
            cards[cards.indexOf(card) + 1].element.querySelector<HTMLInputElement>("[data-field=href]").focus();
        });
        element.querySelector(".remove-entry").addEventListener("click", () => {
            const index = cards.indexOf(card);
            cards.splice(index, 1);
            element.remove();
            present = true;
            updateOrder();
            onChange();
            (cards[Math.min(index, cards.length - 1)]?.element.querySelector("summary") || add).focus();
        });
        for (const [selector, direction] of [[".move-up", -1], [".move-down", 1]] as const) {
            element.querySelector(selector).addEventListener("click", () => {
                const index = cards.indexOf(card);
                const destination = index + direction;
                if (destination < 0 || destination >= cards.length) return;
                cards.splice(index, 1);
                cards.splice(destination, 0, card);
                updateOrder();
                onChange();
                element.querySelector("summary").focus();
            });
        }
        updateOrder();
    }

    add.addEventListener("click", () => {
        insert(presets[preset.value], cards.length, true);
        present = true;
        onChange();
        cards[cards.length - 1].element.querySelector<HTMLInputElement>("[data-field=href]").focus();
    });
    return {
        load(resources: Resource[] | undefined) {
            cards = [];
            container.replaceChildren();
            present = resources !== undefined;
            for (const resource of resources || []) insert(resource, cards.length, false);
            updateOrder();
        },
        read() {
            return present ? cards.map((card) => card.read()) : undefined;
        },
    };
}
