# OPDS Authorization Code + PKCE Test Server

This is a dependency-free, local-only development server for testing an OPDS
client's OAuth 2.0 Authorization Code flow with PKCE. It is not intended for
production use and does not authenticate real users.

The current OPDS Authentication 1.0 draft does not define Authorization Code
+ PKCE. This server uses the following proposed extension type for integration
testing:

```text
http://opds-spec.org/auth/oauth/authorization-code-pkce
```

The token endpoint uses the local integration link relation:

```text
token
```

The authentication type and the `token` relation are not part of the published
OPDS Authentication 1.0 draft. If the OPDS community adopts a different
discovery contract, update the server relation and the client's `LINK_TYPE`
mapping together.

The client validates the advertised OAuth authorization-server metadata before
starting authorization. The metadata issuer must match the OPDS authentication
document, both endpoint links must match the metadata, `S256` and authorization
response issuer identification must be supported, and callbacks must contain a
matching `iss` value.

## Run

From the repository root:

```powershell
npm run start:opds-pkce-test-server
```

The server listens only on `127.0.0.1`. Open:

```text
http://127.0.0.1:49152/
```

Add the protected catalog to Thorium:

```text
http://127.0.0.1:49152/opds/v2/catalog
```

When the authorization page opens in the system browser, select **Authorize**.
The default callback URI is `opds://authorize/`.

## Configuration

The optional first command-line argument changes the port:

```powershell
node projects\opds-pkce-test-server\server.mjs 49153
```

The direct-run server also supports:

```text
OPDS_PKCE_PORT
OPDS_PKCE_CLIENT_ID
OPDS_PKCE_REDIRECT_URI
```

For browser-only inspection, set `OPDS_PKCE_REDIRECT_URI` to
`http://127.0.0.1:49152/callback`. For Thorium integration, leave the default
`opds://authorize/` URI.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `/auth` | Public OPDS Authentication Document |
| `/.well-known/oauth-authorization-server` | OAuth Authorization Server Metadata |
| `/authorize` | Authorization UI and code issuance |
| `/token` | Authorization-code exchange and refresh-token grant |
| `/opds/v2/catalog` | Protected OPDS 2 feed |
| `/publication.txt` | Protected acquisition test resource |
| `/health` | Health status and in-memory object counts |

Authorization codes are single-use and expire after two minutes. The token
endpoint requires PKCE `S256`, rejects a non-empty `client_secret`, and removes
an authorization code after the first exchange attempt. All state is in memory
and is discarded when the process exits.

## Automated Test

```powershell
npm run test:opds-pkce-test-server
```

The test covers metadata and issuer discovery, denial, failed PKCE verification,
code replay, successful token exchange, bearer access to the OPDS feed and
acquisition, and refresh-token use.
