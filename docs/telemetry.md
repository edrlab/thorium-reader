# Telemetry, analytics

For an end-user explanation of collected data, local storage, and the scope of the telemetry setting, see [Telemetry and privacy](../README.md#telemetry-and-privacy).

Firebase / GA4 Measurement Protocol support is configured at build time with environment variables consumed by `webpack.config-preprocessor-directives.js`. It is disabled by default. The in-app "Disable telemetry measurements" setting prevents new usage events from being queued; it does not stop delivery of previously queued events or disable the separate EDRLab startup reports.

Boolean flags are enabled by any value except `0` or `false`.

| Environment variable | Purpose |
| --- | --- |
| `THORIUM_FIREBASE_ENABLED` | Enables Firebase / GA4 Measurement Protocol telemetry. Defaults to disabled. |
| `THORIUM_FIREBASE_DEBUG` | Sends Measurement Protocol requests to the debug validation endpoint. Defaults to disabled. |
| `THORIUM_FIREBASE_MEASUREMENT_ID` | GA4 measurement ID. Required when Firebase telemetry is enabled. |
| `THORIUM_FIREBASE_MEASUREMENT_PROTOCOL_API_SECRET` | GA4 Measurement Protocol API secret. Required when Firebase telemetry is enabled; keep it in main-process build environments only. |
| `THORIUM_FIREBASE_MEASUREMENT_PROTOCOL_ENDPOINT` | Optional collection endpoint override. Defaults to `https://www.google-analytics.com/mp/collect`. |
| `THORIUM_FIREBASE_MEASUREMENT_PROTOCOL_DEBUG_ENDPOINT` | Optional debug endpoint override. Defaults to `https://www.google-analytics.com/debug/mp/collect`. |
| `THORIUM_FIREBASE_MEASUREMENT_PROTOCOL_QUEUE_SQLITE_ENABLED` | Uses SQLite instead of the JSON file store for the persistent Measurement Protocol queue. Defaults to disabled. |
