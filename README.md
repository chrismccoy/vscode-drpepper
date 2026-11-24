# DrPepper Ipsum

DrPepper Ipsum is a vscode extension that inserts Dr Pepper ipsum from https://drpepperipsum.com.

## Usage

Right-click where you want the text and Choose **DrPepper Ipsum**
Pick 1, 3, 5 or 10 paragraphs.
Inserts the generated text into the cursor position.

## Development

```sh
npm install
```

| Command                     | What it does                                                 |
| --------------------------- | ------------------------------------------------------------ |
| `npm run build`             | Packages the extension as `vscode-drpepper-<version>.vsix`.  |
| `npm run install:extension` | Builds, then installs the `.vsix` into VS Code with `code`.  |
| `npm test`                  | Lints, then runs the tests inside VS Code.                   |
| `npm run lint`              | Runs ESLint on `src`.                                        |
| `npm run format`            | Formats all files with Prettier.                             |
| `npm run format:check`      | Reports files that are not formatted, without changing them. |
