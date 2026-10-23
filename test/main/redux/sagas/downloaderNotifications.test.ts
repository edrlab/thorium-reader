import { describe, expect, it, jest } from "@jest/globals";
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/network/http", () => ({ httpGet: jest.fn() }));
jest.mock("readium-desktop/main/event", () => ({ getOpdsAuthenticationChannel: jest.fn() }));
jest.mock("readium-desktop/main/fs/path", () => ({ createTempDir: jest.fn() }));
jest.mock("readium-desktop/common/services/translator", () => ({ getTranslator: () => ({ translate: (key: string) => key }) }));
import { downloader } from "readium-desktop/main/redux/sagas/downloader";

const lifecycle = (status: string) => ({ type: "PUT", payload: { action: { type: "DOWNLOAD_LIFECYCLE", payload: { status, label: "My book" } } } });
const start = () => {
    const operation = downloader(["https://example.org/book"], "My book");
    expect(operation.next().value).toMatchObject({ type: "PUT", payload: { action: { type: "DOWNLOAD_PROGRESS" } } });
    expect(operation.next().value).toMatchObject(lifecycle("started"));
    expect(operation.next().value).toMatchObject({ type: "CALL" });
    return operation;
};
const finish = (operation: ReturnType<typeof downloader>) => {
    expect(operation.next().value).toMatchObject({ type: "PUT", payload: { action: { type: "DOWNLOAD_DONE" } } });
};

describe("download lifecycle announcements", () => {
    it("reports completion once after the download finishes", () => {
        const operation = start();
        expect(operation.next(["/tmp/book.epub"]).value).toMatchObject({ type: "CANCELLED" });
        expect(operation.next(false).value).toMatchObject(lifecycle("completed"));
        finish(operation);
        expect(operation.next()).toMatchObject({ done: true, value: ["/tmp/book.epub"] });
    });
    it("reports failure and preserves the original error", () => {
        const operation = start();
        const cause = new Error("Connection lost");
        expect(operation.throw(cause).value).toMatchObject({ type: "CANCELLED" });
        expect(operation.next(false).value).toMatchObject(lifecycle("failed"));
        finish(operation);
        expect(() => operation.next()).toThrow(cause);
    });
    it("reports cancellation rather than completion", () => {
        const operation = start();
        expect(operation.return(undefined).value).toMatchObject({ type: "CANCELLED" });
        expect(operation.next(true).value).toMatchObject({ type: "PUT", payload: { action: { payload: { type: "toast-info" } } } });
        expect(operation.next().value).toMatchObject(lifecycle("cancelled"));
        finish(operation);
        expect(operation.next().done).toBe(true);
    });
    it("does not announce a cancelled sub-download as completed", () => {
        const operation = start();
        operation.next([undefined]);
        expect(operation.next(false).value).toMatchObject(lifecycle("cancelled"));
        finish(operation);
        operation.next();
    });
});
