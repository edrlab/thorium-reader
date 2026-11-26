import validate from "#profile-editor/validator";
import { checkResourceShapes, makeResourceList } from "#profile-editor/resources";
import type { Resource } from "#profile-editor/resources";
import { makeTextEditor } from "#profile-editor/text";
import type { LocalizedText } from "#profile-editor/text";
import { makePublicationList } from "#profile-editor/publications";
import type { Publication } from "#profile-editor/publications";
import { makeFolderCheck } from "#profile-editor/folder";

type Colors = Record<string, string>;
interface Manifest extends Record<string, unknown> {
    version: number;
    identifier: string;
    title: LocalizedText;
    description: LocalizedText;
    created: string;
    modified?: string;
    images?: Resource[];
    links?: Resource[];
    publications?: Publication[];
    theme: { color: { light: Colors; dark: Colors; [key: string]: unknown }; [key: string]: unknown };
}

const defaults = {
    light: {
        neutral: "#FFFFFF", primary: "#202020", secondary: "#E8EEE9", border: "#B8C6BE",
        background: "#F4F7F5", appName: "#255C50", scrollbarThumb: "#7F9689", buttonsBorder: "#526E5F",
    },
    dark: {
        neutral: "#252B28", primary: "#F0F4F1", secondary: "#36483E", border: "#607568",
        background: "#191F1C", appName: "#BED9C8", scrollbarThumb: "#7E9B8A", buttonsBorder: "#91AF9E",
    },
};
const colorLabels: Record<string, string> = {
    neutral: "Neutral", primary: "Primary", secondary: "Secondary", border: "Border",
    background: "Background", appName: "App name", scrollbarThumb: "Scrollbar thumb", buttonsBorder: "Button borders",
};
const form = document.querySelector<HTMLFormElement>("#editor");
const identifier = document.querySelector<HTMLInputElement>("#identifier");
const created = document.querySelector<HTMLInputElement>("#created");
const modified = document.querySelector<HTMLInputElement>("#modified");
const fileInput = document.querySelector<HTMLInputElement>("#file");
const notice = document.querySelector<HTMLElement>("#notice");
const errorsPanel = document.querySelector<HTMLElement>("#errors");
const validation = document.querySelector<HTMLElement>("#validation");
const json = document.querySelector<HTMLTextAreaElement>("#json");
const themeInputs = new Map<string, HTMLInputElement>();
const previews = new Map<string, HTMLElement>();
let original: Manifest;
let textEditors: Record<string, () => LocalizedText>;
let dirty = false;
let showValidation = false;
let importRequest = 0;
const resourceLists = {
    images: makeResourceList("images", () => refresh(true)),
    links: makeResourceList("links", () => refresh(true)),
};
const publications = makePublicationList(() => refresh(true));
const folderCheck = makeFolderCheck(() => refresh());

for (const mode of ["light", "dark"] as const) {
    const theme = document.createElement("fieldset");
    theme.className = "theme";
    theme.innerHTML = `<legend>${mode === "light" ? "Light" : "Dark"} theme</legend>`;
    for (const [key, label] of Object.entries(colorLabels)) {
        const row = document.createElement("div");
        const id = `${mode}-${key}`;
        row.className = "color-row";
        row.innerHTML = `<label for="${id}">${label}</label><div class="color-controls">
            <input type="color" aria-label="${mode} ${label.toLowerCase()} picker">
            <input id="${id}" type="text" required spellcheck="false" aria-label="${mode} ${label.toLowerCase()}">
        </div>`;
        const text = row.querySelector<HTMLInputElement>("input[type=text]");
        const picker = row.querySelector<HTMLInputElement>("input[type=color]");
        themeInputs.set(id, text);
        picker.addEventListener("input", () => { text.value = picker.value; });
        theme.append(row);
    }
    const preview = document.createElement("div");
    preview.className = "theme-preview";
    preview.setAttribute("aria-label", `${mode} theme preview`);
    preview.innerHTML = `<div class="preview-header">THORIUM</div><div class="preview-content">
        <div class="preview-book" aria-hidden="true"></div><div class="preview-copy">
            <div class="preview-title">Your profile</div><span class="preview-action">Open book</span>
        </div><div class="preview-scrollbar" aria-hidden="true"></div></div>`;
    previews.set(mode, preview);
    theme.append(preview);
    document.getElementById("themes").append(theme);
}

function showErrors(errors: string[]) {
    errorsPanel.replaceChildren();
    errorsPanel.hidden = !errors.length;
    if (!errors.length) return;
    const heading = document.createElement("strong");
    heading.textContent = "Please check the manifest";
    const list = document.createElement("ul");
    for (const error of errors) {
        const item = document.createElement("li");
        item.textContent = error;
        list.append(item);
    }
    errorsPanel.append(heading, list);
}

function refresh(edited = false) {
    if (edited) {
        dirty = true;
        notice.textContent = "Unsaved changes. Download manifest.json to keep your work.";
    }
    for (const input of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")) {
        input.setCustomValidity("");
    }
    const manifest = structuredClone(original);
    manifest.identifier = identifier.value;
    manifest.title = textEditors.title();
    manifest.description = textEditors.description();
    manifest.created = created.value;
    if (modified.value) manifest.modified = modified.value;
    else delete manifest.modified;
    delete manifest.signature;
    delete manifest.contentHash;
    for (const kind of ["images", "links"] as const) {
        const resources = resourceLists[kind].read();
        if (resources !== undefined) manifest[kind] = resources;
        else delete manifest[kind];
    }
    const books = publications.read();
    if (books !== undefined) manifest.publications = books;
    else delete manifest.publications;

    for (const mode of ["light", "dark"] as const) {
        const preview = previews.get(mode);
        for (const key of Object.keys(colorLabels)) {
            const input = themeInputs.get(`${mode}-${key}`);
            const color = input.value;
            const valid = CSS.supports("color", color);
            input.setCustomValidity(valid ? "" : "Enter a valid CSS color.");
            manifest.theme.color[mode][key] = color;
            preview.style.setProperty(`--${key}`, valid ? color : defaults[mode][key as keyof typeof defaults.light]);
            const picker = input.previousElementSibling as HTMLInputElement;
            picker.value = /^#[\da-f]{6}$/i.test(color) ? color : "#808080";
            picker.title = `Choose a hex color to replace ${color}`;
        }
        preview.querySelector(".preview-title").textContent =
            (typeof manifest.title === "string" ? manifest.title : Object.values(manifest.title)[0]) || "Your profile";
    }
    const errors: string[] = [];
    if (!validate(manifest)) {
        for (const error of validate.errors || []) {
            errors.push(`${error.instancePath || "Manifest"} ${error.message}`);
        }
    }
    const entryErrors = new Map<HTMLDetailsElement, string[]>();
    for (const input of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")) {
        if (input.disabled) {
            input.removeAttribute("aria-invalid");
            continue;
        }
        if (input.required && !input.value.trim() && !input.validity.customError) {
            input.setCustomValidity("Enter a value.");
        }
        if (!input.validity.valid) {
            const label = input.getAttribute("aria-label") || input.labels?.[0]?.textContent || input.id;
            const entry = input.closest<HTMLDetailsElement>(".resource-entry, .publication-entry");
            const message = `${label}: ${input.validationMessage}`;
            const parent = entry?.parentElement.closest<HTMLDetailsElement>(".publication-entry");
            const location = entry ? `${parent ? `Publication ${parent.querySelector(":scope > summary .entry-number").textContent} · ` : ""}${entry.dataset.kind} ${entry.querySelector(":scope > summary .entry-number").textContent} ` : "";
            errors.push(`${location}${message}`);
            if (entry) {
                if (!entryErrors.has(entry)) entryErrors.set(entry, []);
                entryErrors.get(entry).push(message);
                if (showValidation) entry.open = true;
                if (showValidation && parent) parent.open = true;
            }
        }
        if (showValidation && !input.validity.valid) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
    }
    for (const entry of form.querySelectorAll<HTMLDetailsElement>(".resource-entry, .publication-entry")) {
        const error = entry.querySelector<HTMLElement>(":scope > .entry-fields > .entry-error");
        error.hidden = !showValidation || !entryErrors.has(entry);
        error.textContent = (entryErrors.get(entry) || []).join(" ");
    }
    json.value = JSON.stringify(manifest, undefined, 4) + "\n";
    folderCheck.update(manifest, errors.length > 0);
    validation.textContent = errors.length ? "Draft · Complete the required fields to export." : "Valid manifest · Ready to export.";
    validation.className = errors.length ? "" : "valid";
    if (showValidation) showErrors(errors);
    return { manifest, errors };
}

function load(manifest: Manifest) {
    original = structuredClone(manifest);
    identifier.value = manifest.identifier;
    created.value = manifest.created;
    modified.value = manifest.modified || "";
    textEditors = {
        title: makeTextEditor(document.getElementById("title-field"), "title", "Title", manifest.title, true, () => refresh(true)),
        description: makeTextEditor(document.getElementById("description-field"), "description", "Description", manifest.description, true, () => refresh(true)),
    };
    for (const kind of ["images", "links"] as const) {
        resourceLists[kind].load(manifest[kind]);
    }
    publications.load(manifest.publications);
    folderCheck.reset();
    for (const mode of ["light", "dark"] as const) {
        for (const key of Object.keys(colorLabels)) themeInputs.get(`${mode}-${key}`).value = manifest.theme.color[mode][key];
    }
    for (const input of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")) {
        input.setCustomValidity("");
    }
    showValidation = false;
    dirty = false;
    showErrors([]);
    const extras = Object.keys(manifest).filter((key) => ![
        "version", "identifier", "title", "description", "created", "modified", "theme", "signature", "contentHash", "images", "links", "publications",
    ].includes(key));
    document.getElementById("preserved").textContent = extras.length
        ? `Preserved additional fields: ${extras.join(", ")}. Resources stay in your profile folder.`
        : "Imported additional fields are preserved. Resources stay in your profile folder.";
    refresh();
}

function newManifest() {
    load({
        version: 1, identifier: "", title: "", description: "", created: new Date().toISOString(),
        theme: { color: structuredClone(defaults) },
    });
    notice.textContent = "Everything stays in this browser. Export your work before closing this page.";
}

form.addEventListener("input", () => refresh(true));
form.addEventListener("submit", (event) => {
    event.preventDefault();
    showValidation = true;
    const { errors } = refresh();
    if (errors.length) {
        errorsPanel.focus();
        return;
    }
    const url = URL.createObjectURL(new Blob([json.value], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "manifest.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dirty = false;
    notice.textContent = "Manifest downloaded. Save it in your profile folder before packing.";
});
document.getElementById("new").addEventListener("click", () => {
    if (dirty && !confirm("Discard unsaved changes and start a new manifest?")) return;
    importRequest++;
    newManifest();
    identifier.focus();
});
document.getElementById("import").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const request = ++importRequest;
    fileInput.value = "";
    try {
        const manifest: unknown = JSON.parse((await file.text()).replace(/^\uFEFF/, ""));
        if (request !== importRequest) return;
        if (!validate(manifest)) {
            throw new Error((validate.errors || []).map((error) => `${error.instancePath || "Manifest"} ${error.message}`).join("; "));
        }
        if (manifest.version !== 1) throw new Error("Unsupported manifest version: expected 1.");
        checkResourceShapes(manifest);
        if (dirty && !confirm("Replace your unsaved changes with the imported manifest?")) return;
        load(manifest as Manifest);
        notice.textContent = `Imported ${file.name}. Signature and content hash will be regenerated when packing.`;
    } catch (error) {
        if (request !== importRequest) return;
        showValidation = true;
        showErrors([`Import failed: ${error instanceof Error ? error.message : String(error)}`]);
        errorsPanel.focus();
    }
});
window.addEventListener("beforeunload", (event) => {
    if (dirty) event.preventDefault();
});
newManifest();
