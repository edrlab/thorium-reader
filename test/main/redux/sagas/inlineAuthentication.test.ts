import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";

jest.mock("readium-desktop/main/redux/sagas/api/browser/browse", () => ({ browse: jest.fn() }));
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/network/http", () => ({ httpGet: jest.fn(), httpPost: jest.fn(), httpSetAuthenticationToken: jest.fn() }));
jest.mock("readium-desktop/common/services/translator", () => ({ getTranslator: () => ({ translate: (key: string) => key }) }));

import { browse } from "readium-desktop/main/redux/sagas/api/browser/browse";
import { authActions, historyActions } from "readium-desktop/common/redux/actions";
import { httpGet, httpPost, httpSetAuthenticationToken } from "readium-desktop/main/network/http";
import { submitInlineAuthentication } from "readium-desktop/main/redux/sagas/inlineAuthentication";

const url = "https://example.org/catalog";
const response = (isSuccess: boolean, contentType = "application/opds+json") =>
    ({ isSuccess, isFailure: !isSuccess, url, contentType }) as Awaited<ReturnType<typeof httpGet>>;

describe("inline Basic credential submission", () => {
    beforeEach(() => jest.resetAllMocks());

    it("stores Basic credentials and refreshes the requested page after authentication", async () => {
        jest.mocked(browse).mockImplementation(function* () { return response(true); });
        const dispatch = jest.fn();
        await runSaga({ dispatch }, submitInlineAuthentication, authActions.submit.build(url, "reader", "secret")).toPromise();
        expect(httpSetAuthenticationToken).toHaveBeenCalledWith(expect.objectContaining({
            opdsAuthenticationUrl: url, tokenType: "Basic", accessToken: Buffer.from("reader:secret").toString("base64"),
        }));
        expect(dispatch).toHaveBeenCalledWith(historyActions.refresh.build());
        expect(dispatch).toHaveBeenCalledWith(authActions.submitted.build(url, false, response(true)));
        expect(browse).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenLastCalledWith(historyActions.refresh.build());
    });

    it.each([response(false)])(
        "keeps the form available after rejected credentials", async result => {
            jest.mocked(browse).mockImplementation(function* () { return result; });
            const dispatch = jest.fn();
            await runSaga({ dispatch }, submitInlineAuthentication, authActions.submit.build(url, "reader", "wrong")).toPromise();
            expect(dispatch).not.toHaveBeenCalledWith(historyActions.refresh.build());
            expect(dispatch).toHaveBeenLastCalledWith(authActions.submitted.build(url, true));
        },
    );

    it("releases pending state after network failure", async () => {
        jest.mocked(browse).mockImplementation(function* () { throw new Error("Offline"); });
        const dispatch = jest.fn();
        await runSaga({ dispatch }, submitInlineAuthentication, authActions.submit.build(url, "reader", "secret")).toPromise();
        expect(dispatch).toHaveBeenLastCalledWith(authActions.submitted.build(url, true));
    });

    it("rejects non-HTTP credential targets before storing credentials", async () => {
        const dispatch = jest.fn();
        await runSaga({ dispatch }, submitInlineAuthentication, authActions.submit.build("file:///catalog", "reader", "secret")).toPromise();
        expect(httpSetAuthenticationToken).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenLastCalledWith(authActions.submitted.build("file:///catalog", true));
    });
});


describe("inline Local and OAuth password authentication", () => {
    beforeEach(() => jest.resetAllMocks());
    it.each(["http://opds-spec.org/auth/local", "http://opds-spec.org/auth/oauth/password"] as const)(
        "exchanges credentials for %s and retains refresh metadata", async authenticationType => {
            jest.mocked(httpPost).mockResolvedValue({ ...response(true),
                data: { accessToken: "access", refreshToken: "refresh", tokenType: "Bearer" },
            });
            const dispatch = jest.fn();
            await runSaga({ dispatch }, submitInlineAuthentication, authActions.submit.build(url, "a&b", "p=+word", {
                authenticationType, authenticationId: "provider", oauthUrl: "https://example.org/token",
                oauthRefreshUrl: "https://example.org/refresh",
            })).toPromise();
            const [endpoint, options, callback] = jest.mocked(httpPost).mock.calls[0];
            expect(endpoint).toBe("https://example.org/token");
            const body = new URLSearchParams(String(options.body));
            expect(body.get("username")).toBe("a&b");
            expect(body.get("password")).toBe("p=+word");
            expect(body.get("grant_type")).toBe(authenticationType.endsWith("oauth/password") ? "password" : null);
            expect(httpSetAuthenticationToken).toHaveBeenCalledWith(expect.objectContaining({
                accessToken: "access", refreshToken: "refresh", tokenType: "Bearer", id: "provider",
                opdsAuthenticationUrl: url, refreshUrl: "https://example.org/refresh",
            }));
            const parsed = await callback({ ...response(true), response: { json: async () => ({ access_token: "token", refresh_token: "new", token_type: "bearer" }) } });
            expect(parsed.data).toMatchObject({ accessToken: "token", refreshToken: "new", tokenType: "Bearer" });
            expect(dispatch).toHaveBeenCalledWith(authActions.submitted.build(url, false));
        },
    );
    it("keeps the form available when the token endpoint rejects credentials", async () => {
        jest.mocked(httpPost).mockResolvedValue(response(false));
        const dispatch = jest.fn();
        await runSaga({ dispatch }, submitInlineAuthentication, authActions.submit.build(url, "a", "bad", {
            authenticationType: "http://opds-spec.org/auth/local", oauthUrl: "https://example.org/token",
        })).toPromise();
        expect(httpSetAuthenticationToken).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenLastCalledWith(authActions.submitted.build(url, true));
    });
});
