// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as debug_ from "debug";
import * as moment from "moment";
import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylePublication from "readium-desktop/renderer/assets/styles/publicationInfos.scss";

import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationLcp: Partial<Pick<PublicationView, "lcp" | "lcpRightsCopies">>;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

// Logger
const debug = debug_("readium-desktop:renderer:publication-info:lcp-info");

class LcpInfo extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render() {

        const { publicationLcp, __ } = this.props;

        const locale = this.props.translator.getLocale();
        // https://momentjs.com/docs/#/displaying/
        moment.locale(locale);

        const lcp = publicationLcp.lcp;

        if (!lcp) {
            return (<></>);
        }

        const lcpRightsPrint = (lcp?.rights?.print) ? lcp.rights.print : 0;
        const lcpRightsCopy = (lcp?.rights?.copy) ? lcp.rights.copy : 0;
        const lcpRightsCopies = publicationLcp.lcpRightsCopies ?? 0;

        const lcpRightsStartDate = (lcp?.rights?.start) ? lcp.rights.start : undefined;
        let lcpRightsStartDateStr: string | undefined;
        if (lcpRightsStartDate) {
            try {
                lcpRightsStartDateStr = moment(lcpRightsStartDate).format("LLL");
            } catch (err) {
                debug(err);
                lcpRightsStartDateStr = lcpRightsStartDate;
            }
        }

        const lcpRightsEndDate = (lcp?.rights?.end) ? lcp.rights.end : undefined;
        let lcpRightsEndDateStr: string | undefined;
        if (lcpRightsEndDate) {
            try {
                lcpRightsEndDateStr = moment(lcpRightsEndDate).format("LLL");
            } catch (err) {
                debug(err);
                lcpRightsEndDateStr = lcpRightsEndDate;
            }
        }

        // TODO: fix r2-lcp-js to handle encrypted fields
        // (need lcp.node with userkey decrypt, not contentkey):
        // if (lcp && lcp.r2LCPBase64) {
        //     const r2LCPStr = Buffer.from(lcp.r2LCPBase64, "base64").toString("utf-8");
        //     const r2LCPJson = JSON.parse(r2LCPStr);
        //     const r2LCP = TaJsonDeserialize(r2LCPJson, LCP);
        //     r2LCP.JsonSource = r2LCPStr;

        //     console.log(r2LCP.User.Name);
        //     console.log(r2LCP.User.Email);
        //     console.log(JSON.stringify(r2LCP.User.Encrypted, null, 4));
        // }

        const lsdOkay = lcp &&
            lcp.lsd &&
            lcp.lsd.lsdStatus;

        const lsdStatus = lsdOkay &&
            lcp.lsd.lsdStatus.status ?
            lcp.lsd.lsdStatus.status : undefined;

        return (
            <>
                <div className={stylePublication.publicationInfo_heading}>
                    <h4>LCP</h4>
                </div>
                <div className={classNames(stylesBookDetailsDialog.allowUserSelect)}>
                    {(lsdStatus &&
                        (lsdStatus !== StatusEnum.Active && lsdStatus !== StatusEnum.Ready)) && <>
                            <span className={stylesGlobal.color_red}>
                                {
                                    (lsdStatus === StatusEnum.Expired ?
                                        __("publication.expiredLcp")
                                        :
                                        ((lsdStatus === StatusEnum.Cancelled) ?
                                            __("publication.cancelledLcp")
                                            :
                                            ((lsdStatus === StatusEnum.Revoked) ?
                                                __("publication.revokedLcp")
                                                :
                                                (lsdStatus === StatusEnum.Returned ?
                                                    __("publication.returnedLcp")
                                                    :
                                                    `LCP LSD: ${lsdStatus}`
                                                )
                                            )
                                        )
                                    )
                                }
                            </span>
                            <br /><br />
                        </>
                    }

                    {lcpRightsStartDateStr && <>
                        <strong>{__("publication.lcpStart")}: </strong><span>{lcpRightsStartDateStr}</span>
                        <br />
                    </>}

                    {lcpRightsEndDateStr && <>
                        <strong>{__("publication.lcpEnd")}: </strong><span>{lcpRightsEndDateStr}</span>
                        <br />
                        <br />
                    </>}

                    {lcpRightsCopy ? <>
                        <strong>{__("publication.lcpRightsCopy")}: </strong>
                        <span>{lcpRightsCopies} / {lcpRightsCopy}</span><br />
                    </> : undefined}

                    {lcpRightsPrint ? <>
                        <strong>{__("publication.lcpRightsPrint")}: </strong>
                        <span>0 / {lcpRightsPrint}</span><br />
                    </> : undefined}
                </div>
            </>
        );
    }

}

export default withTranslator(LcpInfo);
