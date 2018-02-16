import { Publication } from "readium-desktop/common/models/publication";
import { Reader, ReaderConfig } from "readium-desktop/common/models/reader";
import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    PassphraseRequest = "PASSPHRASE_REQUEST",
    PassphraseSuccess = "PASSPHRASE_SUCCESS",
    PassphraseError = "PASSPHRASE_ERROR",
}

export function sendPassphrase(passphrase: string): Action {
    return {
        type: ActionType.PassphraseRequest,
        payload: {
            passphrase,
        },
    };
}
