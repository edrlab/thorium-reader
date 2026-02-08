import {EpubCfiErrorType} from './EpubCfiErrorType';

export class EpubCfiError extends Error {
    constructor(type: EpubCfiErrorType) {
        super(type);
    }
}
