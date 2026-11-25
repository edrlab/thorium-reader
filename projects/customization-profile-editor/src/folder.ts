import { resourcePath } from "#profile-editor/paths";

export function makeFolderCheck(onChange: () => void) {
    const picker = document.querySelector<HTMLInputElement>("#folder-files");
    const choose = document.getElementById("choose-folder");
    const clear = document.querySelector<HTMLButtonElement>("#clear-folder");
    const summary = document.getElementById("folder-status");
    const list = document.getElementById("file-checklist");
    const note = document.getElementById("folder-draft-note");
    let selected: Set<string> | undefined;
    let folderName = "";

    choose.addEventListener("click", () => picker.click());
    picker.addEventListener("input", (event) => event.stopPropagation());
    picker.addEventListener("change", () => {
        const files = Array.from(picker.files || []);
        if (!files.length) return;
        selected = new Set<string>();
        for (const file of files) {
            const relative = file.webkitRelativePath;
            const slash = relative.indexOf("/");
            if (slash < 0) continue;
            folderName = relative.slice(0, slash);
            selected.add(relative.slice(slash + 1));
        }
        picker.value = "";
        onChange();
    });
    clear.addEventListener("click", () => {
        selected = undefined;
        folderName = "";
        picker.value = "";
        onChange();
    });
    return {
        reset() {
            selected = undefined;
            folderName = "";
            picker.value = "";
        },
        update(manifest: Record<string, unknown>, draftHasErrors: boolean) {
            const local = new Map<string, string[]>();
            const invalid: string[] = [];
            let remote = 0;
            const groups: Array<[string, unknown]> = [["Images", manifest.images], ["Links", manifest.links]];
            if (Array.isArray(manifest.publications)) {
                manifest.publications.forEach((publication, index) => {
                    if (!publication || typeof publication !== "object") return;
                    const value = publication as Record<string, unknown>;
                    groups.push([`Publication ${index + 1} covers`, value.images], [`Publication ${index + 1} links`, value.links]);
                });
            }
            for (const [label, resources] of groups) {
                if (resources === undefined) continue;
                if (!Array.isArray(resources)) {
                    invalid.push(`${label}: resources must be an array.`);
                    continue;
                }
                resources.forEach((resource, index) => {
                    const location = resourcePath(resource && typeof resource === "object" ? resource.href : undefined);
                    const source = `${label} ${index + 1}`;
                    if (location.kind === "invalid") invalid.push(`${source}: ${location.error}`);
                    else if (location.kind === "remote") remote++;
                    else {
                        if (!local.has(location.path)) local.set(location.path, []);
                        local.get(location.path).push(source);
                    }
                });
            }
            list.replaceChildren();
            let found = 0;
            for (const [path, sources] of local) {
                const item = document.createElement("li");
                const status = document.createElement("span");
                const file = document.createElement("code");
                const source = document.createElement("small");
                const exists = selected?.has(path);
                if (exists) found++;
                item.className = selected ? exists ? "file-found" : "file-missing" : "file-unchecked";
                status.className = "file-status";
                status.textContent = selected ? exists ? "Found" : "Missing" : "Not checked";
                file.textContent = path;
                source.textContent = sources.join(" · ");
                if (selected && !exists) {
                    const caseMatch = [...selected].find((candidate) => candidate.toLowerCase() === path.toLowerCase());
                    if (caseMatch) source.textContent += ` · Case differs: ${caseMatch}`;
                }
                item.append(status, file, source);
                list.append(item);
            }
            for (const error of invalid) {
                const item = document.createElement("li");
                item.className = "file-missing";
                item.textContent = error;
                list.append(item);
            }
            clear.disabled = selected === undefined;
            summary.textContent = (selected ? `${folderName}: ${found} of ${local.size} referenced local files found.`
                : `${local.size} referenced local files. Select the profile folder to check them.`)
                + ` ${remote} remote or fragment references are not checked.`
                + (invalid.length ? ` ${invalid.length} invalid resource references.` : "");
            note.hidden = !draftHasErrors;
        },
    };
}
