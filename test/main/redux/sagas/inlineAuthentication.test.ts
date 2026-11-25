import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Headers } from "node-fetch";
import { runSaga } from "redux-saga";

jest.mock("readium-desktop/main/redux/sagas/api/browser/browse", () => ({ browse: jest.fn() }));
jest.mock("readium-desktop/main/redux/sagas/apiapp", () => ({ initClientSecretToken: jest.fn() }));
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/network/http", () => ({
    httpGet: jest.fn(), httpGetWithAuth: jest.fn(), httpPost: jest.fn(), httpSetAuthenticationToken: jest.fn(),
}));
jest.mock("readium-desktop/common/services/translator", () => ({ getTranslator: () => ({ translate: (key: string) => key }) }));

import { browse } from "readium-desktop/main/redux/sagas/api/browser/browse";
import { initClientSecretToken } from "readium-desktop/main/redux/sagas/apiapp";
import { authActions, historyActions } from "readium-desktop/common/redux/actions";
import { httpGet, httpGetWithAuth, httpPost, httpSetAuthenticationToken } from "readium-desktop/main/network/http";
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


describe("inline Digest authentication", () => {
    beforeEach(() => jest.resetAllMocks());

    it.each([true, false])("only stores validated credentials when success is %s", async success => {
        const target = url + "?page=2";
        const request = jest.mocked(httpGet);
        jest.mocked(httpGetWithAuth).mockReturnValue(request);
        request.mockResolvedValueOnce({
            ...response(false), statusCode: 401,
            response: { headers: new Headers({
                "WWW-Authenticate": 'Digest realm="Books, Inc.", nonce="abc=", qop="auth,auth-int", opaque="xyz="',
            }) },
        }).mockResolvedValueOnce(response(success));
        const dispatch = jest.fn();
        await runSaga({ dispatch }, submitInlineAuthentication, authActions.submit.build(target, "reader", "secret", {
            authenticationType: "http://opds-spec.org/auth/digest",
        })).toPromise();
        expect(httpGetWithAuth).toHaveBeenCalledWith(false);
        const authorization = new Headers(request.mock.calls[1][1].headers).get("Authorization");
        expect(authorization).toMatch(/^Digest username="reader", realm="Books, Inc.", nonce="abc="/);
        expect(authorization).toContain('uri="/catalog?page=2", qop=auth, nc=00000001');
        expect(authorization).toContain('opaque="xyz="');
        expect(httpSetAuthenticationToken).toHaveBeenCalledTimes(Number(success));
        expect(dispatch).toHaveBeenCalledWith(authActions.submitted.build(target, !success));
        if (success) {
            expect(dispatch).toHaveBeenLastCalledWith(historyActions.refresh.build());
        }
    });
});

describe("inline Local and OAuth password authentication", () => {
    beforeEach(() => jest.resetAllMocks());
    it.each([
        "http://opds-spec.org/auth/local",
        "http://opds-spec.org/auth/oauth/password",
        "http://opds-spec.org/auth/oauth/password/apiapp",
    ] as const)(
        "exchanges credentials for %s and retains refresh metadata", async authenticationType => {
            jest.mocked(initClientSecretToken).mockResolvedValue("secret+&=");
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
            expect(body.get("grant_type")).toBe(authenticationType.endsWith("/local") ? null : "password");
            if (authenticationType.endsWith("/apiapp")) {
                expect(initClientSecretToken).toHaveBeenCalledWith("provider");
                expect(body.get("client_id")).toBe("provider");
                expect(body.get("client_secret")).toBe("secret+&=");
            } else {
                expect(initClientSecretToken).not.toHaveBeenCalled();
                expect(body.has("client_id")).toBe(false);
                expect(body.has("client_secret")).toBe(false);
            }
            expect(httpSetAuthenticationToken).toHaveBeenCalledWith(expect.objectContaining({
                accessToken: "access", refreshToken: "refresh", tokenType: "Bearer", id: "provider",
                opdsAuthenticationUrl: url, refreshUrl: "https://example.org/refresh",
            }));
            const parsed = await callback({ ...response(true), response: { json: async () => ({ access_token: "token", refresh_token: "new", token_type: "bearer" }) } });
            expect(parsed.data).toMatchObject({ accessToken: "token", refreshToken: "new", tokenType: "Bearer" });
            expect(dispatch).toHaveBeenCalledWith(authActions.submitted.build(url, false));
            expect(dispatch).toHaveBeenLastCalledWith(historyActions.refresh.build());
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

    it("rejects API App authentication without a library ID before exchanging credentials", async () => {
        const dispatch = jest.fn();
        await runSaga({ dispatch }, submitInlineAuthentication, authActions.submit.build(url, "reader", "secret", {
            authenticationType: "http://opds-spec.org/auth/oauth/password/apiapp", oauthUrl: "https://example.org/token",
        })).toPromise();
        expect(initClientSecretToken).not.toHaveBeenCalled();
        expect(httpPost).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenLastCalledWith(authActions.submitted.build(url, true));
    });
});
