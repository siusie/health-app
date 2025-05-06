import { FlatCompat } from "@eslint/eslintrc";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: process.cwd(), // Ensure the correct base directory
  resolvePluginsRelativeTo: __dirname, // Resolve plugins relative to this config file
});

// Use the correct flat config format
export default [
  ...compat.extends("next/core-web-vitals", "prettier"),
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parser: require("@babel/eslint-parser"),
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [require.resolve("next/babel")],
        },
      },
    },
    rules: {
      semi: ["error"],
      // Add your custom rules here
    },
  },
];
