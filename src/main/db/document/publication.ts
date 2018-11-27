import { CustomCover } from "readium-desktop/common/models/custom-cover";
import { File } from "readium-desktop/common/models/file";
import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Tag } from "readium-desktop/common/models/tag";
import { Timestampable } from "readium-desktop/common/models/timestampable";

export interface PublicationDocument extends Identifiable, Timestampable {
    publication: any;
    opdsPublication: any;
    title: string;
    tags?: Tag[];
    files?: File[];
    coverFile?: File;
    customCover?: CustomCover;
}
