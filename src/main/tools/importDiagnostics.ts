// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

const MAX_LENGTH = 24000;
const MAX_DEPTH = 6;

function read(value: object, key: string): unknown {
    try {
        return Reflect.get(value, key);
    } catch {
        return undefined;
    }
}

function sourceText(value: string): string {
    if (!value.includes("://")) return value;
    try {
        const url = new URL(value);
        url.username = "";
        url.password = "";
        return url.toString();
    } catch {
        return "[invalid URL]";
    }
}

// Only strings cross IPC. Do not serialize response bodies, headers, or arbitrary objects.
export function formatImportDiagnostics(message: string, error: unknown, source?: string): string {
    const lines = [message];
    if (source) lines.push(`Source: ${sourceText(source)}`);
    const seen = new Set<object>();
    let current = error;
    for (let depth = 0; current !== undefined && depth < MAX_DEPTH; depth++) {
        if (current && typeof current === "object") {
            if (seen.has(current)) {
                lines.push("[circular cause omitted]");
                current = undefined;
                break;
            }
            seen.add(current);
            const reason = read(current, "reason");
            if (typeof reason === "string" && ["network", "http", "timeout", "integrity", "storage",
                "unsupportedFormat", "invalidPublication", "invalidLicense"].includes(reason)) {
                lines.push(`Category: ${reason}`);
                const downloadSource = read(current, "source");
                if (typeof downloadSource === "string") lines.push(`Download source: ${sourceText(downloadSource)}`);
            }
            const stack = read(current, "stack");
            const detail = read(current, "message");
            const name = read(current, "name");
            if (typeof stack === "string") lines.push(stack.slice(0, MAX_LENGTH));
            else if (typeof detail === "string") lines.push(`${typeof name === "string" ? name.slice(0, 200) : "Error"}: ${detail.slice(0, MAX_LENGTH)}`);
            else {
                const value = read(current, "responseUrl") ?? read(current, "url");
                const url = typeof value === "string" ? value : value instanceof URL ? read(value, "href") : undefined;
                if (typeof url === "string") lines.push(`URL: ${sourceText(url)}`);
                const status = read(current, "statusCode");
                if (typeof status === "number") lines.push(`HTTP status: ${status}`);
                if (status === undefined && url === undefined) lines.push("[non-Error details omitted]");
            }
            current = read(current, "cause");
        } else {
            lines.push(typeof current === "string" ? current.slice(0, MAX_LENGTH) : "[non-Error details omitted]");
            current = undefined;
        }
        if (current !== undefined) lines.push("Caused by:");
    }
    if (current !== undefined) lines.push("[cause depth limit reached]");
    const text = lines.join("\n\n");
    return text.length >= MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 24)}\n[diagnostics truncated]` : text;
}
