import config from "eslint-config-agent";

// Inlines the package's `eslint-config-agent/recommended` preset: this repo is
// pinned to 3.0.4 (the last release before the 3.0.5 broken-tarball bug, see
// tupe12334/eslint-config-agent#277), and that version only exposes the `.`
// and `./ddd` entry points — the `./recommended` subpath export does not exist
// yet on the installed version. Once a release exporting it is published, this
// whole block can collapse to:
//   import recommended from "eslint-config-agent/recommended";
//   export default recommended;
const noProcessEnvPropertiesConfig = {
  selector:
    "MemberExpression[object.type='MemberExpression'][object.object.name='process'][object.property.name='env']",
  message:
    "Direct access to process.env properties is not allowed. Use process.env as a whole object instead (e.g., validate(process.env)).",
};

const relaxedOverrides = {
  name: "branch-not-behind/recommended-overrides",
  rules: {
    "ddd/require-spec-file": "off",
    "custom/require-spec-file-tsx": "off",
    "single-export/single-export": "off",
    "required-exports/required-exports": "off",
    "error/no-generic-error": "off",
    "error/require-custom-error": "off",
    "error/no-literal-error-message": "off",
    "jsdoc/require-jsdoc": "off",
    "default/no-default-params": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "jsx-classname/require-classname": "off",
    "no-restricted-syntax": ["error", noProcessEnvPropertiesConfig],
  },
};

export default [
  {
    ignores: ["dist/**", "node_modules/**", "vite.config.ts"],
  },
  ...config,
  relaxedOverrides,
];
