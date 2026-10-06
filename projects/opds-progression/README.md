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

Reset the document and request counters:

```sh
curl --request POST 'http://127.0.0.1:4873/__test/reset'
```

Invalid, non-finite, negative, or greater-than-one progression values are rejected with `400 Bad Request`. The progression resource itself is GET-only; PUT returns `405 Method Not Allowed` because uploads are outside this MVP.

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
