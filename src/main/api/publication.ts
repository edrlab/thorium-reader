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

    public async get(data: any): Promise<PublicationView> {
        const { identifier } = data;
        const doc = await this.publicationRepository.get(identifier);
        return this.publicationViewConverter.convertDocumentToView(doc);
    }

    public async findAll(): Promise<PublicationView[]> {
        const docs = await this.publicationRepository.findAll();
        return docs.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });
    }

    public async findByTag(data: any): Promise<PublicationView[]> {
        const { tag } = data;
        const docs = await this.publicationRepository.findByTag(tag);
        return docs.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });
    }

    public async updateTags(data: any): Promise<PublicationView>  {
        const { identifier, tags } = data;
        const doc = await this.publicationRepository.get(identifier);
        const newDoc = Object.assign(
            {},
            doc,
            { tags },
        );

        await this.publicationRepository.save(newDoc);
        return this.get({ identifier });
    }

    /**
     * List all tags defined in all publications
     *
     */
    public async getAllTags(): Promise<string[]> {
        return this.publicationRepository.getAllTags();
    }

    public async import(data: any): Promise<PublicationView[]> {
        const { paths } = data;
        console.log("#### import", paths);
        // returns all publications linked to this import
        return [];
    }
}
