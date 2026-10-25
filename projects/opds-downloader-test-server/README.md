# Slow OPDS / RWPM downloader test server

Minimal, dependency-free local server for testing [PR #4090](https://github.com/edrlab/thorium-reader/pull/4090): per-file progress within parallel download batches.

```sh
npm run start:opds-downloader-test-server
```

1. Add `http://127.0.0.1:4875/opds.json` as a catalog in Thorium.
2. Download **Slow download 1**. Its RWPM (`application/webpub+json`) lists six fake XHTML chapters and a small stylesheet. Thorium downloads the chapters in parallel and packages them as a web publication.
3. Open the downloads panel to inspect individual file progress, sizes, and speeds. Chapters have different sizes (2–7 MiB) and stream at about 128 KiB/s each, taking roughly 16–56 seconds.
4. Download publications **2** and **3** while the first is running to test parallel batches. Cancel a batch while another runs, then retry it.
5. Watch the terminal's `START`, `DONE`, and `ABORT` messages and active transfer count. After completion, open the publication to check that import succeeded.

The server responds to HEAD immediately with the same content length as GET. Slow GET responses send actual bytes in timed chunks, so download progress advances throughout the transfer. Closing a connection stops its timer. Content is generated in memory without fixture files, external services, or app changes. The server binds to `127.0.0.1`; stop it with Ctrl+C.

To make downloads longer or change their size/count:

```sh
CHUNK_DELAY_MS=1000 RESOURCE_COUNT=12 RESOURCE_MIB=4 PORT=5000 npm run start:opds-downloader-test-server
```

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `4875` | Local server port |
| `RESOURCE_COUNT` | `6` | Slow chapters per publication (1–100) |
| `RESOURCE_MIB` | `2` | First chapter's size in MiB (1–1024); each next chapter adds 1 MiB |
| `CHUNK_DELAY_MS` | `250` | Delay between 32 KiB chunks (1–60000 ms) |

This fixture exercises successful transfers and cancellation. It serves no authentication, injected failures, or range/resume support.
