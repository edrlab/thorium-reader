import { Identifiable } from "readium-desktop/common/models/identifiable";

export interface PublicationInfoState {
    publication?: Identifiable;
}

export interface LibraryState {
    publicationInfo: PublicationInfoState;
}
