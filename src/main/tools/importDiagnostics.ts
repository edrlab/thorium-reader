// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { getTranslator } from "readium-desktop/common/services/translator";

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
        return getTranslator().translate("message.diagnostics.invalidUrl");
    }
}

// Only strings cross IPC. Do not serialize response bodies, headers, or arbitrary objects.
export function formatImportDiagnostics(message: string, error: unknown, source?: string): string {
    const translate = getTranslator().translate;
    const lines = [message];
    if (source) lines.push(translate("message.diagnostics.source", { source: sourceText(source) }));
    const seen = new Set<object>();
    let current = error;
    for (let depth = 0; current !== undefined && depth < MAX_DEPTH; depth++) {
        const detailStart = lines.length;
        if (current && typeof current === "object") {
            if (seen.has(current)) break;
            seen.add(current);
            const reason = read(current, "reason");
            if (typeof reason === "string" && ["network", "http", "timeout", "integrity", "storage",
                "unsupportedFormat", "invalidPublication", "invalidLicense"].includes(reason)) {
                lines.push(translate("message.diagnostics.category", { category: reason }));
                const downloadSource = read(current, "source");
                if (typeof downloadSource === "string") lines.push(translate("message.diagnostics.downloadSource", { source: sourceText(downloadSource) }));
            }
            const stack = read(current, "stack");
            const detail = read(current, "message");
            const name = read(current, "name");
            if (typeof stack === "string" && stack.length) lines.push(stack.slice(0, MAX_LENGTH));
            else if (typeof detail === "string" && detail.length) lines.push(`${typeof name === "string" ? name.slice(0, 200) : translate("message.diagnostics.error")}: ${detail.slice(0, MAX_LENGTH)}`);
            else {
                const value = read(current, "responseUrl") ?? read(current, "url");
                const url = typeof value === "string" ? value : value instanceof URL ? read(value, "href") : undefined;
                if (typeof url === "string") lines.push(translate("message.diagnostics.url", { url: sourceText(url) }));
                const status = read(current, "statusCode");
                if (typeof status === "number") lines.push(translate("message.diagnostics.httpStatus", { status }));
            }
            current = read(current, "cause");
        } else {
            if (typeof current === "string" && current.length) lines.push(current.slice(0, MAX_LENGTH));
            current = undefined;
        }
        if (depth > 0 && lines.length > detailStart) lines.splice(detailStart, 0, translate("message.diagnostics.causedBy"));
    }
    return lines.join("\n\n").slice(0, MAX_LENGTH);
}
