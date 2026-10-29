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

function redact(value: string): string {
    return value.slice(0, MAX_LENGTH)
        .replace(/(LCP license malformed:)[^\r\n]*/g, "$1 [license data omitted]")
        .replace(/\b(?:https?|thoriumhttps|ftp|file):\/\/[^\s<>"']+/gi, (text) => {
            try {
                const url = new URL(text);
                url.username = "";
                url.password = "";
                for (const key of [...url.searchParams.keys()]) {
                    if (/^(?:access[_-]?token|refresh[_-]?token|id[_-]?token|token|api[_-]?key|key|secret|password|authorization|auth|signature|sig|client_secret|code)$/i.test(key)) {
                        url.searchParams.set(key, "[redacted]");
                    }
                }
                return url.toString();
            } catch {
                return "[invalid URL omitted]";
            }
        })
        .replace(/(authorization\s*[:=]\s*)(?:bearer\s+)?[^\s,;]+/gi, "$1[redacted]");
}

// Only strings cross IPC. Do not serialize response bodies, headers, or arbitrary objects.
export function formatImportDiagnostics(message: string, error: unknown, source?: string): string {
    const lines = [message];
    if (source) lines.push(`Source: ${source}`);
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
                if (typeof downloadSource === "string") lines.push(`Download source: ${downloadSource}`);
            }
            const stack = read(current, "stack");
            const detail = read(current, "message");
            const name = read(current, "name");
            if (typeof stack === "string") lines.push(stack.slice(0, MAX_LENGTH));
            else if (typeof detail === "string") lines.push(`${typeof name === "string" ? name.slice(0, 200) : "Error"}: ${detail.slice(0, MAX_LENGTH)}`);
            else {
                for (const key of ["url", "responseUrl"]) {
                    const value = read(current, key);
                    const url = typeof value === "string" ? value : value instanceof URL ? read(value, "href") : undefined;
                    if (typeof url === "string") lines.push(`${key === "url" ? "Request URL" : "Response URL"}: ${url}`);
                }
                const status = read(current, "statusCode");
                const statusMessage = read(current, "statusMessage");
                if (typeof status === "number") lines.push(`HTTP status: ${status}`);
                if (typeof statusMessage === "string") lines.push(statusMessage.slice(0, MAX_LENGTH));
                if (status === undefined && statusMessage === undefined) lines.push("[non-Error details omitted]");
            }
            current = read(current, "cause");
        } else {
            lines.push(typeof current === "string" ? current.slice(0, MAX_LENGTH) : "[non-Error details omitted]");
            current = undefined;
        }
        if (current !== undefined) lines.push("Caused by:");
    }
    if (current !== undefined) lines.push("[cause depth limit reached]");
    const text = redact(lines.join("\n\n"));
    return text.length >= MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 24)}\n[diagnostics truncated]` : text;
}
