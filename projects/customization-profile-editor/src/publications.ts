import { checkResourceShapes, hrefError, makeResourceList, mediaTypeError } from "#profile-editor/resources";
import type { Resource } from "#profile-editor/resources";
import { languageError, makeTextEditor } from "#profile-editor/text";
import type { LocalizedText } from "#profile-editor/text";

export interface Publication extends Record<string, unknown> {
    metadata?: Record<string, unknown>;
    images?: Record<string, unknown>[];
    links?: Record<string, unknown>[];
}
interface PublicationCard {
    element: HTMLDetailsElement;
    read: () => Publication;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown): value is LocalizedText {
    return typeof value === "string" || isObject(value) && Object.values(value).every((text) => typeof text === "string");
}

function canGuide(value: Publication): boolean {
    if (value.metadata !== undefined && !isObject(value.metadata)) return false;
    if (value.metadata?.title !== undefined && !isText(value.metadata.title)) return false;
    try {
        for (const kind of ["links", "images"]) {
            if (value[kind] !== undefined && (!Array.isArray(value[kind]) || (value[kind] as unknown[]).some((item) => !isObject(item)))) return false;
        }
        checkResourceShapes(value);
        return true;
    } catch {
        return false;
    }
}

function publicationErrors(value: unknown): string[] {
    if (!isObject(value)) return ["A publication must be a JSON object."];
    const errors: string[] = [];
    const metadata = value.metadata;
    if (!isObject(metadata)) errors.push("metadata must be an object.");
    else {
        const title = metadata.title;
        if (!isText(title) || (typeof title === "string" ? !title.trim() : !Object.keys(title).length || Object.values(title).some((text) => !text.trim()))) {
            errors.push("metadata.title must contain a title as text or translations.");
        } else if (typeof title !== "string") {
            const seen = new Set<string>();
            for (const language of Object.keys(title)) {
                if (!language || languageError(language)) errors.push("metadata.title contains an invalid language tag.");
                if (seen.has(language.toLowerCase())) errors.push("metadata.title contains duplicate languages.");
                seen.add(language.toLowerCase());
            }
        }
        if (metadata.language !== undefined) {
            const languages = Array.isArray(metadata.language) ? metadata.language : [metadata.language];
            if (languages.some((language) => typeof language !== "string" || !language || languageError(language))) {
                errors.push("metadata.language must contain language tags such as en or fr-CA.");
            }
        }
    }
    for (const kind of ["links", "images"]) {
        if (value[kind] === undefined) continue;
        if (!Array.isArray(value[kind])) {
            errors.push(`${kind} must be an array.`);
            continue;
        }
        for (const [index, resource] of (value[kind] as unknown[]).entries()) {
            if (!isObject(resource)) {
                errors.push(`${kind}[${index}] must be an object.`);
                continue;
            }
            const error = typeof resource.href === "string" ? hrefError(resource.href) : "href must be a nonempty string.";
            if (error) errors.push(`${kind}[${index}]: ${error}`);
            if (resource.type !== undefined && (typeof resource.type !== "string" || mediaTypeError(resource.type))) {
                errors.push(`${kind}[${index}].type must be a media type.`);
            }
        }
    }
    return errors;
}

export function makePublicationList(onChange: () => void) {
    const container = document.getElementById("publications-list");
    const empty = document.getElementById("publications-empty");
    const add = document.getElementById("add-publication");
    let cards: PublicationCard[] = [];
    let present = false;
    let nextId = 0;

    function updateOrder() {
        empty.hidden = !!cards.length;
        cards.forEach((card, index) => {
            card.element.querySelector<HTMLButtonElement>(":scope > .entry-fields > .entry-actions > .move-up").disabled = index === 0;
            card.element.querySelector<HTMLButtonElement>(":scope > .entry-fields > .entry-actions > .move-down").disabled = index === cards.length - 1;
            card.element.querySelector(":scope > summary .entry-number").textContent = `${index + 1}.`;
            container.append(card.element);
        });
    }

    function insert(value: Publication, index: number, open: boolean) {
        let source = structuredClone(value);
        const id = `publication-${nextId++}`;
        const element = document.createElement("details");
        element.className = "publication-entry";
        element.dataset.kind = "Publication";
        element.open = open;
        element.innerHTML = `
            <summary><span class="entry-number"></span><span class="entry-label"></span><span class="entry-location"></span></summary>
            <div class="entry-fields">
                <div class="entry-actions">
                    <button type="button" class="move-up" aria-label="Move publication up">↑ Up</button>
                    <button type="button" class="move-down" aria-label="Move publication down">↓ Down</button>
                    <button type="button" class="duplicate" aria-label="Duplicate publication">Duplicate</button>
                    <button type="button" class="remove-entry" aria-label="Remove publication">Remove</button>
                </div>
                <label for="${id}-mode">Publication editor</label>
                <select id="${id}-mode" class="publication-mode"><option value="guided">Guided form</option><option value="json">Advanced JSON</option></select>
                <div class="publication-guided"></div>
                <div class="publication-json">
                    <label for="${id}-json">Publication JSON</label>
                    <textarea id="${id}-json" class="advanced-json" rows="22" spellcheck="false" wrap="off"></textarea>
                    <p class="hint">Edit the complete OPDS publication object, including multiple contributors and additional metadata. JSON must be valid before switching to the guided form or duplicating.</p>
                </div>
                <p class="hint publication-note">Fields outside the guided form are preserved. Complex values are available in Advanced JSON.</p>
                <p class="entry-error" hidden></p>
            </div>`;
        const mode = element.querySelector<HTMLSelectElement>(".publication-mode");
        mode.addEventListener("input", (event) => event.stopPropagation());
        const guided = element.querySelector<HTMLElement>(".publication-guided");
        const jsonPanel = element.querySelector<HTMLElement>(".publication-json");
        const raw = element.querySelector<HTMLTextAreaElement>(".advanced-json");
        let readGuided: () => Publication;

        function buildGuided() {
            guided.replaceChildren();
            const metadata = source.metadata || {};
            const titleContainer = document.createElement("div");
            titleContainer.className = "publication-title";
            guided.append(titleContainer);
            const readTitle = makeTextEditor(titleContainer, `${id}-title`, "Book title", metadata.title as LocalizedText || "", true, onChange);
            const fields = new Map<string, { input: HTMLInputElement | HTMLTextAreaElement; initial: string }>();
            const grid = document.createElement("div");
            grid.className = "resource-columns publication-metadata";
            for (const [key, label] of [
                ["identifier", "Book identifier"], ["author", "Author"], ["language", "Book language(s)"],
                ["publisher", "Publisher"], ["published", "Publication date"], ["modified", "Book modified"], ["description", "Book description"],
            ]) {
                const field = document.createElement("div");
                if (key === "description") field.className = "wide-field";
                field.innerHTML = `<label for="${id}-${key}">${label} <span class="optional">(optional)</span></label>
                    ${key === "description" ? `<textarea id="${id}-${key}" data-metadata="${key}" rows="3"></textarea>` : `<input id="${id}-${key}" data-metadata="${key}" type="text">`}`;
                const input = field.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
                const original = metadata[key];
                let initial = "";
                if (typeof original === "string") initial = original;
                else if (key === "language" && Array.isArray(original) && original.every((item) => typeof item === "string")) initial = original.join(", ");
                else if (["author", "publisher"].includes(key) && isObject(original) && typeof original.name === "string") initial = original.name;
                else if (original !== undefined) {
                    input.disabled = true;
                    initial = JSON.stringify(original);
                    const hint = document.createElement("p");
                    hint.className = "hint";
                    hint.textContent = "This value has additional structure. Edit it in Advanced JSON.";
                    field.append(hint);
                }
                input.value = initial;
                if (key === "language") input.placeholder = "en, fr-CA";
                if (key === "published") input.placeholder = "2026-11-25";
                if (key === "modified") input.placeholder = "2026-11-25T12:00:00Z";
                fields.set(key, { input, initial });
                grid.append(field);
            }
            guided.append(grid);
            const resources: Partial<Record<"images" | "links", ReturnType<typeof makeResourceList>>> = {};
            for (const kind of ["links", "images"] as const) {
                const prefix = `${id}-${kind}`;
                const area = document.createElement("div");
                area.className = "publication-resources";
                area.innerHTML = `<h3>${kind === "links" ? "Book files and links" : "Covers"}</h3>
                    <div class="resource-add"><div><label for="${prefix}-preset">${kind === "links" ? "Book link" : "Cover"} preset</label>
                    <select id="${prefix}-preset">${kind === "links" ? '<option value="book">Book file (EPUB)</option><option value="link">Additional link</option>' : '<option value="cover">Cover image</option>'}</select></div>
                    <button type="button" id="add-${prefix}">${kind === "links" ? "Add book link" : "Add cover"}</button></div>
                    <p id="${prefix}-empty" class="empty-list">No ${kind === "links" ? "book links" : "covers"} added.</p><div id="${prefix}-list"></div>`;
                guided.append(area);
                resources[kind] = makeResourceList(kind, onChange, area, prefix, true);
                resources[kind].load(source[kind] as Resource[]);
            }
            readGuided = () => {
                const result = structuredClone(source);
                result.metadata = structuredClone(metadata);
                result.metadata.title = readTitle();
                for (const [key, { input, initial }] of fields) {
                    if (input.disabled) continue;
                    if (key === "language") {
                        const languages = input.value.split(",").map((language) => language.trim()).filter(Boolean);
                        input.setCustomValidity(languages.some((language) => languageError(language)) ? "Use language tags separated by commas, such as en, fr-CA." : "");
                    }
                    if (input.value === initial) continue;
                    if (!input.value) delete result.metadata[key];
                    else if (["author", "publisher"].includes(key) && isObject(metadata[key])) {
                        result.metadata[key] = { ...metadata[key] as Record<string, unknown>, name: input.value };
                    } else if (key === "author") result.metadata.author = { name: input.value };
                    else if (key === "language") {
                        const languages = input.value.split(",").map((language) => language.trim()).filter(Boolean);
                        if (!languages.length) delete result.metadata.language;
                        else result.metadata.language = Array.isArray(metadata.language) || languages.length > 1 ? languages : languages[0];
                    } else result.metadata[key] = input.value;
                }
                for (const kind of ["links", "images"] as const) {
                    const value = resources[kind].read();
                    if (value !== undefined) result[kind] = value;
                    else delete result[kind];
                }
                return result;
            };
        }

        function parseRaw(): Publication | undefined {
            try {
                const value: unknown = JSON.parse(raw.value);
                raw.setCustomValidity(publicationErrors(value).join(" "));
                return isObject(value) ? value as Publication : undefined;
            } catch (error) {
                raw.setCustomValidity(`Invalid publication JSON: ${error instanceof Error ? error.message : String(error)}`);
                return undefined;
            }
        }

        function showMode() {
            guided.hidden = mode.value !== "guided";
            jsonPanel.hidden = mode.value !== "json";
            raw.disabled = mode.value !== "json";
            element.querySelector(".publication-note").textContent = canGuide(source)
                ? "Fields outside the guided form are preserved. Complex values are available in Advanced JSON."
                : "This publication uses structures the guided form cannot edit. Use Advanced JSON to preserve them.";
        }

        mode.value = canGuide(source) ? "guided" : "json";
        raw.value = JSON.stringify(source, undefined, 4);
        if (mode.value === "guided") buildGuided();
        showMode();
        mode.addEventListener("change", () => {
            if (mode.value === "json") {
                source = readGuided();
                raw.value = JSON.stringify(source, undefined, 4);
                guided.replaceChildren();
            } else {
                const parsed = parseRaw();
                if (!parsed || !canGuide(parsed)) {
                    mode.value = "json";
                    if (parsed && !canGuide(parsed)) raw.setCustomValidity("This structure requires Advanced JSON. Change unsupported fields before using the guided form.");
                    raw.reportValidity();
                } else {
                    source = parsed;
                    buildGuided();
                }
            }
            showMode();
            onChange();
        });
        const card: PublicationCard = {
            element,
            read() {
                let result: Publication;
                if (mode.value === "guided") result = readGuided();
                else {
                    const parsed = parseRaw();
                    if (parsed) source = parsed;
                    result = source;
                }
                const title = result.metadata?.title;
                const name = typeof title === "string" ? title : isText(title) ? Object.values(title)[0] : "";
                element.querySelector(":scope > summary .entry-label").textContent = name || "Untitled publication";
                element.querySelector(":scope > summary .entry-location").textContent = typeof result.metadata?.identifier === "string" ? result.metadata.identifier : "";
                return result;
            },
        };
        cards.splice(index, 0, card);
        element.querySelector(":scope > .entry-fields > .entry-actions > .duplicate").addEventListener("click", () => {
            const result = card.read();
            if (!raw.disabled && !raw.validity.valid) { raw.reportValidity(); return; }
            insert(result, cards.indexOf(card) + 1, true);
            present = true;
            onChange();
        });
        element.querySelector(":scope > .entry-fields > .entry-actions > .remove-entry").addEventListener("click", () => {
            const index = cards.indexOf(card);
            cards.splice(index, 1);
            element.remove();
            present = true;
            updateOrder();
            onChange();
            (cards[Math.min(index, cards.length - 1)]?.element.querySelector("summary") || add).focus();
        });
        for (const [selector, direction] of [[".move-up", -1], [".move-down", 1]] as const) {
            element.querySelector(`:scope > .entry-fields > .entry-actions > ${selector}`).addEventListener("click", () => {
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
        insert({ metadata: { "@type": "http://schema.org/Book", title: "" }, links: [{
            rel: "http://opds-spec.org/acquisition/open-access", href: "", type: "application/epub+zip",
        }] }, cards.length, true);
        present = true;
        onChange();
        const element = cards[cards.length - 1].element;
        element.querySelector<HTMLDetailsElement>(".resource-entry").open = true;
        element.querySelector<HTMLTextAreaElement>(".publication-title .plain textarea").focus();
    });
    return {
        load(publications: Publication[] | undefined) {
            cards = [];
            container.replaceChildren();
            present = publications !== undefined;
            for (const publication of publications || []) insert(publication, cards.length, false);
            updateOrder();
        },
        read() { return present ? cards.map((card) => card.read()) : undefined; },
    };
}
