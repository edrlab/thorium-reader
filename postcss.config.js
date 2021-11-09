const path = require("path");

module.exports = {
    plugins: [
        // require("postcss-import")({
        //     filter: (...p) => {
        //         // const ok = p && p.indexOf("mixin") >= 0;
        //         console.log("POSTCSS IMPORT =====> ", p);
        //         return false;
        //     },
        // }),
        require("postcss-mixins")({
            mixinsFiles: path.join(__dirname, "src/renderer/assets/styles", "**/*(mixin|mixins).css"),
        }),
        require("postcss-cssnext")({
            // CSS compatible with the last 4 chrome versions
            browsers: ["last 4 Chrome versions"],
            // features: {
            //     customProperties: {
            //         variables: {
            //             "main-color": "#4d4d4d",
            //             "secondary-color": "white",
            //             "disabled-color": "#767676",
            //             "color-primary": "#4d4d4d",
            //             "color-secondary": "#fff",
            //             "color-tertiary": "#67a3e0",
            //             "color-disabled": "#b7b7b7",
            //             "color-light-grey": "#f1f1f1",
            //             "color-medium-grey": "#e5e5e5",
            //             "color-accent": "rgb(0, 188, 212)",
            //             "color-accent-contrast": "#fff",
            //         },
            //     },
            // },
        }),
    ],
};
