import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Audit (2026-02-26): zero uses of dangerouslySetInnerHTML found in the
      // codebase — all user-generated content is rendered via React JSX which
      // escapes HTML by default.  This rule enforces that going forward.
      "react/no-danger": "error",
    },
  },
];

export default eslintConfig;
