import { injectable} from "inversify";

import { PublicationView } from "readium-desktop/common/views/publication";

import { PublicationViewConverter } from "readium-desktop/main/converter/publication";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

@injectable()
export class PublicationApi {
    private publicationRepository: PublicationRepository;
    private publicationViewConverter: PublicationViewConverter;

    constructor(
        publicationRepository: PublicationRepository,
        publicationViewConverter: PublicationViewConverter,
    ) {
        this.publicationRepository = publicationRepository;
        this.publicationViewConverter = publicationViewConverter;
    }

    public async get(): Promise<PublicationView> {
        const publications = await this.publicationRepository.findAll();
        const doc = publications[0];
        return this.publicationViewConverter.convertDocumentToView(doc);
    }
}
