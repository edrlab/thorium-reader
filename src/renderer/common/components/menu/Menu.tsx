// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
// import * as ReactDOM from "react-dom";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import classNames from "classnames";
// import * as FocusScope from "@radix-ui/react-focus-scope";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    button: React.ReactElement;
    advancedTrigger?: boolean;
}

const Menu = (props: React.PropsWithChildren<IBaseProps>) => {

    const [triggerOpen, setTriggerOpen] = React.useState(false);

    return (
        <Popover.Root onOpenChange={setTriggerOpen} open={triggerOpen}>
            <Popover.Trigger className={classNames(stylesDropDown.dropdown_trigger, triggerOpen ? "popover_open" : "")}>
                    {props.button}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content sideOffset={5} align="end" alignOffset={-10} hideWhenDetached style={{zIndex: props.advancedTrigger ? 1000 : "auto"}}>
                    <div className={stylesDropDown.dropdown_menu}>
                        {props.children}
                    </div>
                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

// interface IBaseProps {
//     button: React.ReactElement;
//     advancedTrigger?: boolean;
// }

// const Menu = (props: React.PropsWithChildren<IBaseProps>) => {
//     const [triggerOpen, setTriggerOpen] = React.useState(false);
//     const [triggerVisible] = React.useState(true);
//     const [coords, setCoords] = React.useState({ top: 0, left: 0, placement: "bottom" as "top" | "bottom" });

//     const advancedTrigger = props.advancedTrigger ?? false;

//     const triggerRef = React.useRef<HTMLButtonElement>(null);
//     const menuRef = React.useRef<HTMLDivElement>(null);

//     const updatePosition = React.useCallback(() => {
//         const trigger = triggerRef.current;
//         const menu = menuRef.current;
//         if (!trigger || !menu) return;

//         const triggerRect = trigger.getBoundingClientRect();
//         const menuRect = menu.getBoundingClientRect();
//         const viewportHeight = window.innerHeight;
//         const viewportWidth = window.innerWidth;
//         const gap = 5;

//         const spaceBelow = viewportHeight - triggerRect.bottom;
//         const spaceAbove = triggerRect.top;

//         let placement: "top" | "bottom" = "bottom";
//         let top: number;

//         if (spaceBelow < menuRect.height + gap && spaceAbove > spaceBelow) {
//             placement = "top";
//             top = triggerRect.top - menuRect.height - gap;
//         } else {
//             placement = "bottom";
//             top = triggerRect.bottom + gap;
//         }

//         let left = triggerRect.right - menuRect.width;
//         left = Math.max(8, Math.min(left, viewportWidth - menuRect.width - 8));

//         setCoords({ top, left, placement });
//     }, []);

//     React.useLayoutEffect(() => {
//         if (!triggerOpen) return undefined;

//         updatePosition();

//         const handleReposition = () => updatePosition();
//         window.addEventListener("scroll", handleReposition, true);
//         window.addEventListener("resize", handleReposition);

//         return () => {
//             window.removeEventListener("scroll", handleReposition, true);
//             window.removeEventListener("resize", handleReposition);
//         };
//     }, [triggerOpen, updatePosition]);

//     const isDisplayed = triggerOpen && triggerVisible;

//     React.useEffect(() => {
//         if (!triggerOpen || !triggerRef.current) return undefined;

//         const observer = new IntersectionObserver(
//             ([entry]) => {
//                 if (!entry.isIntersecting) {
//                     setTriggerOpen(false);
//                 }
//             },
//             { threshold: 0 },
//         );

//         observer.observe(triggerRef.current);
//         return () => observer.disconnect();
//     }, [triggerOpen]);

//     React.useEffect(() => {
//         if (!isDisplayed) return undefined;

//         const handleKeyDownGlobal = (e: KeyboardEvent) => {
//             if (e.key === "Escape") {
//                 e.stopPropagation();
//                 e.preventDefault();
//                 e.stopImmediatePropagation();

//                 setTriggerOpen(false);
//                 triggerRef.current?.focus();
//             }
//         };
//         window.addEventListener("keydown", handleKeyDownGlobal, true);
//         return () => window.removeEventListener("keydown", handleKeyDownGlobal, true);
//     }, [isDisplayed]);

//     return (
//         <>
//             <button
//                 ref={triggerRef}
//                 className={classNames(stylesDropDown.dropdown_trigger, isDisplayed ? "popover_open" : "")}
//                 onClick={() => setTriggerOpen((v) => !v)}
//                 aria-haspopup="true"
//                 aria-expanded={isDisplayed}
//             >
//                 {props.button}
//             </button>

//             {isDisplayed && ReactDOM.createPortal(
//                 <FocusScope.Root asChild loop trapped>
//                     <div
//                         ref={menuRef}
//                         role="menu"
//                         tabIndex={-1}
//                         style={{
//                             position: "fixed",
//                             top: coords.top,
//                             left: coords.left,
//                             zIndex: advancedTrigger ? 1000 : 100,
//                             willChange: "transform",
//                             outline: "none",
//                         }}
//                     >
//                         <div className={stylesDropDown.dropdown_menu} data-placement={coords.placement} data-trigger={advancedTrigger}>
//                             {props.children}
//                         </div>
//                     </div>
//                 </FocusScope.Root>,
//                 document.body,
//             )}
//         </>
//     );
// };

export default Menu;
