// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { relative } from "path";

const auto: "auto" = "auto";
const fixed: "fixed" = "fixed";
const hidden: "hidden" = "hidden";
const absolute: "absolute" = "absolute";
const column: "column" = "column";
const wrap: "wrap" = "wrap";

export const Styles = {
    Reader: {
        publicationViewport: {
            overflowY: hidden,
            overflowX: hidden,
            position: absolute,
            top: "0px",
            bottom: "0px",
            left: "0px",
            right: "0px",
            backgroundColor: "red",
        },
        reader: {
            display: relative,

            position: absolute,
            top: "160px",
            bottom: "0px",
            left: "0px",
            right: "0px",
        },
        leftButton: {
            "position": absolute,
            "top": "0px",
            "bottom": "0px",
            "left": "0px",
            "width": "20%",
            "height": "unset",
            "zIndex": 3,
            "&:hover": {
                display: "inline-block",
            },
        },
        rightButton: {
            "position": absolute,
            "top": "0px",
            "bottom": "0px",
            "right": "0px",
            "width": "20%",
            "height": "unset",
            "zIndex": 3,
            "&:hover": {
                width: "60%",
            },
        },
        test: {
            display: "none",
        },
        test2: {
            display: "inline-block",
        },
    },
    App: {
        height: "100%",
    },
    Library: {
        addButton: {
            float: "right",
            marginTop: "6px",
        },
        displayButton: {
            float: "right",
        },
        list: {
            textAlign: "center",
            overflowY: auto,
            overflowX: hidden,
            position: absolute,
            top: 130,
            bottom: 10,
            left: 0,
            right: 0,
        },
        title: {
            display: "inline-block",
        },
        spinner: {
            top: "200px",
            fontSize: "40px",
        },
    },
    BookCard: {
        body: {
            display: "inline-block",
            height: 400,
            margin: "5px 5px",
            textAlign: "center",
            width: 210,
        },
        downloadButton: {
            width: "200px",
            flexGrow: 1,
        },
        image: {
            fontSize: "18px",
            height: 320,
            width: 210,
        },
        title: {
            overflow: "hidden",
            whiteSpace: "nowrap",
        },
        titleCard: {
            top: "320px",
        },
    },
    BookListElement: {
        body: {
            // boxShadow: "rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px",
            fontFamily: "Roboto, sans-serif",
            margin: "15px 5px",
            width: "100%",
        },
        lcpSentense: {
            width: 250,
        },
        column: {
            display: "flex",
            width: "250px",
            flexDirection: column,
            flexWrap: wrap,
        },
        content: {
            display: "flex",
        },
        container: {
            display: "inline-block",
            width: "100%",
            textAlign: "left",
        },
        description: {
            display: "flex",
            flexDirection: column,
            height: 140,
            marginLeft: "5px",
        },
        image: {
            fontSize: "9px",
            display: "inline-block",
            float: "left",
            height: 140,
            width: 91,
        },
        title: {
            margin: "10px 0px",
        },
    },
    BookCover: {
        box: {
            border: "1px black solid",
            width: "100%",
            height: "100%",

        },
        title: {
            marginLeft: "5%",
            marginRight: "5%",
            marginTop: "10%",
            width: "90%",
        },
        author : {
            fontSize: "90%",
            bottom: "10px",
            margin: "10px 5%",
            width: "90%",
        },
        body : {
            height: "inherit",
            width: "inherit",
            textAlign: "center",
            backgroundImage: "",
            WebkitBoxSizing: "border-box",
            MozBoxSizing: "border-box",
            BoxSizing: "border-box",
            padding: "5%",
        },
    },
    OpdsList: {
        Publication: {
            title: {
                margin: "10px 0px",
            },
            image: {
                fontSize: "6px",
                display: "inline-block",
                float: "left",
                height: 80,
                width: 52,
                marginRight: 10,
            },
            checkbox: {
                height: "100%",
                width: 20,
                float: "left",
                margin: "0 15px 0 0",
            },
            descriptionInside: {
                height: 80,
                verticalAlign: "middle",
                display: "table-cell",
                paddingRight: "15px",
            },
            description: {
                height: 80,
                display: "table",
                margin: 0,
            },
            descriptionContener: {
                display: "inline-block",
            },
            informations: {
                height: 80,
                marginLeft: "5px",
            },
            column: {
                display: "inline-block",
                width: "250px",
                height: "100%",
                float: "left",
            },
        },
        title: {
            float: "left",
        },
        body: {
            boxShadow: "rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px",
            fontFamily: "Roboto, sans-serif",
            margin: "5px 0px",
            width: "100%",
            display: "inline-block",
        },
        textZone: {
            width : 300,
        },
        list: {
            overflow: auto,
            position: absolute,
            top: 60,
            bottom: 60,
            left: 30,
            right: 30,
        },
        parent: {
            height: "100%",
        },
        buttonContainer : {
            position: fixed,
            bottom: 10,
            right: 10,
        },
        button: {
            marginRight: 10,
        },
        errorMessage: {
            color: "red",
        },
        formElementLabel: {
            display: "block",
            float: "left",
            width: 150,
        },
        formElement: {
            margin : 10,
        },
        refreshButton: {
            float: "right",
        },
    },
    fileInput: {
        bottom: 0,
        cursor: "pointer",
        left: 0,
        opacity: 0,
        overflow: "hidden",
        position: absolute,
        right: 0,
        top: 0,
        width: "100%",
        zIndex: 100,
    },
    collectionDialog : {
        position: fixed,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        zIndex: 1000,
        overflow: "hidden",
    },
};
