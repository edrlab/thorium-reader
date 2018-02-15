module.exports = {
    plugins: [
        require("postcss-import")(),
        require("postcss-cssnext")({
            // CSS compatible with the last 4 chrome versions
            browsers: ["last 4 Chrome versions"],
        }),
    ],
};
