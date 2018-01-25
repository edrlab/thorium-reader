import { Download } from "readium-desktop/models/download";
import { Publication } from "readium-desktop/models/publication";

export interface PublicationDownloadState {
    // Download identifier => Publication identifier
    downloadIdentifierToPublication: { [identifier: string]: Publication };

    // Publication identifiers => Download identifiers
    publicationIdentifierToDownloads: { [identifier: string]: Download[] };
}
