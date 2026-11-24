import prettier from "eslint-config-prettier";

export default [
  prettier,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
    },
    rules: {
      curly: "warn",
      eqeqeq: "warn",
      "no-throw-literal": "warn",
    },
  },
];
