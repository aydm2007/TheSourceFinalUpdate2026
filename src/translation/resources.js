// Translation dictionaries loader (CommonJS)
// Place JSON files in src/translation/dictionaries/<lang>.json
const fs = require("fs");
const path = require("path");

/** Cache loaded dictionaries */
const cache = {};

/** Load dictionary for a given language */
function loadDictionary(lang) {
  if (cache[lang]) return cache[lang];
  const dictPath = path.resolve(__dirname, "dictionaries", `${lang}.json`);
  if (!fs.existsSync(dictPath)) {
    throw new Error(
      `Dictionary for language '${lang}' not found at ${dictPath}`,
    );
  }
  const raw = fs.readFileSync(dictPath, "utf-8");
  const dict = JSON.parse(raw);
  cache[lang] = dict;
  return dict;
}

module.exports = { loadDictionary };
