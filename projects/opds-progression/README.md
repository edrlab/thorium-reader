# OPDS Progression MVP test server

This project is a loopback-only OPDS 2 server for manually exercising Thorium's OPDS Progression GET and PUT MVP. It serves the published **Accessible EPUB 3** sample and keeps one mutable progression document in memory. Both retrieved and uploaded documents use only the publication-wide `progression` float; `references` are deliberately unsupported.

## Start the server

From the repository root:

```sh
node projects/opds-progression/server.mjs
```

The default catalog URL is:

```text
http://127.0.0.1:4873/opds/v2/catalog.json
```

Pass a port as the first argument to use another one:

```sh
node projects/opds-progression/server.mjs 5000
```

The server binds only to `127.0.0.1`. Stop it with `Ctrl+C`.

## Manual end-to-end flow

1. Start the server.
2. Add `http://127.0.0.1:4873/opds/v2/catalog.json` as an OPDS catalog in Thorium.
3. Download and open **Accessible EPUB 3**.
4. Resolve the initial **Resume from another device?** prompt: cancel it to keep the local position, or choose **Go to position** and then navigate elsewhere.
5. Navigate to a new reading position. After Thorium's upload debounce, inspect the server state:

    ```sh
    curl 'http://127.0.0.1:4873/__test/state'
    ```

6. Verify `requests.progressionPutCount` increased and `requests.lastPutBody` contains `modified`, `device`, and a `progression` float, with no `references`.
7. Close and reopen the publication. The GET route returns the document persisted by PUT.

Each publication has one pending upload and debounce timer, sent only by the reader holding its lock. On lock handoff, the new owner's current position replaces the old owner's pending update. Closing the owning reader cancels its pending uploads; shutdown does not flush them. Wait for the five-second debounce and confirm the PUT before closing when testing synchronization.

Useful boundary values are `0` (start), `0.5` (middle), and `1` (Thorium's safe end position). For EPUBs with a Readium position list, Thorium maps the remote float using the same resource weights as its global reading progression: reflowable resources use positions derived from archive entry lengths, and fixed-layout pages use one position each. The mapping preserves offsets within a resource. Publications without a position list fall back to equal reading-order resource weights. At `1`, Thorium uses an offset of `0.95` in the last resource to avoid trailing blank columns.

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

```sh
curl --request PUT 'http://127.0.0.1:4873/__test/state' \
  --header 'Content-Type: application/json' \
  --data '{"empty":true}'
```

Upload a complete float-only progression document (replace the example timestamp with a value newer than the stored document):

```sh
curl --request PUT 'http://127.0.0.1:4873/progression/accessible-epub-3' \
  --header 'Accept: application/opds-progression+json' \
  --header 'Content-Type: application/opds-progression+json' \
  --data '{"modified":"2026-10-06T12:00:00.000Z","device":{"id":"urn:uuid:4f6da6f7-b592-483d-ac7c-42b80fbeb6dc","name":"Manual Thorium test"},"progression":0.625}'
```

The first upload into empty state returns `201`; a newer upload replacing an existing document returns `200`. The successful response is the stored progression document.

## State controls and failure simulation

Inspect the document, behavior flags, request counters, headers, last PUT body, timestamp, and status:

```sh
curl 'http://127.0.0.1:4873/__test/state'
```

Set the remote float, title, and optionally an explicit ISO 8601 modification time. Omitting `modified` while changing document data uses the current UTC time:

```sh
curl --request PUT 'http://127.0.0.1:4873/__test/state' \
  --header 'Content-Type: application/json' \
  --data '{"progression":0.875,"modified":"2040-01-02T03:04:05.000Z","title":"Updated remote reading position"}'
```

Simulate a successful `200 OK` GET with an empty payload:

```sh
curl --request PUT 'http://127.0.0.1:4873/__test/state' \
  --header 'Content-Type: application/json' \
  --data '{"empty":true}'
```

Lock uploads to exercise the standardized `403 Forbidden` response:

```sh
curl --request PUT 'http://127.0.0.1:4873/__test/state' \
  --header 'Content-Type: application/json' \
  --data '{"locked":true}'
```

Unlock with `{"locked":false}`. To exercise `409 Conflict`, configure a remote `modified` timestamp newer than the timestamp Thorium will upload. Invalid JSON, missing required fields, invalid device data, out-of-range floats, and any `references` property return the standardized `400 Bad Request` Problem Details object.

Reset the document, lock flag, and all request telemetry:

```sh
curl --request POST 'http://127.0.0.1:4873/__test/reset'
```

Delay progression responses by three seconds to test initialization and navigation while retrieval is running:

```sh
curl --request PUT 'http://127.0.0.1:4873/__test/state' \
  --header 'Content-Type: application/json' \
  --data '{"delayMs":3000}'
```

`delayMs` accepts integers from `0` to `120000` milliseconds and defaults to `0`. Use `8000` to exceed Thorium's six-second retrieval timeout. Set it back to `0` to disable the delay.

The delay applies to successful progression GET responses, including empty responses. Catalog downloads, state controls, and error responses remain immediate. Request counters update when the request arrives. Each pending response retains the document and delay captured at request time; changing or resetting state affects subsequent requests. Updating only `delayMs` preserves the document's modification timestamp.

## Debugging Thorium's progression flow

Request and response metadata each occupy one log line. Only the OPDS progression JSON response content is printed below its response line with indentation, showing the exact payload sent to the client. Empty progression responses print `(empty JSON body)`. Other routes and HEAD responses do not log a body.

The test server logs each incoming request and its completion to the terminal. Entries include a request ID, method, path, response status, elapsed milliseconds, and whether the response finished or the client disconnected. Incoming entries also show the `Accept` and `Range` headers. Request bodies, query strings, and authorization headers are omitted. Delayed requests can be correlated by request ID; client timeouts appear as aborted responses.

Enable these existing debug namespaces when launching Thorium (Unix shell):

```sh
DEBUG='readium-desktop:main#services/opdsProgression,readium-desktop:main:redux:sagas:win:reader,readium-desktop:renderer:reader:components:Reader' npx electron .
```

Use an up-to-date built application. Main-process logs appear in the launch terminal; inspect the reader's developer console for renderer logs. The application's normal `DEBUG=*` launch also enables these messages.

Search for `Progression GET` and `OPDS progression:`. The logs trace retrieval eligibility, response timing and validation, local locator changes, timestamp comparisons, prompt suppression or display, dismissal, and accepted navigation. Reader window IDs correlate the main-process decisions. Mapping logs show whether Readium weights or equal-resource fallback were used and the resulting position fields. These application messages are emitted through the `debug` logger; no new unconditional console output is added.

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

```sh
node --test projects/opds-progression/server.test.mjs
```

They verify the feed contract, relative-link resolution, EPUB downloads and ranges, GET and PUT media types, required document fields, the float-only constraint, device persistence, `201` creation, `200` replacement, standardized `400`/`403`/`409` Problem Details, telemetry, empty retrieval, reset behavior, and the `Allow: GET, PUT` contract.

## EPUB fixture

The checked-in `fixtures/accessible_epub_3.epub` is the unchanged release asset from the [EPUB 3 Samples project](https://github.com/IDPF/epub3-samples/releases/download/20230704/accessible_epub_3.epub). It is kept locally so the end-to-end fixture does not depend on network access.

```sh
sha256sum projects/opds-progression/fixtures/accessible_epub_3.epub
```

The expected SHA-256 is `67F75B8E3CD1ABE4BB143D91D5424191D5AF3115C9D26FF029A38E19F8D16FEB`. See `fixtures/NOTICE.md` for provenance, attribution, and licensing information.
