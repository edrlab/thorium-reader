import * as i18n from "i18next";
import { injectable} from "inversify";

import * as enCatalog from "readium-desktop/resources/locales/en.json";
import * as frCatalog from "readium-desktop/resources/locales/fr.json";

i18n.init({
    resources: {
        en: {
            translation: enCatalog,
        },
        fr: {
            translation: frCatalog,
        },
    },
});

@injectable()
export class Translator {
    private locale: string = "en";

    public getLocale(): string {
        return this.locale;
    }

    public setLocale(locale: string) {
        this.locale = locale;
    }

    public translate(message: string): string {
        if (i18n.language !== this.locale) {
            i18n.changeLanguage(this.locale);
        }

        return i18n.t(message);
    }
}
