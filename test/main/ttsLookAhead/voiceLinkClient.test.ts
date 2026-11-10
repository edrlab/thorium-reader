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

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
    let resolvePromise!: (value: T) => void;
    const promise = new Promise<T>((resolve) => {
        resolvePromise = resolve;
    });
    return { promise, resolve: resolvePromise };
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
    expect(harness.calls[0].input).toBe(`${ORIGIN}/v1/capabilities`);
    expect(harness.calls[0].init).toStrictEqual({
        credentials: "omit",
        method: "GET",
        redirect: "error",
        signal: expect.any(AbortSignal),
    });
});

test("shares one in-flight capability GET across simultaneous capability callers", async () => {
    const gate = deferred<void>();
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const controlledFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ input, init });
        await gate.promise;
        return capabilityResponse();
    }) as typeof fetch;
    const client = new VoiceLinkClient({ fetch: controlledFetch });

    const first = client.capabilities();
    const second = client.capabilities();
    gate.resolve(undefined);

    await expect(Promise.all([first, second])).resolves.toStrictEqual([generousCapabilities, generousCapabilities]);
    expect(calls).toHaveLength(1);
    expect(calls[0].input).toBe(`${ORIGIN}/v1/capabilities`);
});

test("shares one in-flight capability GET across concurrent snapshot publications", async () => {
    const gate = deferred<void>();
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const controlledFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ input, init });
        if (init?.method === "GET") {
            await gate.promise;
            return capabilityResponse();
        }
        return response(204);
    }) as typeof fetch;
    const client = new VoiceLinkClient({ fetch: controlledFetch });

    const first = client.putSnapshot(STREAM_ID, snapshot());
    const second = client.putSnapshot("223e4567-e89b-12d3-a456-426614174000", snapshot());
    gate.resolve(undefined);

    await expect(Promise.all([first, second])).resolves.toStrictEqual(["accepted", "accepted"]);
    expect(calls.filter(({ init }) => init?.method === "GET")).toHaveLength(1);
    expect(calls.filter(({ init }) => init?.method === "PUT")).toHaveLength(2);
});

test("settles one failed in-flight probe without allowing a concurrent valid result to overwrite it", async () => {
    const gate = deferred<void>();
    let capabilityCalls = 0;
    const controlledFetch = (async () => {
        capabilityCalls += 1;
        if (capabilityCalls === 1) {
            await gate.promise;
            return Response.json({ lookahead: null });
        }
        return capabilityResponse();
    }) as typeof fetch;
    const client = new VoiceLinkClient({ fetch: controlledFetch });

    const first = client.capabilities();
    const second = client.capabilities();
    gate.resolve(undefined);

    await expect(Promise.all([first, second])).resolves.toStrictEqual([undefined, undefined]);
    await expect(client.capabilities()).resolves.toBeUndefined();
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("disabled");
    expect(capabilityCalls).toBe(1);
});

test("returns defensive capability copies and keeps mutation from changing PUT trimming", async () => {
    const advertised: IVoiceLinkCapabilities = {
        maxBodyBytes: 65_536,
        maxCharacters: 100,
        maxUnitCharacters: 100,
        maxUnits: 1,
        protocols: [1],
    };
    const harness = fetchStub(capabilityResponse(advertised), response(204));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    const first = await client.capabilities();
    expect(first).toStrictEqual(advertised);
    first!.maxBodyBytes = 1_000_000;
    first!.maxCharacters = 1_000_000;
    first!.maxUnitCharacters = 1_000_000;
    first!.maxUnits = 100;
    first!.protocols.splice(0, first!.protocols.length, 99);

    const second = await client.capabilities();
    expect(second).toStrictEqual(advertised);
    expect(second).not.toBe(first);
    expect(second!.protocols).not.toBe(first!.protocols);
    await expect(client.putSnapshot(STREAM_ID, snapshot(["first", "second"]))).resolves.toBe("accepted");
    expect(putBodies(harness.calls)[0].units.map(({ text }) => text)).toEqual(["first"]);
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
        input: `${ORIGIN}/v1/tts/lookahead/${STREAM_ID}`,
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
        input: `${ORIGIN}/v1/tts/lookahead/${STREAM_ID}`,
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

test("recovers from capability connection refusal after a retry cooldown", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    const harness = fetchStub(new Error("ECONNREFUSED"), capabilityResponse(), response(204));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    expect(harness.calls).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(999);
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    expect(harness.calls).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(1);
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("accepted");
    expect(harness.calls).toHaveLength(3);
});

test("backs off repeated transient capability failures without hammering VoiceLink", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    const harness = fetchStub(
        new Error("first refusal"),
        new Error("second refusal"),
        capabilityResponse(),
        response(204),
    );
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    await jest.advanceTimersByTimeAsync(1_000);
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    expect(harness.calls).toHaveLength(2);

    await jest.advanceTimersByTimeAsync(1_999);
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    expect(harness.calls).toHaveLength(2);

    await jest.advanceTimersByTimeAsync(1);
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("accepted");
    expect(harness.calls).toHaveLength(4);
});

test("recovers after a timed-out capability request instead of disabling the client", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    let callCount = 0;
    const controlledFetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
        callCount += 1;
        if (callCount === 1) {
            const signal = init?.signal as AbortSignal;
            return new Promise<Response>((_resolve, reject) => {
                signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
            });
        }
        return Promise.resolve(callCount === 2 ? capabilityResponse() : response(204));
    }) as typeof fetch;
    const client = new VoiceLinkClient({ fetch: controlledFetch, timeoutMs: 25 });

    const first = client.putSnapshot(STREAM_ID, snapshot());
    await jest.advanceTimersByTimeAsync(25);
    await expect(first).resolves.toBe("transient-error");

    await jest.advanceTimersByTimeAsync(1_000);
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("accepted");
    expect(callCount).toBe(3);
});

test.each([408, 425, 429, 500, 503])(
    "retries transient capability HTTP status %i after the cooldown",
    async (status) => {
        jest.useFakeTimers();
        jest.setSystemTime(0);
        const harness = fetchStub(response(status), capabilityResponse(), response(204));
        const client = new VoiceLinkClient({ fetch: harness.fetch });

        await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
        await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
        expect(harness.calls).toHaveLength(1);

        await jest.advanceTimersByTimeAsync(1_000);
        await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("accepted");
        expect(harness.calls).toHaveLength(3);
    },
);

test.each([400, 404, 405, 426])("permanently disables capabilities for definitive HTTP status %i", async (status) => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    const harness = fetchStub(response(status), capabilityResponse());
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("disabled");
    await jest.advanceTimersByTimeAsync(60_000);
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("disabled");
    expect(harness.calls).toHaveLength(1);
});

test("permanently disables malformed successful capability JSON without unhandled errors", async () => {
    const harness = fetchStub(response(200, "{"), capabilityResponse());
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.capabilities()).resolves.toBeUndefined();
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("disabled");
    expect(harness.calls).toHaveLength(1);
});

test.each([
    [400, "disabled"],
    [408, "transient-error"],
    [409, "disabled"],
    [413, "disabled"],
    [425, "transient-error"],
    [426, "disabled"],
    [429, "transient-error"],
    [500, "transient-error"],
    [503, "transient-error"],
] as const)("classifies PUT status %i as %s without retrying", async (status, expected) => {
    const harness = fetchStub(capabilityResponse(), response(status));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe(expected);
    expect(harness.calls).toHaveLength(2);
});

test("honors PUT Retry-After after 429 without hammering the stream", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    const throttled = new Response(null, {
        headers: { "Retry-After": "1" },
        status: 429,
    });
    const harness = fetchStub(capabilityResponse(), throttled, response(202));
    const client = new VoiceLinkClient({ fetch: harness.fetch });

    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    expect(harness.calls).toHaveLength(2);

    await jest.advanceTimersByTimeAsync(999);
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("transient-error");
    expect(harness.calls).toHaveLength(2);

    await jest.advanceTimersByTimeAsync(1);
    await expect(client.putSnapshot(STREAM_ID, snapshot())).resolves.toBe("accepted");
    expect(harness.calls).toHaveLength(3);
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
