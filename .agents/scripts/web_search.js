/**
 * 🟣 WebSearch — Sovereign Web Search (DuckDuckGo HTML fallback)
 * Part of: Aether Engine V11.0 — Zero-Token Orchestration
 *
 * Usage: node web_search.js "query" [--count=5]
 * Bridge: TELEPATHY: websearch "query" → bridge.json
 *
 * Uses DuckDuckGo HTML (no API key needed) as primary,
 * with fallback to direct URL fetch.
 */

const https = require("https");
const { WebFetch } = require("./web_fetch");

class WebSearch {
  constructor(options = {}) {
    this.timeout = options.timeout || 15000;
    this.fetcher = new WebFetch({ timeout: this.timeout });
  }

  async search(query, options = {}) {
    const count = options.count || 5;
    const startTime = Date.now();

    try {
      // DuckDuckGo HTML search (no API key required)
      const encodedQuery = encodeURIComponent(query);
      const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

      const result = await this.fetcher.fetch(url, {
        timeout: this.timeout,
      });

      if (!result.success) {
        return this.fallbackSearch(query, count, startTime);
      }

      const results = this.parseDuckDuckGoHTML(result.body, count);

      return {
        success: true,
        query,
        count: results.length,
        results,
        engine: "duckduckgo",
        duration_ms: Date.now() - startTime,
      };
    } catch (err) {
      return this.fallbackSearch(query, count, startTime);
    }
  }

  parseDuckDuckGoHTML(html, count) {
    const results = [];

    // Extract result blocks
    const resultRegex =
      /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    let match;
    while (
      (match = resultRegex.exec(html)) !== null &&
      results.length < count
    ) {
      results.push({
        title: this.stripHtml(match[2]).trim(),
        url: match[1],
        snippet: this.stripHtml(match[3]).trim(),
      });
    }

    // Fallback: simpler extraction
    if (results.length === 0) {
      const linkRegex =
        /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      while (
        (match = linkRegex.exec(html)) !== null &&
        results.length < count
      ) {
        results.push({
          title: this.stripHtml(match[2]).trim(),
          url: match[1],
          snippet: "",
        });
      }
    }

    return results;
  }

  stripHtml(str) {
    return str
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  }

  fallbackSearch(query, count, startTime) {
    return {
      success: false,
      query,
      count: 0,
      results: [],
      engine: "fallback",
      error: "Search unavailable — try direct URL fetch",
      suggestion: `Try: node web_fetch.js "https://www.google.com/search?q=${encodeURIComponent(query)}"`,
      duration_ms: Date.now() - startTime,
    };
  }
}

// CLI — only run when executed directly
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    const query = args.find((a) => !a.startsWith("--"));

    if (!query) {
      console.log(
        JSON.stringify({
          error: "Query required",
          usage: 'node web_search.js "search query" [--count=5]',
        }),
      );
      process.exit(1);
    }

    const countArg = args.find((a) => a.startsWith("--count="));
    const count = countArg ? parseInt(countArg.split("=")[1]) : 5;

    const searcher = new WebSearch();
    const result = await searcher.search(query, { count });
    console.log(JSON.stringify(result, null, 2));
  }

  main().catch((err) => {
    console.log(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  });
}

module.exports = { WebSearch };
