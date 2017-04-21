import * as i18n from "i18next";
import { injectable} from "inversify";

import * as enCatalog from "../resources/locales/en.json";
import * as frCatalog from "../resources/locales/fr.json";

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
        i18n.changeLanguage(this.locale);
    }

    public translate(message: string): string {
        return i18n.t(message);
    }
}
