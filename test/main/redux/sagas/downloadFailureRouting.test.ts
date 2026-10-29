import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as fs from "node:fs";
import * as path from "node:path";
import { Readable, PassThrough } from "node:stream";
import { runSaga, stdChannel } from "redux-saga";
import { call } from "redux-saga/effects";
import type { IHttpGetResult } from "readium-desktop/common/utils/http";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/network/http", () => ({ httpGet: jest.fn() }));
jest.mock("readium-desktop/main/event", () => ({ getOpdsAuthenticationChannel: jest.fn() }));
jest.mock("readium-desktop/main/fs/path", () => ({ createTempDir: jest.fn() }));
jest.mock("@r2-lcp-js/serializable", () => ({ TaJsonDeserialize: () => ({}) }));
jest.mock("readium-desktop/common/services/translator", () => ({
    getTranslator: () => ({ translate: (key: string, args?: unknown) => JSON.stringify({ key, args }) }),
}));

import { httpGet } from "readium-desktop/main/network/http";
import { getOpdsAuthenticationChannel } from "readium-desktop/main/event";
import { createTempDir } from "readium-desktop/main/fs/path";
import { downloader } from "readium-desktop/main/redux/sagas/downloader";
import { DownloadCancelled, DownloadFailure, checkDownloadResponse } from "readium-desktop/main/tools/downloadFailure";
import { importFailureMessage } from "readium-desktop/main/redux/sagas/api/publication/import/importFailure";
import { authActions, downloadActions } from "readium-desktop/common/redux/actions";

const source = "https://user:secret@example.org:8443/book.epub?token=secret#chapter";
const response = (body = Readable.from([Buffer.from("book")])) => ({
    isSuccess: true,
    url: source,
    body,
    contentType: "application/epub+zip",
    response: { headers: new Headers() },
} as unknown as IHttpGetResult<undefined>);

async function execute(links: Parameters<typeof downloader>[0] = [source], abort = false) {
    const actions: any[] = [];
    const input = stdChannel();
    let failure: unknown;
    const task = runSaga({ channel: input, dispatch: action => actions.push(action) }, function* () {
        try {
            yield call(downloader, links);
        } catch (error) {
            failure = error;
        }
    });
    if (abort) input.put(downloadActions.abort.build((actions[0] as any).payload.id));
    await task.toPromise();
    return { actions, failure };
}

describe("download failure routing", () => {
    let directory: string;
    beforeEach(() => {
        jest.clearAllMocks();
        directory = fs.mkdtempSync(path.join(process.cwd(), ".download-routing-test-"));
        jest.mocked(createTempDir).mockResolvedValue(directory);
    });
    afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

    it.each([
        ["network", { isNetworkError: true }],
        ["timeout", { isNetworkError: true, isTimeout: true }],
        ["http", { statusCode: 503 }],
    ])("preserves %s failures without adding a downloader error toast", async (reason, flags) => {
        jest.mocked(httpGet).mockResolvedValue({ isSuccess: false, url: source, ...flags } as IHttpGetResult<undefined>);
        const { actions, failure } = await execute();
        expect(failure).toMatchObject({ reason, source });
        expect(actions.filter(a => a.type === "TOAST_OPEN_REQUEST" && a.payload.type === "toast-error")).toHaveLength(0);
        expect(actions.at(-1).type).toBe("DOWNLOAD_DONE");
        expect(importFailureMessage(failure, "license.lcpl")).toBe(JSON.stringify({
            key: "message.download.failedWithHost", args: { hostname: "example.org" },
        }));
    });

    it("routes length mismatches as integrity failures", async () => {
        jest.mocked(httpGet).mockResolvedValue(response());
        const { failure } = await execute([{ href: source, length: 100 }]);
        expect(failure).toMatchObject({ reason: "integrity", source });
        expect(importFailureMessage(failure, "license.lcpl")).toContain("message.download.integrityFailedWithHost");
    });

    it("routes SHA-256 mismatches as integrity failures", async () => {
        jest.mocked(httpGet).mockResolvedValue(response());
        const { failure } = await execute([{ href: source, hash: "00".repeat(32) }]);
        expect(failure).toMatchObject({ reason: "integrity", source });
    });

    it("routes interrupted read streams as network failures", async () => {
        const body = new Readable({ read() { this.destroy(new Error("private transport details")); } });
        jest.mocked(httpGet).mockResolvedValue(response(body));
        const { failure, actions } = await execute();
        expect(failure).toMatchObject({ reason: "network", source });
        expect(importFailureMessage(failure, "book.epub")).not.toContain("private transport details");
        expect(actions.at(-1).type).toBe("DOWNLOAD_DONE");
    });

    it("routes idle streams as timeouts", async () => {
        jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
        try {
            const body = new PassThrough();
            jest.mocked(httpGet).mockResolvedValue(response(body));
            const pending = execute();
            for (let attempt = 0; attempt < 100 && body.listenerCount("error") < 3; attempt++) {
                await new Promise<void>(resolve => setImmediate(resolve));
            }
            expect(body.listenerCount("error")).toBeGreaterThanOrEqual(3);
            await jest.advanceTimersByTimeAsync(30001);
            const { failure } = await pending;
            expect(failure).toMatchObject({ reason: "timeout", source });
        } finally {
            jest.useRealTimers();
        }
    });

    it("rejects premature stream closure instead of accepting a partial file", async () => {
        const body = new Readable({ read() { this.destroy(); } });
        jest.mocked(httpGet).mockResolvedValue(response(body));
        const { failure } = await execute();
        expect(failure).toMatchObject({ reason: "network", source });
    });

    it("cancels sibling downloads while preserving the failing resource hostname", async () => {
        const resource = "https://cdn.example.net/resource?secret=1";
        jest.mocked(httpGet).mockImplementation(async (href) => href === source
            ? response(new PassThrough())
            : { isSuccess: false, url: resource, statusCode: 503 } as IHttpGetResult<undefined>);
        const { failure, actions } = await execute([source, resource]);
        expect(failure).toMatchObject({ reason: "http", source: resource });
        expect(importFailureMessage(failure, "license.lcpl")).toContain("cdn.example.net");
        expect(actions.filter(a => a.type === "TOAST_OPEN_REQUEST" && a.payload.data.includes("message.download.cancelled"))).toHaveLength(0);
        expect(actions.at(-1).type).toBe("DOWNLOAD_DONE");
    });

    it("routes disk errors as storage failures", async () => {
        jest.mocked(httpGet).mockResolvedValue(response());
        jest.mocked(createTempDir).mockRejectedValue(Object.assign(new Error("private path"), { code: "ENOSPC" }));
        const { failure } = await execute();
        expect(failure).toMatchObject({ reason: "storage", source });
        expect(importFailureMessage(failure, "license.lcpl")).toBe(JSON.stringify({ key: "message.download.saveFailed" }));
    });

    it("does not classify an unrelated exception by its message", () => {
        expect(importFailureMessage(new Error("timeout ENOSPC secret"), "book.epub"))
            .toBe(JSON.stringify({ key: "message.import.failed", args: { name: "book.epub" } }));
        expect(importFailureMessage(new DownloadFailure("network", "https://[invalid"), "book.epub"))
            .toBe(JSON.stringify({ key: "message.download.failed" }));
    });

    it("returns successful downloads without an error", async () => {
        jest.mocked(httpGet).mockResolvedValue(response());
        const { failure, actions } = await execute();
        expect(failure).toBeUndefined();
        expect(actions.at(-1).type).toBe("DOWNLOAD_DONE");
    });

    it("treats abort as cancellation and removes progress", async () => {
        jest.mocked(httpGet).mockImplementation(() => new Promise(() => undefined));
        const { actions, failure } = await execute([source], true);
        expect(failure).toBeUndefined();
        const notices = actions.filter(a => a.type === "TOAST_OPEN_REQUEST");
        expect(notices.at(-1).payload.data).toContain("message.download.cancelled");
        expect(actions.at(-1).type).toBe("DOWNLOAD_DONE");
    });

    it("treats authentication dismissal as cancellation instead of importing the auth response", async () => {
        const input = stdChannel();
        jest.mocked(httpGet).mockResolvedValue({ ...response(new PassThrough()),
            contentType: "application/opds-authentication+json", response: { json: async () => ({}) },
        } as unknown as IHttpGetResult<undefined>);
        jest.mocked(getOpdsAuthenticationChannel).mockReturnValue({ put: () => {
            queueMicrotask(() => input.put(authActions.cancel.build()));
        } } as never);
        const actions: any[] = [];
        let failure: unknown;
        const task = runSaga({ channel: input, dispatch: a => actions.push(a) }, function* () {
            try { yield call(downloader, [source]); } catch (error) { failure = error; }
        });
        await task.toPromise();
        expect(failure).toBeInstanceOf(DownloadCancelled);
        expect(createTempDir).not.toHaveBeenCalled();
        expect(actions.filter(a => a.type === "TOAST_OPEN_REQUEST" && a.payload.data.includes("message.download.cancelled"))).toHaveLength(1);
        expect(actions.at(-1).type).toBe("DOWNLOAD_DONE");
    });

    it("marks HTTP abort results as cancellation", () => {
        expect(() => checkDownloadResponse({ isAbort: true } as IHttpGetResult<undefined>, source)).toThrow(DownloadCancelled);
    });
});
