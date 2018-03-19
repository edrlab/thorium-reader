import { UserKeyCheckStatus } from "readium-desktop/common/models/lcp";
import { Publication } from "readium-desktop/common/models/publication";
import {
    Reader, ReaderConfig,
} from "readium-desktop/common/models/reader";

interface UserKeyCheck {
    hint: string;
    publication: Publication;
    status: UserKeyCheckStatus;
}

export interface LcpState {
    lastUserKeyCheck?: UserKeyCheck;
    lastUserKeyCheckDate?: number;
}
