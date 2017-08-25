import { Server } from "r2-streamer-js/dist/es6-es2015/src/http/server";

// Create readium2 streamer
// This streamer is used to stream epub content to the renderer
export const streamer: Server = new Server();
