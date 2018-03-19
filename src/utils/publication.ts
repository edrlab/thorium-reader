import { Publication } from "readium-desktop/common/models/publication";

export function lcpReadable(publication: Publication): boolean {
    return (!publication.lcp ||
        (publication.lcp && !publication.lcp.rights.end) ||
        (publication.lcp && publication.lcp.rights.end && new Date(publication.lcp.rights.end).getTime() > Date.now()));
}
