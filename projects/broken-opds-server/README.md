# Broken OPDS test server

This local-only server provides real HTTP, TLS, socket, response, and OPDS failures for manual and automated Thorium tests. It binds to `127.0.0.1` by default and does not contact external services.

## Start it

From the repository root:

```sh
npm run test:opds:server
```

The default listeners are:

- HTTP: `http://127.0.0.1:4873`
- HTTPS with an untrusted private test CA: `https://127.0.0.1:4874`

Ports can be changed, or set to `0` to let the operating system select free ports:

```sh
node projects/broken-opds-server/server.mjs --http-port=5000 --https-port=5001
```

## HTTPS-first tests

Use these URLs in Thorium:

```text
opds://127.0.0.1:4873/opds2
opds://127.0.0.1:4874/opds2
```

The first URL points to the plain HTTP listener. Thorium's initial HTTPS attempt therefore produces a real TLS/protocol error, after which a local/private-host HTTP fallback should load the catalog.

The second URL points to the HTTPS listener. Its server certificate is signed by a newly generated private test CA that is not trusted by the operating system. A production-mode Thorium build should report a certificate-validation failure and must not downgrade to HTTP.

Development builds currently disable certificate validation in Thorium's main-process HTTP agent, so use a production-mode build for the invalid-certificate scenario.

## Failure endpoints

Every endpoint is available on both listeners unless the failure inherently depends on the transport.

| Path | Behavior |
| --- | --- |
| `/opds2` | Valid OPDS 2 JSON feed |
| `/opds1` | Valid OPDS 1 Atom feed |
| `/malformed` | Invalid JSON with the OPDS content type |
| `/wrong-content-type` | Valid OPDS JSON declared as `text/plain` |
| `/empty` | Empty `204 No Content` response |
| `/reset` | Destroys the TCP connection without a response |
| `/timeout?ms=90000` | Delays the response for the requested duration |
| `/redirect-loop` | Redirects to itself forever |
| `/redirect-to-http` | Redirects from either listener to the HTTP catalog |
| `/status/500` | Returns an intentional HTTP error; any status from 400 through 599 can be used |
| `/__test-ca.pem` | Returns the temporary test CA certificate |
| `/health` | Returns a small successful health response |

The certificate and key are generated in memory on every start. Nothing is installed in the system trust store and no private key is written to disk.

## Self-test

The self-test opens real sockets and verifies HTTP success, trusted HTTPS success, untrusted-certificate rejection, TLS-to-HTTP protocol failure, and connection reset:

```sh
npm run test:opds:server:selftest
```
