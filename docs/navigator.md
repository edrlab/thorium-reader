# Readium2 "navigator" integration

## Sessions management

Code references:

The `initSessions()` function is defined in the `r2-navigator-js` package:

https://github.com/edrlab/r2-navigator-js/blob/develop/src/electron/main/sessions.ts#L8

The `initSessions()` function is is called **once** from `main.ts`:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main.ts#L22

The `secureSessions()` function is defined in the `r2-navigator-js` package:

https://github.com/edrlab/r2-navigator-js/blob/develop/src/electron/main/sessions.ts

Summary:

The `initSessions()` function installs event handlers related to the Electron app lifecycle (`app.on("ready")` and `app.on("will-quit")`), from which both Electron's general `session.defaultSession` and the navigator-specific "webview" session (obtained via the partition mechanism `session.fromPartition(R2_SESSION_WEBVIEW)`) are managed. This consists in tearing-down temporary memory structures when the application exits. Note that cache and storage data are also cleared when the application starts.

The `secureSessions()` function installs event handlers to deal with HTTPS and self-signed certificates, which naturally do not validate in the normal browser-managed chain.

Caveats / potential todos:

1) Electron's general `session.defaultSession` may need to be managed separately at the application level, so `r2-navigator-js`'s `initSessions()` should probably have a boolean function parameter to opt-out / opt-in.
2) Some "temporary" memory in `session.fromPartition(R2_SESSION_WEBVIEW)` ; such as `localStorage` populated by scripted EPUB3 HTML documents ; may in fact need to be preserved (for example: for interactive publications that store user data / reader preferences).

## BrowserWindow tracking, internal EPUB hyperlinking / navigation events

Code references:

The `trackBrowserWindow()` function is defined in the `r2-navigator-js` package:

https://github.com/edrlab/r2-navigator-js/blob/develop/src/electron/main/browser-window-tracker.ts

The `trackBrowserWindow()` function is invoked every time an Electron `BrowserWindow` is created for the reading activity (i.e. reader views that load HTML documents from EPUB publications):

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/redux/sagas/reader.ts#L19

Summary:

Although the Electron application itself tracks `BrowserWindow` instances (which is necessary to prevent premature garbage collection), the "navigator" backend maintains its own map of loaded windows for a different purpose: to intercept navigation events that are not already handled by link hijackers injected in EPUB content documents. This way, script-activated navigation requests (e.g. `window.location=...`) in HTML documents that are not captured via usual `document.addEventListener()` can be safely intercepted using the Electron API, and redirected into the "navigator" for further processing (i.e. open an external URL, or handle an internal publication URL).

## Globals initialization

The `initGlobals()` function is defined in the `r2-shared-js` package:

https://github.com/edrlab/r2-shared-js/blob/develop/src/init-globals.ts

The `initGlobals()` function is invoked once in the main process, and once for every renderer process:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/streamer.ts#L3

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/renderer/components/ReaderApp.tsx#L53

Summary:

Due to how some data serialization / de-serialization functionality works internally in some of the `r2-xxx-js` APIs (e.g. JSON and XML automatic type mapping), it is necessary to invoke the `initGlobals()` function as soon as a process start (main, renderer(s)).

Caveats / potential todos:

1) A more elegant solution?

## "Streamer" HTTP server

Code references:

The `Server` functionality (class) is defined in the `r2-streamer-js` package:

https://github.com/edrlab/r2-streamer-js/blob/develop/src/http/server.ts

The `Server` class is instantiated once for the DI (Dependency Injection) / IoC (Inversion Of Control) container:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/di.ts#L12

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/streamer.ts#L4

The `Server` instance is managed centrally (start/stop, publication load/unload):

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/redux/sagas/streamer.ts#L9

The `Server` instance is used to query available `r2-shared-js` `Publication` objects (which are subsequently loaded into the reading activity):

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/redux/sagas/reader.ts#L27

Summary:

A single `Server` instance is maintained during the Electron application's lifecycle. It is started when needed, and stopped when no more publications are open. Publications loaded for reading are added to the `Server` instance's own cache (i.e. publication metadata is loaded in memory). Once a given publication has no more open reader, the `Server` instance is instructed to unload it from its internal cache.

Secure HTTPS is used with a self-signed certificate, see the description of `secureSessions()` in this document. Custom HTTP headers are used to limit (but not totally prevent) access from outside the application. Both the server key/certificate pair and the custom HTTP headers are renewed at each server start/stop cycle.

Caveats / potential todos:

1) The HTTP port is currently not randomized. A free port is automatically found, but there is currently no strategy in place to make the port less predictable.

### ReadiumCSS

Code references:

The `setupReadiumCSS()` function is defined in the `r2-navigator-js` package:

https://github.com/edrlab/r2-navigator-js/blob/develop/src/electron/main/readium-css.ts

The `setupReadiumCSS()` function is invoked once from the main process, at the point where the `Server` instance is created:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/streamer.ts#L7

Summary:

The filesystem location of the ReadiumCSS files (e.g. inside the Electron application `asar` bundle, or other development-time location) is used to create a static server route that will be utilized internally by the "navigator" (i.e. when ReadiumCSS gets injected into loaded EPUB HTML content documents).

## EPUB parser

Code references:

The `EpubParsePromise` utility function is defined in the `r2-shared-js` package:

https://github.com/edrlab/r2-shared-js/blob/develop/src/parser/epub.ts

The `EpubParsePromise` function is used to load publication metadata (e.g. title/author, cover image, etc.) when populating the catalog which is used by the library view:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/redux/sagas/collection-manager.ts#L24

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/storage/publication-storage.ts#L8

Summary:

The `EpubParsePromise` function is used internally by the `r2-streamer-js` `Server` to load publication metadata into the server's cache. The Electron app only relies on the streamer / server's runtime when reading views are open, so the `EpubParsePromise` function comes-in handy to populate data for the library view (i.e. when the reading experience hasn't necessarily started yet).

Caveats / potential todos:

1) LCP and LSD (Status Document) processing is currently handled at the point at which a publication is loaded into the reading experience (reader views). It would be good to fetch LCP/LSD-related information at the point at which the library view is instanciated, for example to check lending expiration, rights, etc.

## LCP, LSD

### LCP 1.0 Profile (native `lcp.node` lib)

Code references:

The `setLcpNativePluginPath()` function is defined in the `r2-lcp-js` package:

https://github.com/edrlab/r2-lcp-js/blob/develop/src/parser/epub/lcp.ts#L26

The `setLcpNativePluginPath()` function is invoked once from the main process:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/streamer.ts#L5

Summary:

The Javascript implementation of LCP does not support the 1.0 Profile.
By providing the filesystem location of the native `lcp.node` lib, this ensures that any subsequent decryption attempt will occur through the lib (the Javascript implementation is used as a fallback if the native lib is not found).

Caveats / potential todos:

1) Error codes originating from the native lib are not surfaced in a clean manner through the Javascript API, and into the user experience. In other words, error reporting such as "bad passphrase" or "invalid / expired certificate" is currently not human-friendly.


### LCP and LSD "handler" (IPC events)

Code references:

The `installLcpHandler()` function is defined in the `r2-navigator-js` package:

https://github.com/edrlab/r2-navigator-js/blob/develop/src/electron/main/lcp.ts#L13

The `installLcpHandler()` function is invoked once from the main process:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/streamer.ts#L6

The `R2_EVENT_*` IPC events are used from the reading activity / renderer process:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/renderer/components/ReaderApp.tsx#L34

Summary:

The `installLcpHandler()` function installs IPC Electron events to handle the flow of actions that enables passing a user passphrase (or existing stored digest of a previously-supplied passphrase) from the renderer process (user interface) into the main process (where decryption occurs). This function also installs the LSD-related interactions ("return" and "renew").

Caveats / potential todos:

1) The IPC events (notably, the "return" and "renew" interaction) should be abstracted / hidden from the application via an additional API layer.
2) The passphrase asynchronous interaction should be exposed via a cleaner API, to hide the actual IPC eventing mechanism.

### LSD "background" activity (register and fetch+inject updated LCP license)

The `launchStatusDocumentProcessing()` function is defined in the `r2-lcp-js` package:

https://github.com/edrlab/r2-lcp-js/blob/develop/src/lsd/status-document-processing.ts

The `lsdLcpUpdateInject()` function is defined in the `r2-navigator-js` package:

https://github.com/edrlab/r2-navigator-js/blob/develop/src/electron/main/lsd-injectlcpl.ts

The `launchStatusDocumentProcessing()` function is invoked from the main process each time a publication is loaded into the reading experience:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/redux/sagas/reader.ts#L21

Summary:

The `launchStatusDocumentProcessing()` function initiates a background HTTP activity (with graceful degradation to no-op, in case of network errors, etc.) with the LSD server declared in the LCP license of the loaded publication. The primary tasks are to register the device (if not already done) and to fetch an updated LCP license (if any) in order to inject it into the stored publication. The `lsdLcpUpdateInject()` function automatically refreshes the `Publication` object's internal state in order to reflect the updated LCP data.

### LSD device ID handling

The `IDeviceIDManager` interface is defined in the `r2-lcp-js` package:

https://github.com/edrlab/r2-lcp-js/blob/develop/src/lsd/deviceid-manager.ts

The `deviceIDManager` concrete implementation is defined in the `r2-lcp-js` package:

https://github.com/edrlab/r2-testapp-js/blob/develop/src/electron/main/lsd-deviceid-manager.ts

The `deviceIDManager` utility is currently used from the main process:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/streamer.ts#L8

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/main/redux/sagas/reader.ts#L22

Summary:

The `deviceIDManager` concrete implementation is only used in the Electron app temporarily, until this is fully replaced with an Redux-based "state" representation of the `IDeviceIDManager` interface, possibly (but not necessarily) based on `IStore` (see below).

The `deviceIDManager` concrete implementation currently uses a `StoreElectron` instance to persist its data in the following fashion (to record which LCP-protected publications have already LSD-registered the device ID):

```
{
	"lsd": {
		"deviceID": "DEVICE_UUID",
		"deviceID_PUB-1_LPC_UUID": "DEVICE_UUID",
		"deviceID_PUB-2_LPC_UUID": "DEVICE_UUID"
	}
}
```

Note that `DEVICE_UUID` is randomly-generated when the application first runs, so this would effectively get wiped-out in cases where settings are flushed / application re-installed from scratch. The `PUB-1_LPC_UUID` corresponds to the uuid picked from the actual LCP license, to uniquely identify a given protected publication.

## Persistent data storage (ReadiumCSS / navigator preferences, saved LCP passphrases, LSD registers, etc.)

The `IStore` interface is defined in the `r2-navigator-js` package:

https://github.com/edrlab/r2-navigator-js/blob/develop/src/electron/common/store.ts

The `StoreElectron` concrete implementation is defined in the `r2-testapp-js` package:

https://github.com/edrlab/r2-testapp-js/blob/develop/src/electron/common/store-electron.ts

The `StoreElectron` utility is currently used in the reader view to persist ReadiumCSS and other navigator-related settings:

https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/renderer/components/ReaderApp.tsx#L42

Summary:

The `StoreElectron` concrete implementation is only used in the Electron app temporarily, until this is fully replaced with an Redux-based "state" representation of the `IStore` interface (or other).

For example, the saved LCP passphrases (SHA256 digests) are currently stored in the following fashion:

```
{
	"lcp": {
		"/PATH/TO/book1.epub": {
			"sha": "SHA_256_DIGEST_1"
		},
		"/PATH/TO/book2.epub": {
			"sha": "SHA_256_DIGEST_2"
		},
	}
}
```

## Reader activity (navigator API)

The following functions are defined in the `r2-navigator-js` package: `installNavigatorDOM`, `setReadingLocationSaver`, `setReadiumCssJsonGetter`, `readiumCssOnOff`, `handleLink`, `navLeftOrRight`.

https://github.com/edrlab/r2-navigator-js/blob/develop/src/electron/renderer/index.ts

These "navigator" interactions are used from the reader view (renderer process):
https://github.com/edrlab/readium-desktop/blob/feature/r2-navigator-refactor/src/renderer/components/ReaderApp.tsx

### Initial bootstrap

The `installNavigatorDOM()` function attaches the "navigator"'s viewport (which renders EPUB HTML content documents inside `webview` DOM objects) to the specified HTML element unique ID. The navigator is instantiated with an already-open `Publication` object, its full HTTP `manifest.json` URL, the full path leading to the `preload` script (which is bundled on the application's side, but entirely defined externally in the navigator's scope). The `installNavigatorDOM` function also takes two additional parameters to specify which EPUB spine item to load, and at which reading position / selector to initiate the content viewport (see below).

### ReadiumCSS

The `setReadiumCssJsonGetter()` function specifies a string-returning callback that will be invoked each time a ReadiumCSS update is required (the navigator "pulls" new settings into its environment via this "getter" function). The `readiumCssOnOff()` function can be called by the application at any time (perhaps in a debounced fashion in order to limit rate, as this is an expensive operation) to trigger the navigator's call of the local callback function passed to `setReadiumCssJsonGetter()`.

The returned payload is a `JSON.stringify()` representation of this POJ object (two properties: `injectCSS` and `setCSS`):

```
{
    injectCSS: "yes",
    setCSS: {
        align,
        colCount,
        dark,
        font,
        fontSize,
        invert,
        lineHeight,
        night,
        paged,
        sepia
    }
}
```

The properties of the `setCSS` object are likely to evolve over time, as ReadiumCSS itself is being finalized. Here is a code reference to figure-out allowed values for each field:

https://github.com/edrlab/r2-navigator-js/blob/develop/src/electron/renderer/webview/readium-css.ts#L391

Example:

```
    "align": "left",
    "colCount": "auto",
    "dark": false,
    "font": "DEFAULT",
    "fontSize": "100%",
    "invert": false,
    "lineHeight": "1.5",
    "night": true,
    "paged": false,
    "readiumcss": true,
    "sepia": false
```

The following object resets ReadiumCSS entirely (i.e. removes it from the content viewport). This is useful to "turn off" ReadiumCSS in one simple boolean toggle in the UI:

```
{
    injectCSS: "rollback",
    setCSS: "rollback"
}
```

### Persistence of reading location

The `setReadingLocationSaver()` function sets up a callback from which the "navigator" environment can ask the Electron app to persist (i.e. save in state / store) a tuple of data consisting in a document path within the loaded publication, and a location (currently) expressed as a CSS selector (may become CFI in some future revision). This data tuple is exactly the same as what the `installNavigatorDOM()` function accepts as its last two parameters (which allow starting the reading activity from an initial location). For example: `"EPUB/s04.xhtml"` and `"section#pgepubid00513 > p:nth-child(14)"`.

### Linking (table of contents, etc.)

The `handleLink()` function can be called by the application to instruct the navigator to navigate to a given document and location (both specified via a single URL, including the hash fragment identifier). Typically: `handleLink(href, undefined, false);` where `href` equals (for example): `http://IP:PORT/pub/UUID/manifest.json/../PATH/TO/chapter.html#intro`.

### Page turning

The `navLeftOrRight()` function can be called with a `true` parameter (means "left") or `false` (means "right") to instruct the navigator engine to move left or right respectively in *visual* terms. In other words, a left-arrow button positioned on the left hand side of the screen actually means "turn to the *next* page" if the publication's "page progression direction" is set to RTL (Right To Left). Put simply: the `navLeftOrRight(true)` function call only occurs from the left-arrow button positioned on the left hand side of the screen (the application does not have to compute RTL cases).
