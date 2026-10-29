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
        if (current && typeof current === "object") {
            if (seen.has(current)) {
                lines.push(translate("message.diagnostics.circularCause"));
                current = undefined;
                break;
            }
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
            if (typeof stack === "string") lines.push(stack.slice(0, MAX_LENGTH));
            else if (typeof detail === "string") lines.push(`${typeof name === "string" ? name.slice(0, 200) : translate("message.diagnostics.error")}: ${detail.slice(0, MAX_LENGTH)}`);
            else {
                const value = read(current, "responseUrl") ?? read(current, "url");
                const url = typeof value === "string" ? value : value instanceof URL ? read(value, "href") : undefined;
                if (typeof url === "string") lines.push(translate("message.diagnostics.url", { url: sourceText(url) }));
                const status = read(current, "statusCode");
                if (typeof status === "number") lines.push(translate("message.diagnostics.httpStatus", { status }));
                if (status === undefined && url === undefined) lines.push(translate("message.diagnostics.nonErrorDetails"));
            }
            current = read(current, "cause");
        } else {
            lines.push(typeof current === "string" ? current.slice(0, MAX_LENGTH) : translate("message.diagnostics.nonErrorDetails"));
            current = undefined;
        }
        if (current !== undefined) lines.push(translate("message.diagnostics.causedBy"));
    }
    if (current !== undefined) lines.push(translate("message.diagnostics.causeDepthLimit"));
    const text = lines.join("\n\n");
    if (text.length <= MAX_LENGTH) return text;
    const suffix = `\n${translate("message.diagnostics.truncated")}`.slice(0, MAX_LENGTH);
    return text.slice(0, MAX_LENGTH - suffix.length) + suffix;
}
