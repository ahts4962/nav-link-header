import globals from "globals";
import jsEslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import tsEslintParser from "@typescript-eslint/parser";
import eslintPluginSvelte from "eslint-plugin-svelte";
import svelteEslintParser from "svelte-eslint-parser";

export default tsEslint.config(
	jsEslint.configs.recommended,
	{
		files: ["**/*.ts", "**/*.svelte"],
		extends: [...tsEslint.configs.recommendedTypeChecked],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".svelte"],
			},
		},
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
			"@typescript-eslint/ban-ts-comment": "off",
			"no-prototype-builtins": "off",
			"@typescript-eslint/no-empty-function": "off",
		},
	},
	{
		files: ["**/*.svelte"],
		extends: [...eslintPluginSvelte.configs["flat/recommended"]],
		languageOptions: {
			parser: svelteEslintParser,
			parserOptions: {
				parser: tsEslintParser,
			},
		},
	},
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: globals.node,
		},
	},
	{
		ignores: ["main.js", "*.mjs"],
	}
);
