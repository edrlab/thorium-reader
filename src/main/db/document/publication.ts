import { CustomCover } from "readium-desktop/common/models/custom-cover";
import { File } from "readium-desktop/common/models/file";
import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Tag } from "readium-desktop/common/models/tag";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { OPDSPublication } from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-publication";

interface Resources {
    filePublication: string;
    opdsPublication: string;
}

export interface PublicationDocument extends Identifiable, Timestampable {
    resources: Resources;
    opdsPublication: any;
    title: string;
    tags?: string[];
    files?: File[];
    coverFile?: File;
    customCover?: CustomCover;
}
