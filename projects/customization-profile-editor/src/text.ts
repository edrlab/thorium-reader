export type LocalizedText = string | Record<string, string>;

export function languageError(value: string): string {
    return !value || /^(?:[a-z]{2,8}(?:-[a-z0-9]{1,8})*|[ix](?:-[a-z0-9]{1,8})+)$/i.test(value)
        ? "" : "Use a language tag such as en, fr, or fr-CA, with hyphens and no spaces.";
}

export function makeTextEditor(
    container: HTMLElement, field: string, label: string, value: LocalizedText | undefined,
    required: boolean, onChange: () => void,
): () => LocalizedText | undefined {
    container.innerHTML = `
        <div class="field-heading"><h3>${label}</h3>
            <label for="${field}-format">Format</label>
            <select id="${field}-format" aria-label="${label} format">
                ${required ? "" : '<option value="none">None</option>'}
                <option value="plain">Plain text</option><option value="translations">Translations</option>
            </select>
        </div>
        <div class="plain"><label class="visually-hidden" for="${field}">${label}</label>
            <textarea id="${field}" ${required ? "required" : ""} rows="${field === "description" ? 3 : 2}"></textarea>
        </div>
        <div class="translations"><div class="rows"></div>
            <button type="button" class="add-language">Add language</button>
        </div>`;
    const mode = container.querySelector<HTMLSelectElement>("select");
    const plain = container.querySelector<HTMLTextAreaElement>(".plain textarea");
    const translations = container.querySelector<HTMLElement>(".translations");
    const rows = container.querySelector<HTMLElement>(".rows");
    let rowId = 0;
    plain.value = typeof value === "string" ? value : Object.values(value || {})[0] || "";

    function addTranslation(language: string, text: string) {
        const row = document.createElement("div");
        const id = `${field}-translation-${rowId++}`;
        row.className = "translation";
        row.innerHTML = `
            <div><label for="${id}-language">Language</label><input id="${id}-language" class="language" type="text" placeholder="en" required spellcheck="false" aria-label="${label} language"></div>
            <div><label for="${id}-text">${label}</label><textarea id="${id}-text" required rows="2"></textarea></div>
            <button type="button" class="remove" aria-label="Remove ${label.toLowerCase()} translation">×</button>`;
        row.querySelector<HTMLInputElement>("input").value = language;
        row.querySelector<HTMLTextAreaElement>("textarea").value = text;
        row.querySelector("button").addEventListener("click", () => {
            row.remove();
            if (!rows.children.length) addTranslation("", "");
            onChange();
            rows.querySelector<HTMLInputElement>("input").focus();
        });
        rows.append(row);
    }

    for (const [language, text] of Object.entries(typeof value === "string" ? { en: value } : value || {})) {
        addTranslation(language, text);
    }
    if (!rows.children.length) addTranslation("en", "");
    mode.value = value === undefined ? "none" : typeof value === "string" ? "plain" : "translations";
    const switchMode = () => {
        const localized = mode.value === "translations";
        plain.parentElement.hidden = mode.value !== "plain";
        plain.disabled = mode.value !== "plain";
        translations.hidden = !localized;
        for (const input of rows.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")) {
            input.disabled = !localized;
        }
    };
    switchMode();
    let previousMode = mode.value;
    mode.addEventListener("change", () => {
        if (mode.value === "translations" && previousMode === "plain") {
            rows.querySelector<HTMLTextAreaElement>("textarea").value = plain.value;
        } else if (mode.value === "plain" && previousMode === "translations") {
            plain.value = rows.querySelector<HTMLTextAreaElement>("textarea").value;
        }
        previousMode = mode.value;
        switchMode();
        onChange();
    });
    container.querySelector(".add-language").addEventListener("click", () => {
        addTranslation("", "");
        onChange();
        rows.lastElementChild.querySelector<HTMLInputElement>("input").focus();
    });
    return () => {
        if (mode.value === "none") return undefined;
        if (mode.value === "plain") return plain.value;
        const entries: Array<[string, string]> = [];
        const seen = new Set<string>();
        for (const row of rows.children) {
            const language = row.querySelector<HTMLInputElement>("input");
            const key = language.value.trim();
            language.setCustomValidity(seen.has(key.toLowerCase())
                ? "Each language must be unique within this field." : languageError(key));
            seen.add(key.toLowerCase());
            entries.push([key, row.querySelector<HTMLTextAreaElement>("textarea").value]);
        }
        return Object.fromEntries(entries);
    };
}
