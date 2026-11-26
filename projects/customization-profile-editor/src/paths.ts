export function resourcePath(value: unknown): { kind: "local" | "remote" | "invalid"; path?: string; error?: string } {
    if (typeof value !== "string" || !value.trim()) return { kind: "invalid", error: "Enter a resource path or URL." };
    if (value.includes("\\") || value.includes("\0") || /^[a-z]:/i.test(value)) {
        return { kind: "invalid", error: "Use a relative path with forward slashes, such as images/logo.svg." };
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//") || value.startsWith("#")) return { kind: "remote" };
    const parts: string[] = [];
    for (const part of value.split("/")) {
        if (!part || part === ".") continue;
        if (part === ".." && parts.length && parts[parts.length - 1] !== "..") parts.pop();
        else parts.push(part);
    }
    let normalized = parts.join("/") || ".";
    if (value.endsWith("/")) normalized += "/";
    if (value.startsWith("/") || normalized === "." || normalized === ".." || normalized.startsWith("../") || normalized === "manifest.json") {
        return { kind: "invalid", error: "Use a file inside the profile folder, other than manifest.json." };
    }
    return { kind: "local", path: normalized };
}
