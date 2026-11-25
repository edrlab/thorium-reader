import { describe, expect, it } from "@jest/globals";
import { getExternalAuthenticationUrl, IExternalAuthenticationDocument } from "readium-desktop/main/redux/sagas/externalAuthenticationUrl";
import { createOpdsPkceTransaction } from "readium-desktop/main/network/opdsPkce";

const document = (type: IExternalAuthenticationDocument["authenticationType"], url: string): IExternalAuthenticationDocument => ({
    id: "provider", authenticationType: type, links: { authenticate: { url } },
});

describe("external authentication provider URLs", () => {
    it.each(["https://example.org/saml", "https://example.org/saml?tenant=a%26b&redirect_uri=old"])(
        "adds the OPDS callback to SAML endpoint %s", endpoint => {
            const url = new URL(getExternalAuthenticationUrl(document("http://librarysimplified.org/authtype/SAML-2.0", endpoint)));
            expect(url.searchParams.get("redirect_uri")).toBe("opds://authorize/");
            expect(url.searchParams.getAll("redirect_uri")).toHaveLength(1);
            if (endpoint.includes("tenant")) expect(url.searchParams.get("tenant")).toBe("a&b");
            expect(url.searchParams.has("response_type")).toBe(false);
        });

    it("creates separate implicit state while retaining provider parameters", () => {
        const first = { authenticationDocumentId: "", nonce: "" };
        const second = { authenticationDocumentId: "", nonce: "" };
        const auth = document("http://opds-spec.org/auth/oauth/implicit", "https://example.org/login?client_id=provider&tenant=a%26b");
        const url = new URL(getExternalAuthenticationUrl(auth, undefined, first));
        getExternalAuthenticationUrl(auth, undefined, second);
        expect(first.authenticationDocumentId).toBe("provider");
        expect(first.nonce).not.toBe(second.nonce);
        expect(url.searchParams.get("state")).toBe(first.nonce);
        expect(url.searchParams.get("client_id")).toBe("provider");
        expect(url.searchParams.get("tenant")).toBe("a&b");
        expect(url.searchParams.get("response_type")).toBe("token");
        expect(url.searchParams.get("redirect_uri")).toBe("opds://authorize/");
    });

    it("preserves the PKCE transaction's complete authorization request", () => {
        const pkce = createOpdsPkceTransaction({ authorizationUrl: "https://example.org/authorize", tokenUrl: "https://example.org/token" });
        expect(getExternalAuthenticationUrl(document("http://opds-spec.org/auth/oauth/authorization-code-pkce", "https://example.org/authorize"), pkce))
            .toBe(pkce.authorizationRequestUrl);
    });

    it.each(["javascript:alert(1)", "data:text/html,login", "file:///login"])("rejects a non-HTTP provider URL %s", url => {
        expect(() => getExternalAuthenticationUrl(document("http://librarysimplified.org/authtype/SAML-2.0", url))).toThrow();
    });
});
