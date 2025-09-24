import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import remotionPlugin from "@remotion/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["remotion/*.{ts,tsx}"],
    plugins: {
      "@remotion": remotionPlugin,
    },
    rules: {
      ...remotionPlugin.configs.recommended.rules,
    },
  },
];

export default eslintConfig;
