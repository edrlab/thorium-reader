import {EpubCfiResolverErrorType} from './EpubCfiResolverErrorType.js';

/**
 *
 */
export interface IEpubCfiResolverError {
    documentUrl: URL;
    errorData: any;
    node: Node;
    type: EpubCfiResolverErrorType;
}
