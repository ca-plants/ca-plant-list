import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
    {
        files: ["**/*.js"],
        ignores: ["public/**"],
        plugins: {
            js,
        },
        extends: ["js/recommended"],
        rules: {
            strict: "error",
            eqeqeq: "error",
            "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                bootstrap: false,
            },
        },
    },
]);
