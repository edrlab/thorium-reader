// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";

import * as React from "react";
import { PopoverArrow } from "readium-desktop/renderer/common/components/overlayHelpers";
import { FocusScope } from "react-aria";
import { DialogPortalContext } from "readium-desktop/renderer/common/components/Dialog";
import { DialogTrigger, Pressable, Popover, Dialog as PopoverDialog, Button } from "react-aria-components";
import { IOpdsTagView } from "readium-desktop/common/views/opds";
import * as TrashIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { Link } from "react-router-dom";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
// import { DisplayType } from "readium-desktop/renderer/library/routing";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

interface IBaseProps {
    tag: string | IOpdsTagView;
    index?: number;
    pubId?: string;
    onClickDeleteCb?: (index: number) => () => void | undefined;
    onClickLinkCb?: (tag: IOpdsTagView) => () => void | undefined;
}

export interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

export const TagButton: React.FC<React.PropsWithChildren<IProps>> = (props) => {
    const { tag, index, pubId, onClickDeleteCb, onClickLinkCb, location } = props;
    let button = <></>;

    const [__] = useTranslator();

    let tagString = "";
    if (typeof tag === "string") {
        tagString = tag;
    } else {
        tagString = tag.name;
    }

    if (pubId && onClickDeleteCb && typeof index === "number") {
        button = (
            <>
                <Link
                    to={{
                        ...location,
                        pathname: "/library",
                        search: `?focus=tags&value=${encodeURIComponent_RFC3986(tag as string)}`,
                    }}
                    state={{ displayType: "list" }}
                    onClick={(e) => {
                        if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) {
                            e.preventDefault();
                            e.currentTarget.click();
                        }
                    }}
                    onKeyDown={(e) => {
                        // if (e.code === "Space") {
                        if (e.key === " " || e.altKey || e.ctrlKey) {
                            e.preventDefault(); // prevent scroll
                        }
                    }}
                    onKeyUp={(e) => {
                        // Includes screen reader tests:
                        // if (e.code === "Space") { WORKS
                        // if (e.key === "Space") { DOES NOT WORK
                        // if (e.key === "Enter") { WORKS
                        if (e.key === " ") { // WORKS
                            e.preventDefault();
                            e.currentTarget.click();
                        }
                    }}
                >
                    {tag as string}
                </Link>
                <DialogTrigger>
                    <Pressable>
                        <button>
                            <SVG ariaHidden={true} svg={EditIcon} />
                        </button>
                    </Pressable>
                    <DialogPortalContext.Consumer>
                        {(portalContainer) => (
                            <Popover
                                UNSTABLE_portalContainer={portalContainer}
                                placement="bottom"
                                offset={5}
                                crossOffset={0}
                                containerPadding={0}
                                className={stylesTags.Popover_delete_tag}
                                style={{ zIndex: 101 }}
                            >
                                <PopoverDialog>
                                    <FocusScope autoFocus>
                                        <Button
                                            slot="close"
                                            onPress={
                                                // () => this.deleteTag(index)
                                                onClickDeleteCb(index)
                                            }
                                            render={(buttonProps) => <button {...buttonProps} title={__("catalog.deleteTag")} />}
                                        >
                                            <SVG ariaHidden={true} svg={TrashIcon} />
                                            {__("catalog.delete")}
                                        </Button>
                                        <PopoverArrow className={stylesDropDown.PopoverArrow} aria-hidden />
                                    </FocusScope>
                                </PopoverDialog>
                            </Popover>
                        )}
                    </DialogPortalContext.Consumer>
                </DialogTrigger>
            </>
        );
    } else if (typeof tag === "object" && tag?.link?.length && onClickLinkCb) {
        button = (<>
            <a onClick={
                // () => void this.props.link(tag.link[0], this.props.location, tag.name)
                onClickLinkCb(tag)}
                tabIndex={0}
                onKeyUp={(e) => {
                    if (e.key === "Enter") {
                        onClickLinkCb(tag)();
                        e.preventDefault();
                    }
                }}>
                {tagString}
            </a>
        </>
        );
    } else {
        button = (<>{tagString}</>);
    }
    return button;
};

export const TagReaderButton: React.FC<React.PropsWithChildren<IBaseProps>> = (props) => {
    const { tag, /* index, __, pubId, onClickDeleteCb, */ onClickLinkCb } = props;
    let button = <></>;

    let tagString = "";
    if (typeof tag === "string") {
        tagString = tag;
    } else {
        tagString = tag.name;
    }
/*
    if (pubId && onClickDeleteCb && __) {
        button = (
            <>
                {tagString}
                <button onClick={
                    // () => this.deleteTag(index)
                    onClickDeleteCb(index)}
                    title={__("catalog.deleteTag")}
                >
                    <SVG ariaHidden={true} svg={TrashIcon} />
                </button>
            </>
        );
    } else  */if (typeof tag === "object" && tag?.link?.length && onClickLinkCb) {
        button = (
            <>
                <a onClick={
                    // () => void this.props.link(tag.link[0], this.props.location, tag.name)
                    onClickLinkCb(tag)}
                    tabIndex={0}
                    onKeyUp={(e) => {
                        if (e.key === "Enter") {
                            onClickLinkCb(tag)();
                            e.preventDefault();
                        }
                    }}
                >
                    {tagString}
                </a>
            </>
        );
    } else {
        button = (<>{tagString}</>);
    }
    return button;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});
