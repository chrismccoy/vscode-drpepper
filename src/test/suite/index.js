const fs = require("fs");
const path = require("path");
const Mocha = require("mocha");

async function run() {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname, "..");

  const files = fs
    .readdirSync(testsRoot, { recursive: true })
    .filter((f) => f.endsWith(".test.js"));

  files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

  return new Promise((c, e) => {
    try {
      mocha.run((failures) => {
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`));
        } else {
          c();
        }
      });
    } catch (err) {
      console.error(err);
      e(err);
    }
  });
}

module.exports = { run };
