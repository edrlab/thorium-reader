// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

const PROFILE_SCREEN_SCOPE_CLASS = "custom-profile-screen";

export type TProfileSelectorItem = {
    type: "attribute" | "class" | "other" | "tag";
    name?: string;
    operator?: string;
};

export type TProfileSelectorCompound = {
    items: TProfileSelectorItem[];
    /** Relationship from this compound to the next one in the selector. */
    combinator?: string;
};

export type TProfileSelectorList = TProfileSelectorCompound[][];

const isThemeAncestor = (compound: TProfileSelectorCompound): boolean =>
    compound.items.length === 2 &&
    compound.items[0].type === "tag" &&
    compound.items[0].name === "body" &&
    compound.items[1].type === "attribute" &&
    compound.items[1].name === "data-theme" &&
    (!compound.items[1].operator || compound.items[1].operator === "=");

const selectorChainTargetsProfileScreen = (chain: TProfileSelectorCompound[]): boolean => {
    if (!chain.length) {
        return false;
    }

    // A normalized selector chain must have one combinator between each pair
    // of compounds and none after the final compound. Reject malformed adapter
    // output instead of interpreting it permissively.
    if (
        chain.some((compound, index) =>
            index < chain.length - 1 ? !compound.combinator : compound.combinator !== undefined,
        )
    ) {
        return false;
    }

    let profileRootIndex = 0;
    if (isThemeAncestor(chain[0])) {
        // The theme condition is only an ancestor qualifier. It cannot be a
        // parent, sibling, or column relationship with the profile root.
        if (chain[0].combinator !== " ") {
            return false;
        }
        profileRootIndex = 1;
    }

    const profileRoot = chain[profileRootIndex];
    if (
        !profileRoot ||
        profileRoot.items[0]?.type !== "class" ||
        profileRoot.items[0].name !== PROFILE_SCREEN_SCOPE_CLASS
    ) {
        return false;
    }

    if (profileRootIndex === chain.length - 1) {
        return true;
    }

    // Once the selector enters the profile subtree, later combinators cannot
    // escape it. Only the first relationship after the profile root decides
    // whether the final selector subject remains contained.
    return profileRoot.combinator === " " || profileRoot.combinator === ">";
};

export const profileSelectorListTargetsProfileScreen = (selectors: TProfileSelectorList): boolean =>
    selectors.length > 0 && selectors.every(selectorChainTargetsProfileScreen);

