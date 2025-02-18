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

import * as stylesChatbot from "readium-desktop/renderer/assets/styles/chatbot.scss";
import * as sendIcon from "readium-desktop/renderer/assets/icons/send-icon.svg";
import * as AiIcon from "readium-desktop/renderer/assets/icons/stars-icon.svg";
import * as ChevronRight from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import OpenAiIcon from "readium-desktop/renderer/assets/logos/open-ai-icon.png";
import MistralAiIcon from "readium-desktop/renderer/assets/logos/mistral-ai-icon.png";
import * as BackIcon from "readium-desktop/renderer/assets/icons/arrow-right.svg";
import * as ResetIcon from "readium-desktop/renderer/assets/icons/backward-icon.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as MinusIcon from "readium-desktop/renderer/assets/icons/Minus-Bold.svg";

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

    return (
        <div style={{bottom: chatEnabled ? "40px" : "15px", right: "50%", transform: chatEnabled ? "" : "translateX(50%)"}} className={stylesChatbot.chatbot_image_controls}>
            <button onClick={() => zoomOut()}><SVG svg={MinusIcon}/></button>
            <button onClick={() => zoomIn()}><SVG svg={PlusIcon}/></button>
            <button onClick={() => resetTransform()}><SVG svg={ResetIcon}/></button>
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

const Chat = ({ imageHref }: { imageHref: string}) => {


    const { modelSelected, setModel, systemPrompt, setSystemPrompt /*showImage*/ } = React.useContext(ChatContext);


    // const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const selectedId = event.target.value;
    //     const found = options.find(({ id }) => id === selectedId);
    //     if (found) {
    //         setOption(found);
    //     }
    // };

    // const image: Attachment = { url: imageHrefDataUrl, contentType: "image/jpeg" };
    const { messages, input, handleInputChange, handleSubmit, error, reload, isLoading, stop, setMessages, setInput } = useChat({
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

    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication.Metadata);
    

    const shortDescription = "Décris cette image en 2 phrases.";
    const longDescription = `Décris cette illustration de façon détaillée (nature de l'image, technique, format, symbolique, personnages, décors, couleurs, style, époque, etc..) extraite du livre ${r2Publication.Title} écrit par ${r2Publication.Author[0].Name}. Renforce l'accessibilité de la réponse pour les lecteurs d’écran. Réponds-moi entièrement en langue : ${r2Publication.Language}.`;

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
            <div className={stylesChatbot.chatbot_title}>
                <SVG svg={AiIcon} ariaHidden />
                <h3>Chat with</h3>
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
                    // style={{ padding: "0", width: "80%", height: "30px", maxHeight: "30px", margin: "10px" }}
                >
                    {item => <SelectItem>{item.name}</SelectItem>}
                </Select>
            </div>
            <div id="scroller" className={stylesChatbot.chatbot_messages_container}>
                {/* <div>
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
                        onClick={showImage}
                    />
                </div> */}
                {messages.length ? "" : 
                <form style={{display: "flex", alignItems: "end", justifyContent: "end", flexDirection: "column", gap: "20px", width: "inherit", margin: "20px 10px"}} onSubmit={(event) => handleSubmit(event, {})}>
                    <button role="submit" onClick={() => setInput(shortDescription)} className={stylesChatbot.chatbot_description_button}
                        >
                        Courte Description
                    </button>
                    <button role="submit" onClick={() => setInput(longDescription)} className={stylesChatbot.chatbot_description_button}
                        >
                        Longue Description
                    </button>
                </form> 
                }
                {messages.map(message => (
                    <div className={classNames(stylesChatbot.chatbot_message, message.role === "user" ? stylesChatbot.chatbot_user_message : stylesChatbot.chatbot_ai_message)} key={message.id}>
                        <div className={stylesChatbot.chatbot_message_speaker}>
                            {message.role === "user" ? "You:" : message.id.includes("openai") ?
                                <img src={OpenAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                                :
                                <img src={MistralAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.mistral)} />
                            }
                        </div>
                        <div className={stylesChatbot.chatbot_message_content} dangerouslySetInnerHTML={{ __html: render(message.content) }}>
                            {/* {message.content} */}
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


            {/* {isLoading ? (
                <div className={stylesChatbot.chatbot_loading}>
                    <button className={stylesButtons.button_nav_primary} type="button" onClick={() => stop()}>
                        Stop
                    </button>
                    <Loader svgStyle={{ width: "20px", height: "20px" }} />
                </div>
            ) :

            error ? (
                <div className={stylesChatbot.chatbot_error}>
                    <button className={stylesButtons.button_nav_primary} type="button" onClick={() => reload()}>
                        Retry
                    </button>
                    <div>An error occurred.</div>
                </div>
            ) : */}

            <form onSubmit={(event) => handleSubmit(event, {})} className={stylesChatbot.chatbot_user_form}>
                <div>
                {modelSelected.name === "openAI gpt-4o-mini" ? 
                    <img src={OpenAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                    : 
                    <img src={MistralAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.mistral)} />
                    }
                </div>
                <input
                    name="prompt"
                    value={input}
                    onChange={handleInputChange}
                    className={classNames(stylesChatbot.chatbot_user_input, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")}
                    placeholder="Type something"
                />
                <button type="submit" className={stylesChatbot.chatbot_user_form_button}>
                    <SVG svg={sendIcon} ariaHidden />
                </button>
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
    const [showImage, setShowImage] = React.useState(true);

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
                <Dialog.Content className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined} style={{width: "100dvw"}}>
            <style>{`
                #aichat-scroller * {
                    overflow-anchor: none;
                }

                #aichat-anchor {
                    overflow-anchor: auto;
                    height: 1px;
                }
           `}</style>
                    { chatEnabled ?
                        <button onClick={() => enableChat((enabled) => !enabled)} style={{ position: "absolute", top: "10px", left: "10px", zIndex: 105 }} className={stylesButtons.button_transparency_icon}>
                        <SVG ariaHidden={true} svg={BackIcon} style={{transform: "rotate(180deg)"}} />
                    </button>
                    : ""
                    }
                    <Dialog.Close asChild>
                        <button style={{ position: "absolute", top: "10px", right: "10px", zIndex: 105 }} data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                    <div style={{display: "flex", padding: "5px", alignItems: "center", gap: "30px", minHeight: "inherit"}}>
                    {
                        chatEnabled ?


                            <ChatContext.Provider value={{
                                modelSelected,
                                setModel,
                                systemPrompt,
                                setSystemPrompt,
                                showImage: () => enableChat((enabled) => !enabled),
                            }}>
                                <Chat /*imageHrefDataUrl={imageHrefDataUrl}*/ imageHref={href} />
                            </ChatContext.Provider>
                            :
                            ""
                        }
                        <div style={{flex: (showImage || !chatEnabled) ? "1" : "0"}} className={stylesChatbot.image_container}>
                            {chatEnabled ? 
                            <button
                            className={stylesChatbot.image_display_button}
                            title={showImage ? "hide image" : "show image"}
                            style={{right: showImage ? "" : "-5px"}}
                            onClick={() => setShowImage(!showImage)}>
                                <SVG svg={ChevronRight} style={{ transform: showImage ? "" : "rotate(180deg)"}}></SVG>
                            </button>
                            : ""
                            }
                            <TransformWrapper>
                                <TransformComponent wrapperStyle={{ display: "flex", width: "100%", height: "100%", minHeight: "inherit", flex: "1", alignItems: "center" }}>
                                    <img
                                        src={href}
                                        alt="image"
                                        tabIndex={0}
                                        style={{width: "100%", height: "100%", maxHeight: "calc(100vh - 150px)"}}
                                        />
                                </TransformComponent>
                                        {(showImage || !chatEnabled) ?
                                        <Controls chatEnabled={chatEnabled} />
                                        : ""
                                        }
                            </TransformWrapper>
                        </div>
                            { chatEnabled ? "" : 
                    <button className={stylesChatbot.chatbot_open_title} onClick={() => enableChat((enabled) => !enabled)} title={"Chat with AI"}>        
                            <SVG svg={AiIcon} ariaHidden />
                            {/* <h3>Chat with AI</h3> */}
                        </button>
                    }
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    </>);
};
