// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    PublicationInfoContent,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoContent";
import PublicationInfoManager from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoManager";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import CatalogControls from "./catalogControls";
import CatalogLcpControls from "./catalogLcpControls";
import OpdsControls from "./opdsControls/OpdsControls";
import TagManager from "./TagManager";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import { TPublication } from "readium-desktop/common/type/publication.type";
import Loader from "readium-desktop/renderer/common/components/Loader";
import Cover from "readium-desktop/renderer/common/components/Cover";
import { useLocation } from "react-router";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

// Logger
const debug = debug_("readium-desktop:renderer:library:publication-info");

class PublicationInfo extends React.Component<IProps> {

    public render() {
        const { publication, toggleCoverZoom, closeDialog, coverZoom, open } = this.props;

        if (!open) {
            return <></>;
        }

        return (
            <PublicationInfoManager
                publicationViewMaybeOpds={publication}
                coverZoom={coverZoom}
                toggleCoverZoomCb={toggleCoverZoom}
                closeDialogCb={closeDialog}
            >
                <PublicationInfoContent
                    publicationViewMaybeOpds={publication}
                    r2Publication={null}
                    manifestUrlR2Protocol={null}
                    handleLinkUrl={null}
                    toggleCoverZoomCb={toggleCoverZoom}
                    ControlComponent={this.controlsComponent}
                    TagManagerComponent={TagManager}
                    coverZoom={coverZoom}
                    translator={this.props.translator}
                    onClikLinkCb={
                        (_link) => () =>
                            this.props.link(
                            _link.link[0], this.props.location, _link.name)
                    }
                    focusWhereAmI={false}
                    pdfPlayerNumberOfPages={undefined}
                    divinaNumberOfPages={undefined}
                    divinaContinousEqualTrue={undefined}
                    readerReadingLocation={undefined}
                    closeDialogCb={closeDialog}
                >
                </PublicationInfoContent>
            </PublicationInfoManager>
        );
    }

    private controlsComponent = () => {
        const { publicationInfoLib, publicationInfoOpds, publication } = this.props;

        let controlsComponent = (<></>);

        if (publicationInfoOpds) {
            controlsComponent = (<OpdsControls opdsPublicationView={publication as IOpdsPublicationView} />);
        }
        if (publicationInfoLib) {
            if (publication?.lcp) {
                controlsComponent = (<CatalogLcpControls publicationView={publication as PublicationView} />);
            } else {
                controlsComponent = (<CatalogControls publicationView={publication as PublicationView} />);
            }
        }

        return controlsComponent;
    };

}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    // Warning : mapDispatchToProps isn't rendered when the state is updateds
    // but only when the component is mounted
    debug("mapDispatchToProps rendered");
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
        toggleCoverZoom: (state: boolean) => {
            dispatch(dialogActions.updateRequest.build(
                {
                    coverZoom: !state,
                },
            ));
        },
        link: (...data: Parameters<ReturnType<typeof dispatchOpdsLink>>) =>
            dispatchOpdsLink(dispatch)(...data),
    };
};

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === DialogTypeName.PublicationInfoOpds
            || state.dialog.type === DialogTypeName.PublicationInfoLib,
        publicationInfoOpds: state.dialog.type === DialogTypeName.PublicationInfoOpds,
        publicationInfoLib: state.dialog.type === DialogTypeName.PublicationInfoLib,
    },
    ...(state.dialog.data as DialogType[DialogTypeName.PublicationInfoOpds]),
    location: state.router.location,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PublicationInfo));

export const PublicationInfo2 = (props: { publicationView: Pick<PublicationView, "identifier">, trigger: React.ReactNode }) => {
    const [__] = useTranslator();
    const defaultOpen = false;
    const [open, setOpen] = React.useState(defaultOpen);

    const dispatch = useDispatch();

    const data = useSelector((state: ILibraryRootState) =>
        state.dialog.type === DialogTypeName.PublicationInfoLib
            ? state.dialog.data as DialogType[DialogTypeName.PublicationInfoLib]
            : undefined);

    console.log(data);

    const appOverlayElement = document.getElementById("app-overlay");

    return (
        <Dialog.Root defaultOpen={defaultOpen} open={open} onOpenChange={
            (open) => {
                setOpen(open);
                if (open) {
                    dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoLib, {
                        publicationIdentifier: props.publicationView.identifier,
                    }));
                } else {
                    dispatch(dialogActions.closeRequest.build());
                }
            }
        }>
            <Dialog.Trigger asChild>
                {props.trigger}
            </Dialog.Trigger>
            <Dialog.Portal container={appOverlayElement}>
                {/* <Dialog.Overlay className="DialogOverlay" /> */}
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={stylesModals.modal_dialog}>
                    <div className={stylesModals.modal_dialog_header}>
                        {/* <Dialog.Title className="DialogTitle">{__("catalog.bookInfo")}</Dialog.Title> */}
                        <h2>{__("catalog.bookInfo")}</h2>
                        <Dialog.Close asChild>
                            <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className={stylesModals.modal_dialog_body}>
                        <PublicationInfo2Content publicationViewMaybeOpds={data?.publication} closeDialog={() => setOpen(false)} />
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );

};


const PublicationInfo2Content = (props: {publicationViewMaybeOpds: TPublication | undefined, closeDialog: () => void}) => {
    const [, translator] = useTranslator(); // FIXME
    const dispatch = useDispatch();
    const link = dispatchOpdsLink(dispatch);
    const location = useLocation();
    const [coverZoom, setCoverZoom] = React.useState(false);

    if (!props.publicationViewMaybeOpds?.documentTitle) {
        return <Loader></Loader>;
    }

    if (coverZoom) {
        return <Cover
            publicationViewMaybeOpds={props.publicationViewMaybeOpds}
            coverType="cover"
            onClick={
                () => setCoverZoom(true)
            }
            onKeyPress={
                (e: React.KeyboardEvent<HTMLImageElement>) =>
                    e.key === "Enter" && setCoverZoom(true)
            }
        />;
    }

    let controlsComponent = () => (<></>);

    // if (publicationInfoOpds) {
    //     controlsComponent = (<OpdsControls opdsPublicationView={publication as IOpdsPublicationView} />);
    // }
    // if (publicationInfoLib) {
        if (props.publicationViewMaybeOpds?.lcp) {
            controlsComponent = () => (<CatalogLcpControls publicationView={props.publicationViewMaybeOpds as PublicationView} />);
        } else {
            controlsComponent = () => (<CatalogControls publicationView={props.publicationViewMaybeOpds as PublicationView} />);
        }
    // }


    return (
        <PublicationInfoContent
            publicationViewMaybeOpds={props.publicationViewMaybeOpds}
            r2Publication={null}
            manifestUrlR2Protocol={null}
            handleLinkUrl={null}
            toggleCoverZoomCb={() => setCoverZoom(!coverZoom)}
            ControlComponent={controlsComponent}
            TagManagerComponent={TagManager}
            coverZoom={coverZoom}
            translator={translator}
            onClikLinkCb={
                (_link) => () => link(
                        _link.link[0], location, _link.name)
            }
            focusWhereAmI={false}
            pdfPlayerNumberOfPages={undefined}
            divinaNumberOfPages={undefined}
            divinaContinousEqualTrue={undefined}
            readerReadingLocation={undefined}
            closeDialogCb={props.closeDialog}
        >
        </PublicationInfoContent>
    );
};
