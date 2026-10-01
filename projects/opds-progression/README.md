# OPDS Progression MVP test server

This project is a loopback-only OPDS 2 server for manually exercising Thorium's OPDS Progression GET and PUT MVP. It serves the published **Accessible EPUB 3** sample and keeps one mutable progression document in memory. Both retrieved and uploaded documents use only the publication-wide `progression` float; `references` are deliberately unsupported.

## Start the server

From the repository root:

```powershell
node projects/opds-progression/server.mjs
```

The default catalog URL is:

```text
http://127.0.0.1:4873/opds/v2/catalog.json
```

Pass a port as the first argument to use another one:

```powershell
node projects/opds-progression/server.mjs 5000
```

The server binds only to `127.0.0.1`. Stop it with `Ctrl+C`.

## Manual end-to-end flow

1. Start the server.
2. Add `http://127.0.0.1:4873/opds/v2/catalog.json` as an OPDS catalog in Thorium.
3. Download and open **Accessible EPUB 3**.
4. Resolve the initial **Resume from another device?** prompt: cancel it to keep the local position, or choose **Go to position** and then navigate elsewhere.
5. Navigate to a new reading position. After Thorium's upload debounce, inspect the server state:

    ```powershell
    Invoke-RestMethod http://127.0.0.1:4873/__test/state | ConvertTo-Json -Depth 8
    ```

6. Verify `requests.progressionPutCount` increased and `requests.lastPutBody` contains `modified`, `device`, and a `progression` float, with no `references`.
7. Close and reopen the publication. The GET route returns the document persisted by PUT.

The exact reading-order resource represented by a float depends on the publication. Useful boundary values are `0` (start), `0.5` (middle), and `1` (Thorium's safe end position).

GET and PUT require this response media type:

```http
Accept: application/opds-progression+json
```

PUT additionally requires:

```http
Content-Type: application/opds-progression+json
```

A missing or incorrect `Accept` returns `406`; an incorrect PUT `Content-Type` returns `415`. Error responses use `application/problem+json`.

## Direct PUT example

Clear the stored document so that the next valid upload creates it with `201 Created`:

```powershell
Invoke-RestMethod `
  -Method Put `
  -ContentType "application/json" `
  -Uri "http://127.0.0.1:4873/__test/state" `
  -Body '{"empty":true}'
```

Upload a complete float-only progression document:

```powershell
$headers = @{ Accept = "application/opds-progression+json" }
$body = @{
  modified = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'")
  device = @{
    id = "urn:uuid:4f6da6f7-b592-483d-ac7c-42b80fbeb6dc"
    name = "Manual Thorium test"
  }
  progression = 0.625
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Put `
  -Headers $headers `
  -ContentType "application/opds-progression+json" `
  -Uri "http://127.0.0.1:4873/progression/accessible-epub-3" `
  -Body $body
```

The first upload into empty state returns `201`; a newer upload replacing an existing document returns `200`. The successful response is the stored progression document.

## State controls and failure simulation

Inspect the document, behavior flags, request counters, headers, last PUT body, timestamp, and status:

```powershell
Invoke-RestMethod http://127.0.0.1:4873/__test/state | ConvertTo-Json -Depth 8
```

Set the remote float, title, and optionally an explicit ISO 8601 modification time. Omitting `modified` while changing document data uses the current UTC time:

```powershell
Invoke-RestMethod `
  -Method Put `
  -ContentType "application/json" `
  -Uri "http://127.0.0.1:4873/__test/state" `
  -Body '{"progression":0.875,"modified":"2040-01-02T03:04:05.000Z","title":"Updated remote reading position"}'
```

Simulate a successful `200 OK` GET with an empty payload:

```powershell
Invoke-RestMethod `
  -Method Put `
  -ContentType "application/json" `
  -Uri "http://127.0.0.1:4873/__test/state" `
  -Body '{"empty":true}'
```

Lock uploads to exercise the standardized `403 Forbidden` response:

```powershell
Invoke-RestMethod `
  -Method Put `
  -ContentType "application/json" `
  -Uri "http://127.0.0.1:4873/__test/state" `
  -Body '{"locked":true}'
```

Unlock with `{"locked":false}`. To exercise `409 Conflict`, configure a remote `modified` timestamp newer than the timestamp Thorium will upload. Invalid JSON, missing required fields, invalid device data, out-of-range floats, and any `references` property return the standardized `400 Bad Request` Problem Details object.

Reset the document, lock flag, and all request telemetry:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:4873/__test/reset
```

## Routes

| Method        | Route                            | Purpose                                                               |
| ------------- | -------------------------------- | --------------------------------------------------------------------- |
| `GET`, `HEAD` | `/opds/v2/catalog.json`          | OPDS 2 catalog with relative acquisition and progression links        |
| `GET`, `HEAD` | `/assets/accessible_epub_3.epub` | Offline EPUB download with byte-range support                         |
| `GET`, `PUT`  | `/progression/accessible-epub-3` | Retrieve, create, or replace the float-only OPDS Progression document |
| `GET`, `PUT`  | `/__test/state`                  | Inspect or mutate in-memory document, flags, and telemetry            |
| `POST`        | `/__test/reset`                  | Restore defaults and clear request telemetry                          |

## Contract tests

Run the server tests from the repository root:

```powershell
node --test projects/opds-progression/server.test.mjs
```

They verify the feed contract, relative-link resolution, EPUB downloads and ranges, GET and PUT media types, required document fields, the float-only constraint, device persistence, `201` creation, `200` replacement, standardized `400`/`403`/`409` Problem Details, telemetry, empty retrieval, reset behavior, and the `Allow: GET, PUT` contract.

## EPUB fixture

The checked-in `fixtures/accessible_epub_3.epub` is the unchanged release asset from the [EPUB 3 Samples project](https://github.com/IDPF/epub3-samples/releases/download/20230704/accessible_epub_3.epub). It is kept locally so the end-to-end fixture does not depend on network access.

```powershell
Get-FileHash projects/opds-progression/fixtures/accessible_epub_3.epub -Algorithm SHA256
```

The expected SHA-256 is `67F75B8E3CD1ABE4BB143D91D5424191D5AF3115C9D26FF029A38E19F8D16FEB`. See `fixtures/NOTICE.md` for provenance, attribution, and licensing information.
