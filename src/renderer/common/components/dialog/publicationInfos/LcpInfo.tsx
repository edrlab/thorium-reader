// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylePublication from "readium-desktop/renderer/assets/styles/publicationInfos.scss";

import classNames from "classnames";
import * as moment from "moment";
import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import { formatTime } from "readium-desktop/common/utils/time";
import { connect } from "react-redux";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { TranslatorProps, withTranslator } from "../../hoc/translator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationLcp: Partial<Pick<PublicationView, "lcp" | "lcpRightsCopies" | "lcpRightsPrints">>;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class LcpInfo extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render() {

        const { publicationLcp, locale, __ } = this.props;

        // https://momentjs.com/docs/#/displaying/
        moment.locale(locale);

        const lcp = publicationLcp.lcp;

        if (!lcp) {
            return (<></>);
        }

        const lcpRightsPrint = (lcp?.rights?.print) ? lcp.rights.print : 0;
        const lcpRightsCopy = (lcp?.rights?.copy) ? lcp.rights.copy : 0;
        const lcpRightsCopiesPubInfo = publicationLcp.lcpRightsCopies || 0;
        const lcpRightsPrintRangePubInfo = publicationLcp.lcpRightsPrints || [];
        const lcpRightsPrintCountPubInfo = lcpRightsPrintRangePubInfo.length;

        const now = moment();

        const lcpRightsStartDate = (lcp?.rights?.start) ? lcp.rights.start : undefined;
        let lcpRightsStartDateStr = "";
        let remainingDays= "";
        let futureDays=  "";

        if (lcpRightsStartDate) {
            const momentStart = moment(lcpRightsStartDate);
            lcpRightsStartDateStr = momentStart.format("LLL");
            const timeStartDif = momentStart.diff(now, "days");
            if (timeStartDif > 1) {
                futureDays = `${timeStartDif} ${__("publication.days")}`;
            } else if (timeStartDif === 1) {
                futureDays = `${timeStartDif} ${__("publication.day")}`;
            }
        }

        const lcpRightsEndDate = (lcp?.rights?.end) ? lcp.rights.end : undefined;
        let lcpRightsEndDateStr = "";
        if (lcpRightsEndDate) {
            const momentEnd = moment(lcpRightsEndDate);
            lcpRightsEndDateStr = momentEnd.format("LLL");
            const timeEndDif = momentEnd.diff(now, "days");
            if (timeEndDif > 1) {
                remainingDays = `${timeEndDif} ${__("publication.days")}`;
            } else if (timeEndDif === 1) {
                remainingDays = `${timeEndDif} ${__("publication.day")}`;
            } else {
                // const nowUTC = (new Date()).toISOString();
                // const momentNow = moment(nowUTC);
                if (now.isAfter(momentEnd)) {
                    remainingDays = `${__("publication.expired")}`;
                } else {
                    // remainingDays = `${__("publication.licensed")}`;
                    remainingDays = `${formatTime(momentEnd.diff(now, "seconds"))}`;
                }
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
                    <h4>{__("publication.licenceLCP")}</h4>
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
                    {
                    futureDays ?
                        <>
                            <strong>{__("publication.lcpStart")}: </strong>
                            <span>{futureDays} ({lcpRightsStartDateStr})</span>
                             <br />
                        </>
                        : <></>
                    }
                    {lcpRightsEndDateStr ?
                    <>
                        <strong>{__("publication.timeLeft")}: </strong>
                        <span>{remainingDays} ({lcpRightsEndDateStr})</span>
                        <br />
                    </>
                    : <></>
                    }

                    {/*{lcpRightsEndDateStr && <>
                        <strong>{__("publication.lcpEnd")}: </strong><span>{lcpRightsEndDateStr}</span>
                        <br />
                        <br />
                    </>} */}

                    {lcpRightsCopy ? <>
                        <strong>{__("publication.lcpRightsCopy")}: </strong>
                        <span>{lcpRightsCopiesPubInfo} / {lcpRightsCopy}</span><br />
                    </> : <></>}

                    {lcpRightsPrint ? <>
                        <strong>{__("publication.lcpRightsPrint")}: </strong>
                        <span>{lcpRightsPrintCountPubInfo} / {lcpRightsPrint}  </span>
                        {lcpRightsPrintRangePubInfo.length ? ` [${lcpRightsPrintRangePubInfo}] ` : <></>}
                    </> : <></>}
                </div>
            </>
        );
    }

}

const mapStateToProps = (state: IRendererCommonRootState) => ({
    locale: state.i18n.locale, // refresh
});

export default connect(mapStateToProps)(withTranslator(LcpInfo));
