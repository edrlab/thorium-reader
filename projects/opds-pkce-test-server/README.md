# OPDS Authorization Code with PKCE test server

This dependency-free loopback server exercises the flow proposed in
[opds-community/drafts#100](https://github.com/opds-community/drafts/issues/100).
It is for local development only and does not authenticate real users.

Run it from the repository root:

```powershell
npm run start:opds-pkce-test-server
```

Then add this protected catalog to Thorium:

```text
http://127.0.0.1:49152/opds/v2/catalog
```

The authentication document contains only the proposed flow type and its
required `authenticate` and `refresh` links. The server expects the shared OPDS
client ID `http://opds-spec.org/auth/client`, the callback `opds://authorize/`,
and PKCE `S256`. The `refresh` link targets `/token`, which handles both the
authorization-code exchange and refresh-token grant.

Because this local server uses plain HTTP, only development and CI builds of
Thorium accept its loopback endpoints. Production builds require HTTPS.

Use a different port with an optional argument:

```powershell
node projects\opds-pkce-test-server\server.mjs 49153
```

Run its tests with:

```powershell
npm run test:opds-pkce-test-server
```
