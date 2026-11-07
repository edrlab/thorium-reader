// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type {
    IVoiceLinkCapabilities,
    IVoiceLinkSnapshot,
} from "readium-desktop/common/ipc/ttsLookAhead";

const VOICE_LINK_ORIGIN = "http://127.0.0.1:7860" as const;
const DEFAULT_TIMEOUT_MS = 750;
const HARD_MAX_UNITS = 12;
const HARD_MAX_CHARACTERS = 12_000;
const HARD_MAX_UNIT_CHARACTERS = 4_000;
const HARD_MAX_BODY_BYTES = 65_536;
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type VoiceLinkOperation = "capabilities" | "put" | "delete";

export interface VoiceLinkDiagnostic {
    operation: VoiceLinkOperation;
    reason: string;
    status?: number;
}

export interface VoiceLinkClientOptions {
    origin?: typeof VOICE_LINK_ORIGIN;
    fetch?: typeof fetch;
    timeoutMs?: number;
    diagnostic?: (diagnostic: VoiceLinkDiagnostic) => void;
}

type PutResult = "accepted" | "disabled" | "transient-error";

interface ICapabilityRequestResult {
    body?: unknown;
    malformed?: boolean;
    response: Response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveSafeInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function parseCapabilities(value: unknown): IVoiceLinkCapabilities | undefined {
    if (!isRecord(value) || !isRecord(value.lookahead)) {
        return undefined;
    }

    const lookahead = value.lookahead;
    if (
        !Array.isArray(lookahead.protocols) ||
        !lookahead.protocols.every((protocol) => Number.isSafeInteger(protocol)) ||
        !lookahead.protocols.includes(1) ||
        !isPositiveSafeInteger(lookahead.maxUnits) ||
        !isPositiveSafeInteger(lookahead.maxCharacters) ||
        !isPositiveSafeInteger(lookahead.maxUnitCharacters) ||
        !isPositiveSafeInteger(lookahead.maxBodyBytes)
    ) {
        return undefined;
    }

    return {
        maxBodyBytes: lookahead.maxBodyBytes,
        maxCharacters: lookahead.maxCharacters,
        maxUnitCharacters: lookahead.maxUnitCharacters,
        maxUnits: lookahead.maxUnits,
        protocols: [...lookahead.protocols],
    };
}

function freezeCapabilities(capabilities: IVoiceLinkCapabilities): IVoiceLinkCapabilities {
    return Object.freeze({
        ...capabilities,
        protocols: Object.freeze([...capabilities.protocols]) as number[],
    });
}

function cloneCapabilities(capabilities: IVoiceLinkCapabilities): IVoiceLinkCapabilities {
    return {
        ...capabilities,
        protocols: [...capabilities.protocols],
    };
}

function createBody(
    snapshot: IVoiceLinkSnapshot,
    capabilities: IVoiceLinkCapabilities,
): string | undefined {
    const maxUnits = Math.min(capabilities.maxUnits, HARD_MAX_UNITS);
    const maxCharacters = Math.min(capabilities.maxCharacters, HARD_MAX_CHARACTERS);
    const maxUnitCharacters = Math.min(
        capabilities.maxUnitCharacters,
        HARD_MAX_UNIT_CHARACTERS,
    );
    const maxBodyBytes = Math.min(capabilities.maxBodyBytes, HARD_MAX_BODY_BYTES);
    const units: IVoiceLinkSnapshot["units"] = [];
    let characters = 0;
    let body: string | undefined;

    for (const unit of snapshot.units.slice(0, maxUnits)) {
        const unitCharacters = Array.from(unit.text).length;
        if (
            unitCharacters > maxUnitCharacters ||
            characters + unitCharacters > maxCharacters
        ) {
            break;
        }

        const candidateUnits = [...units, unit];
        const candidateBody = JSON.stringify({ ...snapshot, units: candidateUnits });
        if (Buffer.byteLength(candidateBody, "utf8") > maxBodyBytes) {
            break;
        }

        units.push(unit);
        characters += unitCharacters;
        body = candidateBody;
    }

    return body;
}

export class VoiceLinkClient {
    private readonly diagnostic?: (diagnostic: VoiceLinkDiagnostic) => void;
    private readonly fetch: typeof fetch;
    private readonly origin: typeof VOICE_LINK_ORIGIN;
    private readonly timeoutMs: number;
    private cachedCapabilities?: IVoiceLinkCapabilities;
    private capabilityProbe?: Promise<IVoiceLinkCapabilities | undefined>;
    private disabled = false;

    public constructor(options: VoiceLinkClientOptions = {}) {
        const origin = options.origin ?? VOICE_LINK_ORIGIN;
        if (origin !== VOICE_LINK_ORIGIN) {
            throw new TypeError("VoiceLink origin must use the fixed loopback endpoint");
        }

        this.origin = origin;
        this.fetch = options.fetch ?? globalThis.fetch;
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.diagnostic = options.diagnostic;
    }

    public async capabilities(): Promise<IVoiceLinkCapabilities | undefined> {
        const capabilities = await this.getCapabilities();
        return capabilities ? cloneCapabilities(capabilities) : undefined;
    }

    public async putSnapshot(streamId: string, snapshot: IVoiceLinkSnapshot): Promise<PutResult> {
        if (!CANONICAL_UUID.test(streamId)) {
            this.emit({ operation: "put", reason: "invalid-stream-id" });
            return "disabled";
        }

        const capabilities = await this.getCapabilities();
        if (!capabilities) {
            return "disabled";
        }

        let body: string | undefined;
        try {
            body = createBody(snapshot, capabilities);
        } catch (_error) {
            this.emit({ operation: "put", reason: "invalid-snapshot" });
            return "disabled";
        }
        if (!body) {
            this.emit({ operation: "put", reason: "limits-exceeded" });
            return "disabled";
        }

        const response = await this.request(
            "put",
            `${this.origin}/v1/tts/lookahead/${streamId}`,
            {
                body,
                headers: { "Content-Type": "application/json" },
                method: "PUT",
            },
            (value) => value,
        );
        if (!response) {
            return "transient-error";
        }
        if (response.status >= 200 && response.status < 300) {
            return "accepted";
        }
        if (response.status >= 400 && response.status < 500) {
            this.emit({ operation: "put", reason: "client-error", status: response.status });
            return "disabled";
        }

        this.emit({
            operation: "put",
            reason: response.status >= 500 ? "server-error" : "unexpected-status",
            status: response.status,
        });
        return "transient-error";
    }

    public async deleteStream(streamId: string): Promise<void> {
        if (!CANONICAL_UUID.test(streamId)) {
            this.emit({ operation: "delete", reason: "invalid-stream-id" });
            return;
        }

        const response = await this.request(
            "delete",
            `${this.origin}/v1/tts/lookahead/${streamId}`,
            { method: "DELETE" },
            (value) => value,
        );
        if (response && !response.ok) {
            this.emit({ operation: "delete", reason: "http-error", status: response.status });
        }
    }

    private getCapabilities(): Promise<IVoiceLinkCapabilities | undefined> {
        if (this.disabled) {
            return Promise.resolve(undefined);
        }
        if (this.cachedCapabilities) {
            return Promise.resolve(this.cachedCapabilities);
        }
        if (this.capabilityProbe === undefined) {
            this.capabilityProbe = this.probeCapabilities().finally(() => {
                this.capabilityProbe = undefined;
            });
        }
        return this.capabilityProbe;
    }

    private async probeCapabilities(): Promise<IVoiceLinkCapabilities | undefined> {
        const result = await this.request(
            "capabilities",
            `${this.origin}/v1/capabilities`,
            { method: "GET" },
            async (response): Promise<ICapabilityRequestResult> => {
                if (!response.ok) {
                    return { response };
                }
                try {
                    return { body: await response.json(), response };
                } catch (_error) {
                    return { malformed: true, response };
                }
            },
        );

        if (!result) {
            this.disabled = true;
            return undefined;
        }
        if (!result.response.ok) {
            this.emit({
                operation: "capabilities",
                reason: "http-error",
                status: result.response.status,
            });
            this.disabled = true;
            return undefined;
        }
        if (result.malformed) {
            this.emit({ operation: "capabilities", reason: "malformed-response" });
            this.disabled = true;
            return undefined;
        }

        const capabilities = parseCapabilities(result.body);
        if (!capabilities) {
            this.emit({ operation: "capabilities", reason: "unsupported-response" });
            this.disabled = true;
            return undefined;
        }

        this.cachedCapabilities = freezeCapabilities(capabilities);
        return this.cachedCapabilities;
    }

    private async request<T>(
        operation: VoiceLinkOperation,
        url: string,
        init: RequestInit,
        transform: (response: Response) => T | Promise<T>,
    ): Promise<T | undefined> {
        const controller = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, this.timeoutMs);

        try {
            const response = await this.fetch(url, {
                ...init,
                credentials: "omit",
                redirect: "error",
                signal: controller.signal,
            });
            return await transform(response);
        } catch (_error) {
            this.emit({ operation, reason: timedOut ? "timeout" : "transport-error" });
            return undefined;
        } finally {
            clearTimeout(timer);
        }
    }

    private emit(diagnostic: VoiceLinkDiagnostic): void {
        try {
            this.diagnostic?.(diagnostic);
        } catch (_error) {
            // Diagnostics must never affect normal text-to-speech playback.
        }
    }
}
