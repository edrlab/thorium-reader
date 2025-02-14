// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";

import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import * as Dialog from "@radix-ui/react-dialog";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerLocalActionSetImageClick } from "../redux/actions";
import classNames from "classnames";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";

import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

import { useChat } from "@ai-sdk/react";
import { type UIMessage } from "@ai-sdk/ui-utils";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL } from "readium-desktop/common/streamerProtocol";
// import { nanoid } from "nanoid";
// import { Attachment } from "ai";
import Loader from "readium-desktop/renderer/common/components/Loader";

import { marked } from "marked";
import DOMPurify from "dompurify";
import { Select, SelectItem } from "readium-desktop/renderer/common/components/Select";
import { aiSDKModelIDEnumType, aiSDKModelOptions } from "readium-desktop/common/aisdkModelOptions";

// https://github.com/huggingface/transformers.js-examples/blob/5b6e0c18677e3e22ef42779a766f48e2ed0a4b18/smolvlm-webgpu/src/components/Chat.jsx#L10
function render(text: string) {
    // Replace all instances of single backslashes before brackets with double backslashes
    // See https://github.com/markedjs/marked/issues/546 for more information.
    text = text.replace(/\\([\[\]\(\)])/g, "\\\\$1");
  
    const result = DOMPurify.sanitize(
      marked.parse(text, {
        async: false,
        breaks: true,
      }),
    );
    return result;
  }

// async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
//     const response = await fetch(imageUrl);
//     const type = response.headers.get("content-type");
//     const bytes = await response.bytes();

//     const binaryString = bytes.reduce((data, byte) => data + String.fromCharCode(byte), "");
//     const base64String = btoa(binaryString);
//     const dataUrl = `data:${type};base64,${base64String}`;

//     return dataUrl;
// }

const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();

    return (
        <div style={{ position: "absolute", display: "flex", flexDirection: "column", zIndex: 105, top: "42%", right: "10px" }}>
            <button className={stylesButtons.button_nav_primary} onClick={() => zoomIn()}>+</button>
            <button className={stylesButtons.button_nav_primary} onClick={() => zoomOut()}>-</button>
            <button className={stylesButtons.button_nav_primary} onClick={() => resetTransform()}>x</button>
        </div>
    );
};

// const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: string, name: string, disabled: boolean, svg: {} }>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
// SelectRef.displayName = "ComboBox";

const options = aiSDKModelOptions;

interface IChatContext {
    modelSelected: {
        id: aiSDKModelIDEnumType;
        name: string;
    }
    setModel: React.Dispatch<React.SetStateAction<{
        id: aiSDKModelIDEnumType;
        name: string;
    }>>,
    systemPrompt: string,
    setSystemPrompt: React.Dispatch<React.SetStateAction<string>>
    showImage: () => void;
}

const ChatContext = React.createContext<IChatContext>(undefined);


let __messages: UIMessage[] = [];

const Chat = ({ imageHref }: { imageHref: string }) => {


    const { modelSelected, setModel, systemPrompt, setSystemPrompt, showImage } = React.useContext(ChatContext);

    // const image: Attachment = { url: imageHrefDataUrl, contentType: "image/jpeg" };
    const { messages, input, handleInputChange, handleSubmit, error, reload, isLoading, stop, setMessages } = useChat({
        initialMessages: [
            // { id: nanoid(), role: "user", content: "", experimental_attachments: [image] },
            ...__messages,
        ],
        api: `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://0.0.0.0/aisdk/chat`,

        // TODO : handle user authentication token !?
        headers: {
            Authorization: "your_token",
        },

        // TODO : pass model identification from frontend
        body: {
            imageHref,
            modelId: modelSelected.id,
            systemPrompt,
        },
        credentials: "same-origin",
    });

    React.useEffect(() => {
        __messages = [...messages];
    }, [messages]);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "80vh" }}>
            <div id="aichat-scroller" style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <style>
                    {`
                        .react_aria_ComboBox .my_combobox_container {
                            width: 100%
                        }

                        .react_aria_ComboBox .my_combobox_container button {
                            width: 100%
                        }

                        .react_aria_ComboBox .my_combobox_container span {
                            margin-left: 10px
                        }

                        `}
                </style>
                <Select
                    items={options}
                    selectedKey={modelSelected.id}
                    onSelectionChange={(key) => {
                        // console.log("selectionchange: ", key);
                        const found = options.find(({ id: _id }) => _id === key);
                        if (found) {
                            setModel(found);
                        }
                    }}
                    // disabledKeys={options.filter(option => option.disabled === true).map(option => option.id)}
                    style={{ padding: "0", width: "80%", height: "30px", maxHeight: "30px", margin: "10px" }}
                >
                    {item => <SelectItem>{item.name}</SelectItem>}
                </Select>

                <div style={{ width: "80%", maxWidth: "600px", margin: "10px 0" }}>
                    <details>
                        <summary>System Prompt Editor</summary>
                        <textarea
                            style={{
                                width: "100%",
                                minHeight: "100px",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #ccc",
                                resize: "vertical",
                            }}
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                        ></textarea>
                    </details>
                </div>

                <div>
                    <a
                        tabIndex={0}
                        onClick={showImage}
                        onKeyUp={(e) => {
                            if (e.key === "Enter") {
                                // e.preventDefault();
                                // e.stopPropagation();
                                e.currentTarget.click();
                            }
                        }}
                    >
                        <img
                            style={{
                                maxWidth: "100px",
                                maxHeight: "100px",
                                width: "auto",
                                height: "auto",
                                objectFit: "contain",
                                flex: 1,
                            }}
                            src={imageHref}
                        // alt={attachment.name}
                        />
                    </a>
                </div>
                {messages.map(message => (
                    <div style={{
                        display: "flex",
                        width: "80%",
                        maxWidth: "600px",
                        margin: "10px 0",
                        padding: "10px",
                        borderRadius: "8px",
                        backgroundColor: message.role === "user" ? "#e6f2ff" : "#f0f0f0",
                    }} key={message.id}>
                        <div style={{ width: "50px", fontWeight: "bold" }}>
                            {message.role === "user" ? "User:" : "AI:"}
                        </div>
                        <div style={{ flex: 1, overflow: "visible", overflowY: "hidden" }} dangerouslySetInnerHTML={{ __html: render(message.content) }}>
                        </div>
                    </div>
                ))}
                <div style={{ width: "100%", display: "flex", alignItems: "center", flexDirection: "row" }}>
                    {messages.length ?
                        <button style={{ width: "40px", height: "10px", margin: "10px" }} className={stylesButtons.button_nav_primary} onClick={() => {
                            __messages = [];
                            setMessages([]);
                        }}>
                            <span>RESET</span>
                        </button>
                        : <></>
                    }
                    {isLoading && (
                        <>
                            <Loader svgStyle={{ width: "20px", height: "20px", margin: "10px" }} />
                            <button style={{ width: "40px", height: "10px", margin: "10px" }} className={stylesButtons.button_nav_primary} type="button" onClick={() => stop()}>
                                Stop
                            </button>
                        </>
                    )}
                    {error && (
                        <>
                            <button style={{ width: "40px", height: "10px", margin: "10px" }} className={stylesButtons.button_nav_primary} type="button" onClick={() => reload()}>
                                Retry
                            </button>
                            <span>An error occurred.</span>
                        </>
                    )}
                </div>
                <div id="aichat-anchor"></div>
            </div>



 



            <form onSubmit={(event) => handleSubmit(event, {})} style={{
                display: "flex",
                justifyContent: "center",
                padding: "20px",
                borderTop: "1px solid #ccc",
            }}>
                <input
                    name="prompt"
                    value={input}
                    onChange={handleInputChange}
                    style={{ width: "60%", maxWidth: "400px", marginRight: "10px", padding: "5px" }}
                    placeholder="Type something"
                />
                <button className={stylesButtons.button_nav_primary} type="submit">Submit</button>
            </form>
        </div>
    );
};

// function useGetDataUrl(href: string): string | undefined {
//     const [state, setState] = React.useState<string>();

//     React.useEffect(() => {
//         getBase64ImageFromUrl(href).then(result => {
//             setState(result);
//         });
//     }, [href]);

//     return state;
// }

export const ImageClickManager: React.FC = () => {

    const { open, href } = useSelector((state: IReaderRootState) => state.img);
    const dispatch = useDispatch();
    const [__] = useTranslator();
    const [chatEnabled, enableChat] = React.useState(false);
    // const imageHrefDataUrl = useGetDataUrl(href);

    const [modelSelected, setModel] = React.useState(options[0]);
    const [systemPrompt, setSystemPrompt] = React.useState("Your goal is to describe the image, you should not answer on a topic other than this image");
    const previousHref = React.useRef(href);


    React.useEffect(() => {
        if (href && previousHref.current !== href) {
            __messages = [];
            previousHref.current = href;
        }
    }, [href]);

    return (<>

        <Dialog.Root open={open} onOpenChange={(openState: boolean) => {
            if (openState == false) {
                dispatch(readerLocalActionSetImageClick.build());
                enableChat(false);
            }
        }}
        >
            <Dialog.Portal>
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined}>
            <style>{`
                #aichat-scroller * {
                    overflow-anchor: none;
                }

                #aichat-anchor {
                    overflow-anchor: auto;
                    height: 1px;
                }
           `}</style>
                    <Dialog.Close asChild>
                        <button style={{ position: "absolute", top: "10px", right: "10px", zIndex: 105 }} data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                    {
                        chatEnabled ?


                            <ChatContext.Provider value={{
                                modelSelected,
                                setModel,
                                systemPrompt,
                                setSystemPrompt,
                                showImage: () => enableChat((enabled) => !enabled),
                            }}>

                                <Chat imageHref={href} />
                            </ChatContext.Provider>
                            :
                            <>
                                <TransformWrapper>
                                    <Controls />
                                    <TransformComponent wrapperStyle={{ display: "flex", width: "100%", height: "100%", minHeight: "inherit" }} >
                                        <img
                                            src={href}
                                            alt="image"
                                            tabIndex={0}
                                        />
                                    </TransformComponent>
                                </TransformWrapper>
                                <button style={{ position: "absolute", bottom: "10px", right: "10px" }} className={stylesButtons.button_nav_primary} onClick={() => enableChat((enabled) => !enabled)}>
                                    <span>AI</span>
                                </button>
                            </>
                    }
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    </>);
};
