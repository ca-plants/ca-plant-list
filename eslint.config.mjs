import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ["**/*.{js,mjs,cjs}"], ignores: ["output/**"] },
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node, bootstrap: false },
        },
    },
    pluginJs.configs.recommended,
];
