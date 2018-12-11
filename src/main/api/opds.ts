import { injectable} from "inversify";

import { OpdsFeedView } from "readium-desktop/common/views/opds";

import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";

import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";

@injectable()
export class OpdsApi {
    private opdsFeedRepository: OpdsFeedRepository;
    private opdsFeedViewConverter: OpdsFeedViewConverter;

    constructor(
        opdsFeedRepository: OpdsFeedRepository,
        opdsFeedViewConverter: OpdsFeedViewConverter,
    ) {
        this.opdsFeedRepository = opdsFeedRepository;
        this.opdsFeedViewConverter = opdsFeedViewConverter;
    }

    public async getFeed(data: any): Promise<OpdsFeedView> {
        const { identifier } = data;
        const doc = await this.opdsFeedRepository.get(identifier);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async deleteFeed(data: any): Promise<void> {
        const { identifier } = data;
        await this.opdsFeedRepository.delete(identifier);
    }

    public async findAllFeeds(): Promise<OpdsFeedView[]> {
        const docs = await this.opdsFeedRepository.findAll();
        return docs.map((doc) => {
            return this.opdsFeedViewConverter.convertDocumentToView(doc);
        });
    }

    public async addFeed(data: any): Promise<OpdsFeedView> {
        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async updateFeed(data: any): Promise<OpdsFeedView> {
        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }
}
