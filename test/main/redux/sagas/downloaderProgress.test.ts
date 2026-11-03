import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PassThrough, Writable } from "node:stream";
import * as fs from "node:fs";
import { runSaga } from "redux-saga";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { downloadActions } from "readium-desktop/common/redux/actions";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/network/http", () => ({ httpGet: jest.fn() }));
jest.mock("readium-desktop/main/event", () => ({ getOpdsAuthenticationChannel: jest.fn() }));
jest.mock("readium-desktop/main/fs/path", () => ({
    createTempDir: () => Promise.resolve("/tmp/download-progress-test"),
}));
jest.mock("node:fs", () => ({
    createWriteStream: jest.fn(),
    promises: { access: () => Promise.reject(new Error("not found")) },
}));
jest.mock("readium-desktop/common/services/translator", () => ({
    getTranslator: () => ({ translate: (key: string) => key }),
}));

import { httpGet } from "readium-desktop/main/network/http";
import { downloader } from "readium-desktop/main/redux/sagas/downloader";

// Allow the HTTP, path creation and stream setup promises to settle without advancing the polling clock.
const settle = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
};

const start = async (sizes: Array<number | undefined>, duplicateUrls = false) => {
    const streams = sizes.map(() => new PassThrough());
    const urls = sizes.map((_, index) => `https://example.org/book-${duplicateUrls ? 0 : index}.epub`);
    let request = 0;
    jest.mocked(httpGet).mockImplementation(<TData>() => {
        const index = request++;
        return Promise.resolve({
            isSuccess: true,
            url: urls[index],
            contentType: "application/epub+zip",
            body: streams[index],
            response: {
                headers: {
                    get: (name: string) =>
                        name === "content-length" && sizes[index] !== undefined ? `${sizes[index]}` : undefined,
                },
            },
        } as unknown as IHttpGetResult<TData>);
    });
    const updates: downloadActions.progress.Payload[] = [];
    const task = runSaga(
        {
            dispatch: (action: downloadActions.progress.TAction) => {
                if (action.type === downloadActions.progress.ID) updates.push(action.payload);
            },
        },
        downloader,
        urls,
        "My book",
    );
    await settle();
    return { streams, updates, task };
};

describe("nested download progress", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.mocked(fs.createWriteStream).mockImplementation(
            () =>
                new Writable({
                    write: (_chunk, _encoding, done) => done(),
                }) as fs.WriteStream,
        );
    });
    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it("exposes every file immediately with stable IDs even for duplicate URLs", async () => {
        const { streams, updates, task } = await start([100, 200], true);
        try {
            expect(updates[0].subDownloads).toEqual([
                { id: 0, url: "https://example.org/book-0.epub", downloadedBytes: 0, speedKiBPerSecond: 0 },
                { id: 1, url: "https://example.org/book-0.epub", downloadedBytes: 0, speedKiBPerSecond: 0 },
            ]);
            streams.forEach((stream) => stream.end());
            await task.toPromise();
            expect(updates.at(-1).subDownloads.map((file) => file.progress)).toEqual([100, 100]);
            expect(updates.at(-1).progress).toBe(100);
            // Previously dispatched snapshots remain unchanged.
            expect(updates[0].subDownloads[0].progress).toBeUndefined();
        } finally {
            task.cancel();
            streams.forEach((stream) => stream.destroy());
        }
    });

    it("weights aggregate progress by bytes and publishes child-only changes", async () => {
        const { streams, updates, task } = await start([1000, 3000]);
        try {
            streams[0].write(Buffer.alloc(100));
            streams[1].write(Buffer.alloc(600));
            await jest.advanceTimersByTimeAsync(1000);
            const first = updates.at(-1);
            expect(first.progress).toBe(18); // 700 / 4000, rather than an average of percentages
            expect(first.subDownloads.map((file) => file.progress)).toEqual([10, 20]);
            expect(first.subDownloads[0]).toMatchObject({
                downloadedBytes: 100,
                totalBytes: 1000,
                speedKiBPerSecond: 100 / 1024,
            });
            streams[0].write(Buffer.alloc(1));
            await jest.advanceTimersByTimeAsync(1000);
            const second = updates.at(-1);
            expect(second.progress).toBe(18);
            expect(second.subDownloads[0].progress).toBe(11);
            expect(first.subDownloads[0].downloadedBytes).toBe(100);
            expect(second.downloadLabel).toBe("My book");
            streams.forEach((stream) => stream.end());
            await task.toPromise();
        } finally {
            task.cancel();
            streams.forEach((stream) => stream.destroy());
        }
    });

    it("keeps unknown sizes indeterminate until completion and flushes short transfers", async () => {
        const { streams, updates, task } = await start([undefined, 100]);
        try {
            streams[0].write(Buffer.alloc(4));
            streams[1].write(Buffer.alloc(50));
            await jest.advanceTimersByTimeAsync(1000);
            expect(updates.at(-1).progress).toBeUndefined();
            expect(updates.at(-1).subDownloads[0]).toMatchObject({ downloadedBytes: 4 });
            expect(updates.at(-1).subDownloads[0].progress).toBeUndefined();
            expect(updates.at(-1).subDownloads[0].totalBytes).toBeUndefined();
            expect(updates.at(-1).subDownloads[1].progress).toBe(50);
            streams[0].end();
            streams[1].end(Buffer.alloc(50));
            await task.toPromise();
            expect(updates.at(-1).progress).toBe(100);
            expect(updates.at(-1).subDownloads.map((file) => file.progress)).toEqual([100, 100]);
        } finally {
            task.cancel();
            streams.forEach((stream) => stream.destroy());
        }
    });
});
