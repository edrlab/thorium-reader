// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";

import { readerLocalActionSetImageClick } from "../redux/actions";
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
import { aiSDKModelOptions, DEFAULT_SYSTEM_PROMPT, IaiSdkModel } from "readium-desktop/common/aisdkModelOptions";
import { convertMultiLangStringToLangString } from "readium-desktop/common/language-string";

import classNames from "classnames";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesChatbot from "readium-desktop/renderer/assets/styles/chatbot.scss";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as sendIcon from "readium-desktop/renderer/assets/icons/send-chat-icon.svg";
import * as AiIcon from "readium-desktop/renderer/assets/icons/ai-icon.svg";
import * as ChevronRight from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as BackIcon from "readium-desktop/renderer/assets/icons/arrow-right.svg";
import * as ResetIcon from "readium-desktop/renderer/assets/icons/backward-icon.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as MinusIcon from "readium-desktop/renderer/assets/icons/Minus-Bold.svg";
import * as OpenAiIcon from "readium-desktop/renderer/assets/icons/open-ai-icon.svg";
import * as MistralAiIcon from "readium-desktop/renderer/assets/icons/mistral-ai-icon.svg";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ControlsProps {
    chatEnabled: boolean;
}



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

const Controls: React.FC<ControlsProps> = ({ chatEnabled }) => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
    console.log(chatEnabled);

    return (
        <div style={{ top: chatEnabled ? "unset" : "0", bottom: chatEnabled ? "20px" : "unset", right: chatEnabled ? "unset" : "50%", left: chatEnabled ? "17px" : "unset" }} className={stylesChatbot.chatbot_image_controls}>
            <button onClick={() => zoomOut()}><SVG svg={MinusIcon} /></button>
            <button onClick={() => zoomIn()}><SVG svg={PlusIcon} /></button>
            <button onClick={() => resetTransform()}><SVG svg={ResetIcon} /></button>
        </div>
    );
};

// const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: string, name: string, disabled: boolean, svg: {} }>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
// SelectRef.displayName = "ComboBox";

interface IChatContext {
    modelSelected: IaiSdkModel,
    setModel: React.Dispatch<React.SetStateAction<IaiSdkModel>>,
    systemPrompt: string,
    setSystemPrompt: React.Dispatch<React.SetStateAction<string>>
    showImage: () => void;
}

const ChatContext = React.createContext<IChatContext>(undefined);


let __messages: UIMessage[] = [];

const Chat = ({ imageHref, autoPrompt, setAutoPrompt }: { imageHref: string, imageDescription: string, autoPrompt: string, setAutoPrompt: (value: React.SetStateAction<string>) => void }) => {


    const { modelSelected, systemPrompt, setSystemPrompt  /*showImage*/ } = React.useContext(ChatContext);
    const [__] = useTranslator();

    // const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const selectedId = event.target.value;
    //     const found = options.find(({ id }) => id === selectedId);
    //     if (found) {
    //         setOption(found);
    //     }
    // };

    // const image: Attachment = { url: imageHrefDataUrl, contentType: "image/jpeg" };
    const { messages, input, handleInputChange, handleSubmit, error, reload, isLoading, stop, setMessages,setInput } = useChat({
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
            systemPrompt: systemPrompt,
        },
        credentials: "same-origin",
    });

    React.useEffect(() => {
        __messages = [...messages];
    }, [messages]);

    // const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication.Metadata);
    const quickDescriptionRef = React.useRef(null);

      React.useEffect(() => {
        if (autoPrompt) {
            setInput(autoPrompt);
        }
    }, [autoPrompt, setInput]);

    React.useEffect(() => {
        if (quickDescriptionRef.current && input === autoPrompt) {
            setTimeout(() => {
                quickDescriptionRef.current.click();
            }, 0);
            setAutoPrompt("");
        }
    }, [input, autoPrompt, setAutoPrompt]);


    return (
        <div className={stylesChatbot.chatbot_modal_content}>
            <div id="aichat-scroller">
                {/* <style>
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
                </style> */}

                <div className={stylesChatbot.chatbot_systemPrompt_container}>
                    <details>
                        <summary>{__("chatbot.systemPromptEditor")}</summary>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                        ></textarea>
                    </details>
                </div>
                {/* <div>
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
                </div> */}
            </div>
            <div className={stylesChatbot.chatbot_container}>
                <div id="scroller" className={stylesChatbot.chatbot_messages_container}>
                    {messages.map(message => (
                        <div className={classNames(stylesChatbot.chatbot_message, message.role === "user" ? stylesChatbot.chatbot_user_message : stylesChatbot.chatbot_ai_message)} key={message.id}>
                            <div className={stylesChatbot.chatbot_message_speaker}>
                                {message.role === "user" ? "" : message.id.includes("openai") ?
                                    <SVG svg={OpenAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                                    :
                                    <SVG svg={MistralAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.mistral)} />
                                }
                            </div>
                            <div className={stylesChatbot.chatbot_message_content} dangerouslySetInnerHTML={{ __html: render(message.content) }}>
                                {/* {message.content} */}
                            </div>
                        </div>
                    ))}
                    <div id="aichat-anchor"></div>
                </div>
                <form onSubmit={(event) => handleSubmit(event, {})} className={stylesChatbot.chatbot_user_form}>
                    <div className={stylesChatbot.chatbot_user_form_input_container}>
                        <div>
                            {modelSelected.name.startsWith("openAI") ?
                                <SVG svg={OpenAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                                :
                                <SVG svg={MistralAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.mistral)} />
                            }
                        </div>
                        <input
                            name="prompt"
                            value={input}
                            onChange={handleInputChange}
                            className={classNames(stylesChatbot.chatbot_user_input)}
                            placeholder={__("chatbot.inputPlaceholder")}
                        />
                        <button type="submit" ref={quickDescriptionRef} style={{ display: "none"}}></button>
                    </div>
                    <div className={stylesChatbot.chatbot_user_form_conversation_container}>
                        {messages.length ?
                            <button className={stylesButtons.button_nav_primary} onClick={() => {
                                __messages = [];
                                setMessages([]);
                            }}>
                                <p>{__("chatbot.reset")}</p>
                            </button>
                            : <></>
                        }
                        {isLoading && (
                            <>
                                <Loader svgStyle={{ width: "20px", height: "20px", marginRight: "15px" }} />
                                <button className={stylesButtons.button_nav_primary} type="button" onClick={() => stop()}>
                                    <p>Stop</p>
                                </button>
                            </>
                        )}
                        {error && (
                            <>
                                <button className={stylesButtons.button_nav_primary} type="button" onClick={() => reload()}>
                                    <p>Retry</p>
                                </button>
                                <p style={{marginRight: " 10px"}}>An error occurred.</p>
                            </>
                        )}
                        <button type="submit" className={stylesChatbot.chatbot_user_form_button}>
                            <SVG svg={sendIcon} ariaHidden />
                            <p>{__("chatbot.sendQuestion")}</p>
                        </button>
                    </div>
                </form>
                {/* } */}
            </div>
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

    const {
        open,
        isSVGFragment,
        HTMLImgSrc_SVGImageHref_SVGFragmentMarkup,
        altAttributeOf_HTMLImg_SVGImage_SVGFragment,
        titleAttributeOf_HTMLImg_SVGImage_SVGFragment,
        ariaLabelAttributeOf_HTMLImg_SVGImage_SVGFragment,
        dom_afterText,
        dom_beforeText,
        dom_describedbyText,
        dom_detailsText,
        dom_figcaptionText,
        dom_labelledByText,
    } = useSelector((state: IReaderRootState) => state.img);

    const { documentTitle, authorsLangString, publishersLangString, languages } = useSelector((state: IReaderRootState) => state.reader.info.publicationView);

    const { locale } = useSelector((state: IReaderRootState) => state.i18n);

    // , naturalWidthOf_HTMLImg_SVGImage, naturalHeightOf_HTMLImg_SVGImage
    // const scaleX = naturalWidthOf_HTMLImg_SVGImage ? ((window.innerHeight - 50) / naturalWidthOf_HTMLImg_SVGImage) : 1;
    // const scaleY = naturalHeightOf_HTMLImg_SVGImage ? ((window.innerWidth - 50) / naturalHeightOf_HTMLImg_SVGImage) : 1;
    // let scale = Math.min(scaleX, scaleY);

    const dispatch = useDispatch();
    const [__] = useTranslator();
    const [chatEnabled_, enableChat] = React.useState(false);
    // const imageHrefDataUrl = useGetDataUrl(href);

    const chatEnabled = chatEnabled_ && !isSVGFragment; // isSVGImage and otherwise HTML image

    const [modelSelected, setModel] = React.useState(aiSDKModelOptions[0]);
    const [systemPrompt, setSystemPrompt] = React.useState(DEFAULT_SYSTEM_PROMPT);
    const previousHref = React.useRef(HTMLImgSrc_SVGImageHref_SVGFragmentMarkup);

    React.useEffect(() => {
        if (HTMLImgSrc_SVGImageHref_SVGFragmentMarkup && previousHref.current !== HTMLImgSrc_SVGImageHref_SVGFragmentMarkup) {
            __messages = [];
            previousHref.current = HTMLImgSrc_SVGImageHref_SVGFragmentMarkup;
        }
    }, [HTMLImgSrc_SVGImageHref_SVGFragmentMarkup]);
    const [showImage, setShowImage] = React.useState(true);

    React.useEffect(() => {
        setSystemPrompt(modelSelected.systemPrompt
            .replace("{{title}}", "\"" + documentTitle + "\"")
            .replace("{{author}}", "\"" + authorsLangString ?
                authorsLangString.reduce<string>((prev, text) => {
                    const textLangStr = convertMultiLangStringToLangString(text, locale);
                    // const textLang = textLangStr && textLangStr[0] ? textLangStr[0].toLowerCase() : "";
                    // const textIsRTL = langStringIsRTL(textLang);
                    const textStr = textLangStr && textLangStr[1] ? textLangStr[1] : "";

                    return prev ? `${prev}, ${textStr}` : textStr;
                }, "")
                : "" + "\"")
            .replace("{{publisher}}", "\"" + publishersLangString ?
                // publishers.join(", ")
                publishersLangString.reduce<string>((prev, text) => {
                    const textLangStr = convertMultiLangStringToLangString(text, locale);
                    // const textLang = textLangStr && textLangStr[0] ? textLangStr[0].toLowerCase() : "";
                    // const textIsRTL = langStringIsRTL(textLang);
                    const textStr = textLangStr && textLangStr[1] ? textLangStr[1] : "";

                    return prev ? `${prev}, ${textStr}` : textStr;
                }, "")
                : "" + "\"")
            .replace("{{languages}}", "\"" + languages ?
                // publishers.join(", ")
                languages.reduce<string>((prev, text) => {
                    const textLangStr = convertMultiLangStringToLangString(text, locale);
                    // const textLang = textLangStr && textLangStr[0] ? textLangStr[0].toLowerCase() : "";
                    // const textIsRTL = langStringIsRTL(textLang);
                    const textStr = textLangStr && textLangStr[1] ? textLangStr[1] : "";

                    return prev ? `${prev}, ${textStr}` : textStr;
                }, "")
                : "" + "\"")
            .replace("{{beforeText}}", "\"" + dom_beforeText + "\"")
            .replace("{{afterText}}", "\"" + dom_afterText + "\"")
            .replace("{{describedby}}", "\"" + dom_describedbyText + "\"")
            .replace("{{details}}", "\"" + dom_detailsText + "\"")
            .replace("{{figcaption}}", "\"" + dom_figcaptionText + "\"")
            .replace("{{labelledby}}", "\"" + dom_labelledByText + "\""),
        );
    }, [modelSelected.systemPrompt, dom_beforeText, dom_afterText, dom_describedbyText, dom_detailsText, dom_figcaptionText, dom_labelledByText, authorsLangString, documentTitle, locale, publishersLangString, languages]);

    const imageDescription = dom_detailsText || dom_figcaptionText || dom_describedbyText || dom_labelledByText || "";

    const shortDescription = __("chatbot.shortDescription");
    const longDescription = __("chatbot.detailedDescription");

    const [detailOpen, setDetailOpen] = React.useState(true);
    const [autoPrompt, setAutoPrompt] = React.useState("");

    const noDescription = __("chatbot.noDescription").split(__("chatbot.shortDescTitle"));
    const secondPartNoDescription = noDescription[1].split(__("chatbot.detailedDescTitle"));


    return (
    <>
        <Dialog.Root open={open} onOpenChange={(openState: boolean) => {
            if (openState == false) {
                dispatch(readerLocalActionSetImageClick.build());
                enableChat(false);
                setShowImage(true);
            }
        }}
        >
            <Dialog.Portal>
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined} style={{padding: "5px 10px", minHeight: "unset"}} >
                    <VisuallyHidden>
                        <Dialog.DialogTitle>{__("chatbot.title")}</Dialog.DialogTitle>
                    </VisuallyHidden>
                    <style>{`
                #aichat-scroller * {
                    overflow-anchor: none;
                }

                #aichat-anchor {
                    overflow-anchor: auto;
                    height: 1px;
                }
           `}</style>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: chatEnabled ? "space-between" : "end" }}>
                        {chatEnabled ?
                            <button onClick={() => { enableChat((enabled) => !enabled); setShowImage(true); }} style={{ zIndex: 105 }} className={stylesButtons.button_transparency_icon}>
                                <SVG ariaHidden={true} svg={BackIcon} style={{ transform: "rotate(180deg)" }} />
                            </button>
                            : ""
                        }
                        <Dialog.Close asChild>
                            <button style={{ zIndex: 105 }} data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                    {chatEnabled ?
                        <div className={stylesChatbot.chatbot_title}>
                            <h2>{__("chatbot.title")}</h2>
                            <Select
                                items={aiSDKModelOptions}
                                selectedKey={modelSelected.id}
                                onSelectionChange={(key) => {
                                    // console.log("selectionchange: ", key);
                                    const found = aiSDKModelOptions.find(({ id: _id }) => _id === key);
                                    if (found) {
                                        setModel(found);
                                    }
                                }}
                            // disabledKeys={options.filter(option => option.disabled === true).map(option => option.id)}
                            // style={{ padding: "0", width: "80%", height: "30px", maxHeight: "30px", margin: "10px" }}
                            >
                                {item => <SelectItem>{item.name}</SelectItem>}
                            </Select>
                        </div>
                        : ""
                    }
                    <div className={stylesChatbot.chatbot_content}>
                        <div style={{ 
                            flex: (showImage || !chatEnabled) ? "1" : "0", 
                            flexDirection: chatEnabled ? "row" : "column", 
                            backgroundColor: chatEnabled ? "var(--color-extralight-grey)" : "", 
                            borderLeft: chatEnabled ? "3px solid var(--color-blue)" : "",
                            }} 
                            className={stylesChatbot.image_container}
                            >
                            {chatEnabled ?
                                <button
                                    className={stylesChatbot.image_display_button}
                                    title={showImage ? "hide image" : "show image"}
                                    onClick={() => setShowImage(!showImage)}>
                                    <SVG svg={ChevronRight} style={{ transform: showImage ? "rotate(90deg)" : "rotate(-90deg)" }}></SVG>
                                </button>
                                : ""
                            }
                            { /*  initialScale={scale} minScale={scale / 2} maxScale={4 * scale} */}
                            {showImage ?
                                <>
                                    <TransformWrapper>
                                        <TransformComponent wrapperStyle={{ display: "flex", width: "100%", height: "100%", minHeight: "inherit", alignItems: "center", flex: "1", position: "relative" }}>
                                            <img
                                                style={{ width: "100%", height: "100%", maxHeight: chatEnabled ? "200px" : "calc(100vh - 250px)", backgroundColor: "white", color: "black", fill: "currentcolor", stroke: "currentcolor" }}
                                                src={isSVGFragment ? ("data:image/svg+xml;base64," + Buffer.from(HTMLImgSrc_SVGImageHref_SVGFragmentMarkup).toString("base64")) : HTMLImgSrc_SVGImageHref_SVGFragmentMarkup}
                                                alt={altAttributeOf_HTMLImg_SVGImage_SVGFragment}
                                                title={titleAttributeOf_HTMLImg_SVGImage_SVGFragment}
                                                aria-label={ariaLabelAttributeOf_HTMLImg_SVGImage_SVGFragment}
                                                tabIndex={0}
                                            />
                                        </TransformComponent>
                                        {(showImage || !chatEnabled) ?
                                            <Controls chatEnabled={chatEnabled} />
                                            : ""
                                        }
                                    </TransformWrapper>
                                </>
                                : ""
                            }
                            {imageDescription ?
                                <div
                                    className={stylesChatbot.chatbot_detail_element}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDetailOpen(!detailOpen);
                                    }}
                                >
                                    <div className={stylesChatbot.chatbot_detail_element_summary}>
                                        {chatEnabled ? 
                                        <h3>{__("chatbot.editorDescription")}</h3>
                                        : <></>
                                        }
                                    </div>
                                    {showImage ?
                                    <p style={{ maxWidth: chatEnabled ? "500px" : "unset"}}>
                                        {imageDescription}
                                    </p>
                                    : <></>
                                    }
                                </div>
                                :
                                    <p className={stylesChatbot.no_description_text}>
                                        {noDescription[0]}
                                        <button role="submit" onClick={() => { setAutoPrompt(shortDescription); enableChat(true); }}>
                                            {__("chatbot.shortDescTitle")}
                                        </button>
                                        {secondPartNoDescription[0]}
                                        <button role="submit" onClick={() => { setAutoPrompt(longDescription); enableChat(true); }}>
                                            {__("chatbot.detailedDescTitle")}
                                        </button>
                                        {secondPartNoDescription[1]}
                                    </p>
                            }
                        </div>
                        {chatEnabled ? "" :
                        <div className={stylesChatbot.chatbot_open_title}>
                            <button  onClick={() => enableChat((enabled) => !enabled)} title={"Chat with AI"}>
                                <SVG svg={AiIcon} ariaHidden />
                                <p>{__("chatbot.generateDescriptionTitle")}</p>
                            </button>
                        </div>
                        }
                        {chatEnabled ?
                            <ChatContext.Provider value={{
                                modelSelected,
                                setModel,
                                systemPrompt,
                                setSystemPrompt,
                                showImage: () => enableChat((enabled) => !enabled),
                            }}>
                                <Chat /*imageHrefDataUrl={imageHrefDataUrl}*/ imageHref={HTMLImgSrc_SVGImageHref_SVGFragmentMarkup} imageDescription={imageDescription} autoPrompt={autoPrompt} setAutoPrompt={setAutoPrompt} />
                            </ChatContext.Provider>
                            :
                            ""
                        }
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    </>);
};
