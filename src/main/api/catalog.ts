import { injectable} from "inversify";

import { CatalogView, CatalogEntryView } from "readium-desktop/common/views/catalog";

import { Translator } from "readium-desktop/common/services/translator";

import { CatalogConfig } from "readium-desktop/main/db/document/config";

import { PublicationViewConverter } from "readium-desktop/main/converter/publication";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";

export const CATALOG_CONFIG_ID = "catalog";

@injectable()
export class CatalogApi {
    private publicationRepository: PublicationRepository;
    private configRepository: ConfigRepository;
    private publicationViewConverter: PublicationViewConverter;
    private translator: Translator;

    constructor(
        publicationRepository: PublicationRepository,
        configRepository: ConfigRepository,
        publicationViewConverter: PublicationViewConverter,
        translator: Translator,
    ) {
        this.publicationRepository = publicationRepository;
        this.configRepository = configRepository;
        this.publicationViewConverter = publicationViewConverter;
        this.translator = translator;
    }

    public async get(): Promise<CatalogView> {
        const __ = this.translator.translate.bind(this.translator);
        const publications = await this.publicationRepository.findAll();
        const publicationViews = publications.map((doc) => {
            return this.publicationViewConverter.convertDocumentToView(doc);
        });

        // FIXME: Currently only returns one entry
        return {
            entries: [
                {
                    title: __("catalog.entry.lastAdditions"),
                    totalCount: publicationViews.length,
                    publications: publicationViews,
                },
            ],
        };
    }

    public async addEntry(data: any): Promise<CatalogEntryView[]> {
        const entryView = data.entry as CatalogEntryView;
        const config = await this.configRepository.get(CATALOG_CONFIG_ID);
        const catalog = config.value as CatalogConfig;
        const entries = catalog.entries;

        entries.push({
            title: entryView.title,
            tag: entryView.tag,
        });

        await this.configRepository.save({
            identifier: CATALOG_CONFIG_ID,
            value: { entries },
        });
        return this.getEntries();
    }

    /**
     * Returns entries without publications
     */
    public async getEntries(): Promise<CatalogEntryView[]> {
        let config = null;

        try {
            config = await this.configRepository.get(CATALOG_CONFIG_ID);
        } catch (error) {
            return [];
        }

        const catalog = config.value as CatalogConfig;
        const entryViews: CatalogEntryView[] = catalog.entries.map((entry: any) => {
            return {
                title: entry.title,
                tag: entry.tag,
                totalCount: 2,
            };
        });

        return entryViews;
    }

    public async updateEntries(data: any): Promise<CatalogEntryView[]> {
        const entryViews = data.entries as CatalogEntryView[];
        const entries = entryViews.map((view) => {
            return {
                title: view.title,
                tag: view.tag,
            };
        });
        const catalogConfig: CatalogConfig = {
            entries,
        };

        await this.configRepository.save({
            identifier: CATALOG_CONFIG_ID,
            value: catalogConfig,
        });
        return this.getEntries();
    }
}
