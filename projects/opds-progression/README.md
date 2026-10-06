# OPDS Progression MVP test server

This project is a loopback-only OPDS 2 server for manually exercising Thorium's GET-only progression MVP. It serves the published **Accessible EPUB 3** sample and a mutable progression document that contains only the total `progression` float—there is deliberately no `references` property.

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
3. Download **Accessible EPUB 3** from the catalog.
4. Open it, navigate to a local position, and close the reader. This establishes a local locator timestamp.
5. Set a newer remote progression while the reader is closed. Omitting `modified` makes the server use the current UTC time:

    ```sh
    curl --request PUT 'http://127.0.0.1:4873/__test/state' \
      --header 'Content-Type: application/json' \
      --data '{"progression":0.625,"title":"Remote reading position"}'
    ```

6. Reopen the publication. Thorium should retrieve the newer document without delaying reader startup and offer to use the remote position.
7. Accept the remote position. Thorium should move to the point represented by `0.625` across the publication's reading order.

Useful boundary values are `0` (start), `0.5` (middle), and `1` (Thorium's safe end position). For EPUBs with a Readium position list, Thorium maps the remote float using the same resource weights as its global reading progression: reflowable resources use positions derived from archive entry lengths, and fixed-layout pages use one position each. The mapping preserves offsets within a resource. Publications without a position list fall back to equal reading-order resource weights. At `1`, Thorium uses an offset of `0.95` in the last resource to avoid trailing blank columns.

The progression endpoint intentionally requires this request header:

```http
Accept: application/opds-progression+json
```

A missing header returns `406`, making incorrect MVP requests visible during manual testing.

## State controls

Inspect the current response state and request counters:

```sh
curl 'http://127.0.0.1:4873/__test/state'
```

Set the float, title, and optionally an explicit ISO 8601 modification time:

```sh
curl --request PUT 'http://127.0.0.1:4873/__test/state' \
  --header 'Content-Type: application/json' \
  --data '{"progression":0.875,"modified":"2040-01-02T03:04:05.000Z","title":"Updated remote reading position"}'
```

Simulate a successful `200 OK` with an empty payload:

```sh
curl --request PUT 'http://127.0.0.1:4873/__test/state' \
  --header 'Content-Type: application/json' \
  --data '{"empty":true}'
```

Delay progression responses by three seconds to test initialization and navigation while retrieval is running:

```sh
curl --request PUT 'http://127.0.0.1:4873/__test/state' \
  --header 'Content-Type: application/json' \
  --data '{"delayMs":3000}'
```

`delayMs` accepts integers from `0` to `120000` milliseconds and defaults to `0`. Use `8000` to exceed Thorium's six-second retrieval timeout. Set it back to `0` to disable the delay.

The delay applies to successful progression GET responses, including empty responses. Catalog downloads, state controls, and error responses remain immediate. Request counters update when the request arrives. Each pending response retains the document and delay captured at request time; changing or resetting state affects subsequent requests. Updating only `delayMs` preserves the document's modification timestamp.

Reset the document, delay, and request counters:

```sh
curl --request POST 'http://127.0.0.1:4873/__test/reset'
```

Invalid, non-finite, negative, or greater-than-one progression values are rejected with `400 Bad Request`. The progression resource itself is GET-only; PUT returns `405 Method Not Allowed` because uploads are outside this MVP.

## Debugging Thorium's progression flow

The test server logs each incoming request and its completion to the terminal. Entries include a request ID, method, path, response status, elapsed milliseconds, and whether the response finished or the client disconnected. Incoming entries also show the `Accept` and `Range` headers. Request bodies, query strings, and authorization headers are omitted. Delayed requests can be correlated by request ID; client timeouts appear as aborted responses.

Enable these existing debug namespaces when launching Thorium (Unix shell):

```sh
DEBUG='readium-desktop:main#services/opdsProgression,readium-desktop:main:redux:sagas:win:reader,readium-desktop:renderer:reader:components:Reader' npx electron .
```

Use an up-to-date built application. Main-process logs appear in the launch terminal; inspect the reader's developer console for renderer logs. The application's normal `DEBUG=*` launch also enables these messages.

Search for `Progression GET` and `OPDS progression:`. The logs trace retrieval eligibility, response timing and validation, local locator changes, timestamp comparisons, prompt suppression or display, dismissal, and accepted navigation. Reader window IDs correlate the main-process decisions. Mapping logs show whether Readium weights or equal-resource fallback were used and the resulting position fields. These application messages are emitted through the `debug` logger; no new unconditional console output is added.

## Routes

| Method        | Route                            | Purpose                                                           |
| ------------- | -------------------------------- | ----------------------------------------------------------------- |
| `GET`, `HEAD` | `/opds/v2/catalog.json`          | OPDS 2 catalog with relative acquisition and progression links    |
| `GET`, `HEAD` | `/assets/accessible_epub_3.epub` | Offline EPUB download with byte-range support                     |
| `GET`         | `/progression/accessible-epub-3` | Float-only OPDS Progression document or configured empty response |
| `GET`, `PUT`  | `/__test/state`                  | Inspect or mutate in-memory test state                            |
| `POST`        | `/__test/reset`                  | Restore defaults and clear request counters                       |

## Contract tests

Run the server tests from the repository root:

```sh
node --test projects/opds-progression/server.test.mjs
```

They verify the feed contract, relative-link resolution, EPUB download and byte ranges, the required `Accept` header, float-only response shape, state mutation, empty payloads, validation, reset behavior, and the GET-only progression endpoint.

## EPUB fixture

The checked-in `fixtures/accessible_epub_3.epub` is the unchanged release asset from the [EPUB 3 Samples project](https://github.com/IDPF/epub3-samples/releases/download/20230704/accessible_epub_3.epub). It is kept locally so the end-to-end fixture does not depend on network access.

```sh
sha256sum projects/opds-progression/fixtures/accessible_epub_3.epub
```

The expected SHA-256 is `67F75B8E3CD1ABE4BB143D91D5424191D5AF3115C9D26FF029A38E19F8D16FEB`. See `fixtures/NOTICE.md` for provenance, attribution, and licensing information.
