// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import fs from "fs";
import path from "path";
import { app } from "electron";
import { IProfile } from "readium-desktop/common/redux/states/profile";

const profilesDir = path.join(app.getAppPath(), "src", "resources", "profiles");

// Optionnal validation function
const isValidProfile = (profile: any): profile is IProfile => {
    return profile && 
           typeof profile === "object" && 
           profile.version === 1 &&
           profile.links.feeds.length > 0 &&
           // Required properties from IProfile
           // For example : typeof profile.id === 'string' && typeof profile.name === 'string'
           true;
};

export const loadProfilesAsync = async (): Promise<IProfile[]> => {
    const profiles: IProfile[] = [];

    try {
        if (!fs.existsSync(profilesDir)) {
            console.warn(`Profiles folder does not exist : ${profilesDir}`);
            return profiles;
        }

        const files = await fs.promises.readdir(profilesDir);
        
        const profilePromises = files
            .filter(file => file.endsWith(".json"))
            .map(async (file) => {
                const filePath = path.join(profilesDir, file);
                
                try {
                    const content = await fs.promises.readFile(filePath, "utf-8");
                    const profile = JSON.parse(content) as IProfile;
                    
                    if (isValidProfile(profile)) {
                        return profile;
                    } else {
                        console.warn(`Ignored invalid profile : ${file}`);
                        return null;
                    }
                } catch (fileError) {
                    console.error(`Error while handling file ${file} :`, fileError);
                    return null;
                }
            });

        const results = await Promise.all(profilePromises);
        profiles.push(...results.filter((profile): profile is IProfile => profile !== null));
        
    } catch (dirError) {
        console.error("Error while reading profiles directory:", dirError);
    }

    return profiles;
};
