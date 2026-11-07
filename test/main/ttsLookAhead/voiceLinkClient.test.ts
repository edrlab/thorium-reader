import { afterEach, expect, jest, test } from "@jest/globals";

import type { IVoiceLinkCapabilities, IVoiceLinkSnapshot } from "readium-desktop/common/ipc/ttsLookAhead";
import { type VoiceLinkDiagnostic, VoiceLinkClient } from "readium-desktop/main/ttsLookAhead/voiceLinkClient";

const ORIGIN = "http://127.0.0.1:7860";
const STREAM_ID = "123e4567-e89b-12d3-a456-426614174000";

const generousCapabilities: IVoiceLinkCapabilities = {
    maxBodyBytes: 1_000_000,
    maxCharacters: 1_000_000,
    maxUnitCharacters: 1_000_000,
    maxUnits: 100,
    protocols: [1],
};

function capabilityResponse(lookahead: unknown = generousCapabilities): Response {
    return Response.json({
        bridgeProtocolRequiredForPauses: 1,
        lookahead,
        structuredPauses: true,
    });
}

function response(status: number, body: string | null = null): Response {
    return new Response(body, { status });
}

function snapshot(texts: string[] = ["Current unit", "Future unit"]): IVoiceLinkSnapshot {
    return {
        currentSequence: 20,
        generation: 3,
        protocol: 1,
        revision: 8,
        source: {
            lang: "en-GB",
            rate: 1.1,
            voiceName: "Emma",
            voiceURI: "VoiceLink_bf_emma",
        },
        units: texts.map((text, index) => ({
            block: { id: `3:${index}`, kind: "paragraph" },
            boundaryAfter: index === texts.length - 1 ? "document" : "sentence",
            boundaryBefore: index === 0 ? "section" : "sentence",
            position: {
                firstInBlock: true,
                indexInBlock: 0,
                lastInBlock: true,
            },
            sequence: 20 + index,
            text,
        })),
    };
}

function fetchStub(...responses: Array<Response | Error>): {
    calls: Array<{ input: RequestInfo | URL; init?: RequestInit }>;
    fetch: typeof fetch;
} {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    let index = 0;
    const stub = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        calls.push({ input, init });
        const next = responses[index++];
        if (next instanceof Error) {
            throw next;
        }
        if (!next) {
            throw new Error("Unexpected fetch call");
        }
        return next;
    };
    return { calls, fetch: stub as typeof fetch };
}

function putBodies(calls: Array<{ input: RequestInfo | URL; init?: RequestInit }>): IVoiceLinkSnapshot[] {
    return calls
        .filter(({ init }) => init?.method === "PUT")
        .map(({ init }) => JSON.parse(init?.body as string) as IVoiceLinkSnapshot);
}

afterEach(() => {
    jest.useRealTimers();
});

test("unwraps a valid protocol 1 capability response and caches it for the client lifetime", async () => {
    const harness = fetchStub(capabilityResponse());
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.capabilities()).resolves.toStrictEqual(generousCapabilities);
    await expect(client.capabilities()).resolves.toStrictEqual(generousCapabilities);

    expect(harness.calls).toHaveLength(1);
    expect(harness.calls[0].input).toBe(`${ORIGIN}/capabilities`);
    expect(harness.calls[0].init).toStrictEqual({
        credentials: "omit",
        method: "GET",
        redirect: "error",
        signal: expect.any(AbortSignal),
    });
});

test.each([
    ["missing lookahead", {}],
    ["null lookahead", { lookahead: null }],
    ["unsupported protocol", { lookahead: { ...generousCapabilities, protocols: [2] } }],
    ["fractional limit", { lookahead: { ...generousCapabilities, maxUnits: 1.5 } }],
    ["zero limit", { lookahead: { ...generousCapabilities, maxCharacters: 0 } }],
])("disables safely for a %s capability response", async (_name, body) => {
    const harness = fetchStub(Response.json(body));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.capabilities()).resolves.toBeUndefined();
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("disabled");
    expect(harness.calls).toHaveLength(1);
});

test("uses exact PUT and DELETE requests without credentials or redirects", async () => {
    const source = snapshot();
    const harness = fetchStub(capabilityResponse(), response(204), response(204));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, source)).resolves.toBe("accepted");
    await expect(client.deleteStream(STREAM_ID)).resolves.toBeUndefined();

    expect(harness.calls[1]).toStrictEqual({
        input: `${ORIGIN}/tts/lookahead/${STREAM_ID}`,
        init: {
            body: JSON.stringify(source),
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            method: "PUT",
            redirect: "error",
            signal: expect.any(AbortSignal),
        },
    });
    expect(harness.calls[2]).toStrictEqual({
        input: `${ORIGIN}/tts/lookahead/${STREAM_ID}`,
        init: {
            credentials: "omit",
            method: "DELETE",
            redirect: "error",
            signal: expect.any(AbortSignal),
        },
    });
});

test("rejects non-loopback origins and malformed stream IDs before any network request", async () => {
    const harness = fetchStub(capabilityResponse());

    expect(
        () =>
            new VoiceLinkClient({
                fetch: harness.fetch,
                origin: "http://localhost:7860" as "http://127.0.0.1:7860",
            }),
    ).toThrow(TypeError);

    const client = new VoiceLinkClient({ fetch: harness.fetch });
    await expect(client.putSnapshot("../capabilities", snapshot())).resolves.toBe("disabled");
    await expect(client.putSnapshot(STREAM_ID.toUpperCase(), snapshot())).resolves.toBe("disabled");
    await expect(client.deleteStream("not-a-uuid")).resolves.toBeUndefined();
    expect(harness.calls).toHaveLength(0);
});

test("aborts every timed-out operation and resolves without throwing", async () => {
    jest.useFakeTimers();
    const signals: AbortSignal[] = [];
    const hangingFetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        const signal = init?.signal as AbortSignal;
        signals.push(signal);
        return new Promise<Response>((_resolve, reject) => {
            signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        });
    }) as typeof fetch;
    const client = new VoiceLinkClient({ fetch: hangingFetch, timeoutMs: 25 });

    const capabilities = client.capabilities();
    await jest.advanceTimersByTimeAsync(25);
    await expect(capabilities).resolves.toBeUndefined();

    const deletion = client.deleteStream(STREAM_ID);
    await jest.advanceTimersByTimeAsync(25);
    await expect(deletion).resolves.toBeUndefined();
    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
});

test("treats connection refusal and malformed capability JSON as disabled without unhandled errors", async () => {
    const refused = new VoiceLinkClient({ fetch: fetchStub(new Error("ECONNREFUSED")).fetch });
    const malformed = new VoiceLinkClient({ fetch: fetchStub(response(200, "{")).fetch });

    await expect(refused.capabilities()).resolves.toBeUndefined();
    await expect(refused.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("disabled");
    await expect(malformed.capabilities()).resolves.toBeUndefined();
    await expect(malformed.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("disabled");
});

test.each([
    [400, "disabled"],
    [429, "disabled"],
    [500, "transient-error"],
    [503, "transient-error"],
] as const)("classifies PUT status %i as %s without retrying", async (status, expected) => {
    const harness = fetchStub(capabilityResponse(), response(status));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe(expected);
    expect(harness.calls).toHaveLength(2);
});

test("classifies a PUT transport failure as transient without retrying", async () => {
    const harness = fetchStub(capabilityResponse(), new Error("connection lost"));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    expect(harness.calls).toHaveLength(2);
});

test("trims maxUnits to a consecutive whole-unit prefix and never mutates the caller snapshot", async () => {
    const source = snapshot(["first", "second", "third"]);
    const before = structuredClone(source);
    const harness = fetchStub(capabilityResponse({ ...generousCapabilities, maxUnits: 2 }), response(204));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, source)).resolves.toBe("accepted");
    expect(putBodies(harness.calls)[0].units.map(({ text }) => text)).toEqual(["first", "second"]);
    expect(source).toStrictEqual(before);
});

test("counts Unicode scalar values for maxCharacters instead of UTF-16 code units", async () => {
    const source = snapshot(["A😀", "é", "must be trimmed"]);
    const harness = fetchStub(capabilityResponse({ ...generousCapabilities, maxCharacters: 3 }), response(204));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, source)).resolves.toBe("accepted");
    expect(putBodies(harness.calls)[0].units.map(({ text }) => text)).toEqual(["A😀", "é"]);
});

test("stops at the first unit exceeding maxUnitCharacters without skipping to a later short unit", async () => {
    const source = snapshot(["😀😀", "abc", "z"]);
    const harness = fetchStub(capabilityResponse({ ...generousCapabilities, maxUnitCharacters: 2 }), response(204));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, source)).resolves.toBe("accepted");
    expect(putBodies(harness.calls)[0].units.map(({ text }) => text)).toEqual(["😀😀"]);
});

test("applies maxBodyBytes to serialized UTF-8 and retains only a whole-unit prefix", async () => {
    const source = snapshot(["Résumé 😀", "漢😀", "later"]);
    const firstOnly = { ...source, units: [source.units[0]] };
    const firstBodyBytes = Buffer.byteLength(JSON.stringify(firstOnly), "utf8");
    const harness = fetchStub(
        capabilityResponse({ ...generousCapabilities, maxBodyBytes: firstBodyBytes }),
        response(204),
    );
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, source)).resolves.toBe("accepted");
    expect(putBodies(harness.calls)[0].units.map(({ text }) => text)).toEqual(["Résumé 😀"]);
});

test.each([
    ["maxUnitCharacters", { maxUnitCharacters: 1 }, snapshot(["😀😀"])],
    ["maxCharacters", { maxCharacters: 1 }, snapshot(["é😀"])],
    ["maxBodyBytes", { maxBodyBytes: 1 }, snapshot(["漢"])],
])("disables without PUT when the current unit violates %s", async (_name, limit, source) => {
    const harness = fetchStub(capabilityResponse({ ...generousCapabilities, ...limit }));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, source)).resolves.toBe("disabled");
    expect(harness.calls).toHaveLength(1);
});

test("enforces local hard caps even when the server advertises larger limits", async () => {
    const overUnits = snapshot(Array.from({ length: 13 }, (_value, index) => `u${index}`));
    const overTotal = snapshot(["a".repeat(4000), "b".repeat(4000), "c".repeat(4000), "d"]);
    const overBody = snapshot(["\u0001".repeat(4000), "\u0001".repeat(4000), "\u0001".repeat(4000)]);
    const unitHarness = fetchStub(capabilityResponse(), response(204));
    const totalHarness = fetchStub(capabilityResponse(), response(204));
    const bodyHarness = fetchStub(capabilityResponse(), response(204));

    await new VoiceLinkClient({ fetch: unitHarness.fetch }).putSnapshot(STREAM_ID, overUnits);
    await new VoiceLinkClient({ fetch: totalHarness.fetch }).putSnapshot(STREAM_ID, overTotal);
    await new VoiceLinkClient({ fetch: bodyHarness.fetch }).putSnapshot(STREAM_ID, overBody);

    expect(putBodies(unitHarness.calls)[0].units).toHaveLength(12);
    expect(putBodies(totalHarness.calls)[0].units).toHaveLength(3);
    expect(putBodies(bodyHarness.calls)[0].units).toHaveLength(2);
});

test("enforces the local 4,000-scalar per-unit hard cap before PUT", async () => {
    const harness = fetchStub(capabilityResponse());
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, snapshot(["😀".repeat(4001)]))).resolves.toBe("disabled");
    expect(harness.calls).toHaveLength(1);
});

test("emits only operation, reason, and status metadata without private request or response content", async () => {
    const privateText = "PRIVATE Résumé 😀";
    const privateResponse = "SERVER PRIVATE BODY";
    const diagnostics: VoiceLinkDiagnostic[] = [];
    const harness = fetchStub(capabilityResponse(), response(503, privateResponse), new Error(privateText));
    const client = new VoiceLinkClient({
        diagnostic: (diagnostic) => diagnostics.push(diagnostic),
        fetch: harness.fetch,
    });

    await client.putSnapshot(STREAM_ID, snapshot([privateText]));
    await client.deleteStream(STREAM_ID);

    expect(diagnostics).toEqual([
        { operation: "put", reason: "server-error", status: 503 },
        { operation: "delete", reason: "transport-error" },
    ]);
    expect(
        diagnostics.every((entry) =>
            Object.keys(entry).every((key) => ["operation", "reason", "status"].includes(key)),
        ),
    ).toBe(true);
    const serialized = JSON.stringify(diagnostics);
    expect(serialized).not.toContain(privateText);
    expect(serialized).not.toContain(privateResponse);
    expect(serialized).not.toContain(STREAM_ID);
    expect(serialized).not.toContain("?");
});
