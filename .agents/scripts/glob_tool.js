// GlobTool - Sovereign File Pattern Matching
// Part of: Aether Engine V11.0 - Zero-Token Orchestration
// Usage: node glob_tool.js "pattern" --base=DIR

const fs = require("fs");
const path = require("path");

class GlobTool {
  constructor(baseDir) {
    this.baseDir = baseDir || process.cwd();
  }

  glob(pattern, options) {
    options = options || {};
    var maxDepth = options.maxDepth || 20;
    var ignore = options.ignore || [];
    var absolute = options.absolute || false;
    var results = [];
    var startDir = this.getStartDir(pattern);

    this.walk(startDir, pattern, 0, maxDepth, results, ignore);

    if (absolute) {
      var self = this;
      return results.map(function (r) {
        return path.resolve(self.baseDir, r);
      });
    }
    return results;
  }

  getStartDir(pattern) {
    var parts = pattern.split("/");
    var basePart = "";

    for (var i = 0; i < parts.length; i++) {
      if (parts[i].indexOf("*") !== -1 || parts[i].indexOf("?") !== -1) break;
      basePart = parts.slice(0, i + 1).join("/");
    }

    return basePart || ".";
  }

  walk(dir, pattern, depth, maxDepth, results, ignore) {
    if (depth > maxDepth) return;

    var entries;
    try {
      entries = fs.readdirSync(path.join(this.baseDir, dir), {
        withFileTypes: true,
      });
    } catch (e) {
      return;
    }

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var fullPath = dir === "." ? entry.name : dir + "/" + entry.name;

      if (
        ignore.some(function (ig) {
          return fullPath.indexOf(ig) !== -1;
        })
      )
        continue;
      if (entry.name.startsWith(".") && pattern.indexOf(".*") === -1) continue;

      if (entry.isDirectory()) {
        this.walk(fullPath, pattern, depth + 1, maxDepth, results, ignore);
      } else {
        if (this.match(fullPath, pattern)) {
          results.push(fullPath);
        }
      }
    }
  }

  match(filePath, pattern) {
    var regex = this.patternToRegex(pattern);
    return regex.test(filePath);
  }

  patternToRegex(pattern) {
    var regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*\/?/g, "___DS___")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "[^/]")
      .replace(/___DS___/g, ".*");

    return new RegExp("^" + regexStr + "$");
  }
}

// CLI
if (require.main === module) {
  var args = process.argv.slice(2);
  var pattern = args[0];

  if (!pattern) {
    console.error(
      'Usage: node glob_tool.js "pattern" [--base=DIR] [--absolute]',
    );
    process.exit(1);
  }

  var baseDir = process.cwd();
  for (var i = 0; i < args.length; i++) {
    if (args[i].startsWith("--base=")) {
      baseDir = args[i].split("=")[1];
    }
  }

  var absolute = args.indexOf("--absolute") !== -1;
  var tool = new GlobTool(baseDir);
  var results = tool.glob(pattern, { absolute: absolute });

  console.log(
    JSON.stringify(
      {
        pattern: pattern,
        count: results.length,
        files: results,
      },
      null,
      2,
    ),
  );
}

module.exports = GlobTool;
