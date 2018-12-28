import { Locator, LocatorType } from "readium-desktop/common/models/locator";

import { IdentifiableView } from "./base";

export interface LocatorView {
    identifier: string;
    locator: Locator;
    locatorType: LocatorType;
    publication: IdentifiableView;
}
