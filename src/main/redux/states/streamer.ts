import { StreamerStatus } from "readium-desktop/models/streamer";

export interface StreamerState {
    // Base url of started server
    baseUrl: string;

    status: StreamerStatus;

    openPublicationCounter: { [identifier: string]: number };

    publicationManifestUrl: { [identifier: string]: string };
}
