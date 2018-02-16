import { Publication } from "readium-desktop/common/models/publication";
import { Reader, ReaderConfig } from "readium-desktop/common/models/reader";
import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    UserKeyCheckRequest = "LCP_USER_KEY_CHECK_REQUEST",
    UserKeyCheckError = "LCP_USER_KEY_CHECK_ERROR",
    UserKeyCheckSuccess = "LCP_USER_KEY_CHECK_SUCCESS",

    PassphraseSubmitRequest = "LCP_PASSPHRASE_SUBMIT_REQUEST",
    PassphraseSubmitSuccess = "LCP_PASSPHRASE_SUBMIT_SUCCESS",
    PassphraseSubmitError = "LCP_PASSPHRASE_SUBMIT_ERROR",
}

export function checkUserKey(publication: Publication, hint: string): Action {
    return {
        type: ActionType.UserKeyCheckRequest,
        payload: {
            publication,
            hint,
        },
    };
}

export function sendPassphrase(publication: Publication, passphrase: string): Action {
    return {
        type: ActionType.PassphraseSubmitRequest,
        payload: {
            publication,
            passphrase,
        },
    };
}
