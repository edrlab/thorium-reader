import { ok } from "assert";
import { inject, injectable } from "inversify";
import { IBrowserApi } from "readium-desktop/common/api/interface/browser.interface";
import { IBrowserResultView, THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import { contentTypeisApiProblem, parseContentType } from "readium-desktop/utils/contentType";
import { diSymbolTable } from "../diSymbolTable";
import { httpGet } from "../network/http";
import { OpdsService } from "../services/opds";
import * as debug_ from "debug";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { IOpdsProblemDetailsResultView, IOpdsResultView } from "readium-desktop/common/views/opds";

// Logger
const debug = debug_("readium-desktop:main#services/browser");

const checkUrl = (url: string) => {
    try {
        if (new URL(url).protocol === "opds:") {
            url = url.replace("opds://", "http://");
        }
    } catch (e) {
        throw new Error(`Not a valid URL ${e.message || e}`);
    }
    return url;
};

@injectable()
export class BrowserApi implements IBrowserApi {

    @inject(diSymbolTable["opds-service"])
    private readonly opdsService!: OpdsService;

    public async browse(url: string): Promise<THttpGetBrowserResultView> {
        url = checkUrl(url);

        const result = httpGet<IBrowserResultView>(
            url,
            undefined,
            async (data) => {
                const {
                    url: _baseUrl,
                    contentType: _contentType,
                    statusMessage, isFailure,
                    isNetworkError,
                    isAbort,
                    isTimeout,
                } = data;

                const baseUrl = `${_baseUrl}`;
                const contentType = parseContentType(_contentType);

                // parse Problem details and return
                if (contentTypeisApiProblem(contentType)) {
                    const json = await data.response.json();
                    const {
                        type,
                        title,
                        status,
                        detail,
                        instance,
                    } = json as IOpdsProblemDetailsResultView;
                    data.data = {
                        problemDetails: {
                            type: typeof type === "string" ? type : undefined,
                            title: typeof title === "string" ? title : undefined,
                            status: typeof status === "number" ? status : undefined,
                            detail: typeof detail === "string" ? detail : undefined,
                            instance: typeof instance === "string"? instance: undefined,
                        },
                    };
                    return data;
                }

                // parse OPDS and return
                const dataFromOpdsParser = await this.opdsService.opdsRequestTransformer(data as IHttpGetResult<IOpdsResultView>);
                if (dataFromOpdsParser) {
                    data.data = {
                        opds: dataFromOpdsParser,
                    };
                    return data;
                }

                // Failed :

                ok(data.isSuccess, `message: ${statusMessage} | url: ${baseUrl} | type: ${_contentType} | code: ${+isFailure}${+isNetworkError}${+isAbort}${+isTimeout}`);

                debug(`unknown url content-type : ${baseUrl} - ${contentType}`);
                throw new Error(
                    `Not a valid OPDS HTTP Content-Type for ${baseUrl} (${contentType})`,
                );
            },
        );
        return result;
    }
}
