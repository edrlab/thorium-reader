import { describe, expect, it, jest } from "@jest/globals";
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/network/http", () => ({ httpGet: jest.fn() }));
jest.mock("readium-desktop/main/event", () => ({ getOpdsAuthenticationChannel: jest.fn() }));
jest.mock("readium-desktop/main/fs/path", () => ({ createTempDir: jest.fn() }));
jest.mock("readium-desktop/common/services/translator", () => ({ getTranslator: () => ({ translate: (key: string, args?: { title: string; err: string }) => args ? args.title + ": " + args.err : key }) }));
import { downloader } from "readium-desktop/main/redux/sagas/downloader";

describe("download failure ownership", () => {
    it("reports cancellation as an informational notice", () => {
        const operation = downloader(["https://example.org/book"], "My book");
        operation.next();
        operation.next();
        expect(operation.return(undefined).value).toMatchObject({ type: "CANCELLED" });
        const notification = operation.next(true).value;
        expect(notification).toMatchObject({ type: "PUT", payload: { action: { payload: { type: "toast-default" } } } });
        expect(notification).not.toHaveProperty("payload.action.payload.timeout");
        operation.next();
        operation.next();
    });
    it("propagates the original cause without notifying and completes download tracking", () => {
        const operation = downloader(["https://example.org/book"], "My book");
        expect(operation.next().value).toMatchObject({ type: "PUT", payload: { action: { type: "DOWNLOAD_PROGRESS" } } });
        expect(operation.next().value).toMatchObject({ type: "CALL" });
        const cause = new Error("Connection lost");
        expect(operation.throw(cause).value).toMatchObject({ type: "CANCELLED" });
        expect(operation.next(false).value).toMatchObject({ type: "PUT", payload: { action: { type: "DOWNLOAD_DONE" } } });
        let failure: unknown;
        try { operation.next(); } catch (error) { failure = error; }
        expect(failure).toMatchObject({ message: "My book: Connection lost", cause });
    });
});
