const assert = require("assert");

const vscode = require("vscode");
const {
  API_URL,
  PARAGRAPH_COUNTS,
  commandId,
  insertIpsum,
} = require("../../extension");

const manifest = require("../../../package.json");

const PARAS = [
  "Dr Pepper lorem ipsum. Bubbly bold.",
  "Cola dr consectetur fizzy.",
];

suite("Extension Test Suite", () => {
  const realFetch = globalThis.fetch;
  let requests;
  let reply;

  setup(() => {
    requests = [];
    reply = () => Response.json({ paragraphs: PARAS });
    globalThis.fetch = async (input, init) => {
      if (String(input) !== API_URL) {
        return realFetch(input, init);
      }
      requests.push({
        url: String(input),
        method: init?.method,
        accept: new Headers(init?.headers).get("Accept") ?? undefined,
        paragraphs:
          init?.body instanceof URLSearchParams
            ? init.body.get("paragraphs")
            : undefined,
      });
      return reply();
    };
  });

  teardown(async () => {
    globalThis.fetch = realFetch;
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  const openEditor = async (content = "") => {
    const doc = await vscode.workspace.openTextDocument({ content });
    return vscode.window.showTextDocument(doc);
  };

  test("does not fetch when no editor is open", async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await insertIpsum(3);
    assert.deepStrictEqual(requests, []);
  });

  test("inserts paragraphs joined by blank lines at the cursor", async () => {
    const editor = await openEditor("AB");
    editor.selection = new vscode.Selection(0, 1, 0, 1);
    await insertIpsum(3);
    assert.strictEqual(
      editor.document.getText(),
      `A${PARAS[0]}\n\n${PARAS[1]}B`,
    );
  });

  test("inserts nothing when the API returns an HTTP error", async () => {
    reply = () => new Response("oops", { status: 500 });
    const editor = await openEditor("keep");
    await insertIpsum(1);
    assert.strictEqual(editor.document.getText(), "keep");
  });

  test("inserts nothing when the API returns an unexpected shape", async () => {
    reply = () => Response.json({ error: "nope" });
    const editor = await openEditor("keep");
    await insertIpsum(1);
    assert.strictEqual(editor.document.getText(), "keep");
  });

  test("commands are in the editor right-click submenu and hidden from the Command Palette", () => {
    const ext = vscode.extensions.getExtension(
      `${manifest.publisher}.${manifest.name}`,
    );
    assert.ok(ext, "extension is loaded under its manifest ID");
    const menus = ext.packageJSON.contributes.menus;
    assert.ok(
      menus["editor/context"].some(
        (m) => m.submenu === "vscode-drpepper.submenu",
      ),
    );
    const ids = PARAGRAPH_COUNTS.map(commandId);
    assert.deepStrictEqual(
      menus["vscode-drpepper.submenu"].map((m) => m.command),
      ids,
    );
    for (const id of ids) {
      assert.ok(
        menus.commandPalette.some(
          (m) => m.command === id && m.when === "false",
        ),
        id,
      );
    }
  });

  for (const paragraphs of PARAGRAPH_COUNTS) {
    test(`${commandId(paragraphs)} POSTs paragraphs=${paragraphs} asking for JSON`, async () => {
      const editor = await openEditor();
      await vscode.commands.executeCommand(commandId(paragraphs));
      assert.deepStrictEqual(requests, [
        {
          url: API_URL,
          method: "POST",
          accept: "application/json",
          paragraphs: String(paragraphs),
        },
      ]);
      assert.strictEqual(editor.document.getText(), PARAS.join("\n\n"));
    });
  }
});
