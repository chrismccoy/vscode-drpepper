"use strict";

const vscode = require("vscode");

// Base URL for the DrPepper Ipsum generator API.
const API_URL = "https://drpepperipsum.com/api";

// Supported paragraph counts exposed as individual VS Code commands.
const PARAGRAPH_COUNTS = Object.freeze([1, 3, 5, 10]);

const COMMAND_PREFIX = "vscode-drpepper.paragraphs";

const REQUEST_TIMEOUT_MS = 10_000;

let outputChannel;

function getOutputChannel() {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("DrPepper Ipsum");
  }
  return outputChannel;
}

function log(message) {
  getOutputChannel().appendLine(`[${new Date().toISOString()}] ${message}`);
}

const commandId = (paragraphs) => `${COMMAND_PREFIX}${paragraphs}`;

function isValidIpsumResponse(data) {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray(data.paragraphs) &&
    data.paragraphs.every((p) => typeof p === "string")
  );
}

// Fetches a block of "DrPepper Ipsum" text from the remote API.
async function fetchIpsum(
  paragraphs,
  signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS),
) {
  if (!Number.isInteger(paragraphs) || paragraphs <= 0) {
    throw new Error(`Invalid paragraph count: ${paragraphs}`);
  }

  let data;
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({ paragraphs: String(paragraphs) }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`DrPepper Ipsum API returned HTTP ${response.status}`);
    }

    data = await response.json();
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error("Request timed out");
    }
    throw err;
  }

  if (!isValidIpsumResponse(data)) {
    throw new Error("DrPepper Ipsum API returned an unexpected response");
  }

  if (data.paragraphs.length === 0) {
    throw new Error("DrPepper Ipsum API returned no paragraphs");
  }

  return data.paragraphs.join("\n\n");
}

// Fetches ipsum text and inserts it into the active text editor
async function insertIpsum(paragraphs) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage("Editor does not exist");
    return;
  }

  try {
    const text = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating DrPepper Ipsum…",
        cancellable: false,
      },
      () => fetchIpsum(paragraphs),
    );

    const inserted = await editor.edit((edit) => {
      edit.insert(editor.selection.active, text);
    });

    if (!inserted) {
      throw new Error("Editor rejected the edit operation");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`Failed to insert ${paragraphs} paragraph(s): ${message}`);
    vscode.window.showErrorMessage(
      `Could not generate DrPepper Ipsum: ${message}`,
    );
  }
}

function activate(context) {
  for (const paragraphs of PARAGRAPH_COUNTS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(commandId(paragraphs), () =>
        insertIpsum(paragraphs),
      ),
    );
  }
  context.subscriptions.push(getOutputChannel());
}

function deactivate() {}

module.exports = {
  API_URL,
  PARAGRAPH_COUNTS,
  commandId,
  activate,
  fetchIpsum,
  insertIpsum,
  deactivate,
};
