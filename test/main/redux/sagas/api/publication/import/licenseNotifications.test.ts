import { describe, expect, it, jest } from "@jest/globals";
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: () => ({ convertUnlockPublicationResultToString: () => "Invalid license" }) }));
jest.mock("readium-desktop/common/lcp", () => ({ lcpLicenseIsNotWellFormed: jest.fn(() => false) }));
jest.mock("@r2-lcp-js/serializable", () => ({ TaJsonDeserialize: jest.fn() }));
jest.mock("readium-desktop/main/tools/crc", () => ({ extractCrc32OnZip: jest.fn() }));
jest.mock("readium-desktop/main/redux/sagas/downloader", () => ({ downloader: jest.fn() }));
jest.mock("readium-desktop/main/redux/sagas/api/publication/import/importPublicationFromFs", () => ({ importPublicationFromFS: jest.fn() }));
import { lcpLicenseIsNotWellFormed } from "readium-desktop/common/lcp";
import { getTranslator } from "readium-desktop/common/services/translator";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { importLcplFromFS } from "readium-desktop/main/redux/sagas/api/publication/import/importLcplFromFs";

describe("license import error ownership", () => {
    it("throws an expired-license error directly to the import owner", () => {
        jest.mocked(TaJsonDeserialize).mockReturnValue({
            init: (): void => undefined,
            isNativeNodePlugin: () => true,
            Rights: { End: new Date("2000-01-01") },
        } as never);
        const operation = importLcplFromFS("expired.lcpl", false);
        expect(operation.next().value).toMatchObject({ type: "CALL" });
        expect(() => operation.next("{}")).toThrow("Invalid license");
    });
    it("throws a signature failure without emitting an intermediate toast", () => {
        jest.mocked(TaJsonDeserialize).mockReturnValue({
            init: (): void => undefined,
            isNativeNodePlugin: () => true,
        } as never);
        const operation = importLcplFromFS("invalid.lcpl", false);
        operation.next();
        expect(operation.next("{}").value).toMatchObject({ type: "CALL" });
        expect(() => operation.throw(112)).toThrow("Invalid license");
    });
});


it("uses a translated malformed-license error without embedding license contents", () => {
    jest.mocked(lcpLicenseIsNotWellFormed).mockReturnValueOnce(true);
    const operation = importLcplFromFS("invalid.lcpl", false);
    operation.next();
    expect(() => operation.next('{"email":"private@example.org"}'))
        .toThrow(getTranslator().translate("message.import.lcpLicenseMalformed"));
});
