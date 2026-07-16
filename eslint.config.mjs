import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
    js.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ["src/**/*.ts"],

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",

            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },

        rules: {
            "no-console": "off",
            "no-debugger": "warn",

            "@typescript-eslint/no-explicit-any": "warn",

            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],

            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },

    {
        ignores: [
            "node_modules/**",
            "dist/**",
            "main.js",
        ],
    },
);