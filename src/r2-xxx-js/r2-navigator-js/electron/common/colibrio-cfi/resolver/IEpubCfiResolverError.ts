import {EpubCfiResolverErrorType} from './EpubCfiResolverErrorType';

/**
 *
 */
export interface IEpubCfiResolverError {
    documentUrl: URL;
    errorData: any;
    node: Node;
    type: EpubCfiResolverErrorType;
}
