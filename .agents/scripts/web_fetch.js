/**
 * 🟣 WebFetch — Sovereign HTTP Fetcher
 * Part of: Aether Engine V11.0 — Zero-Token Orchestration
 *
 * Usage: node web_fetch.js "https://..." [--timeout=10000]
 * Bridge: TELEPATHY: webfetch "url" → bridge.json
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

class WebFetch {
  constructor(options = {}) {
    this.timeout = options.timeout || 15000;
    this.maxRedirects = options.maxRedirects || 5;
    this.userAgent = "Aether-Engine-V11.0-Sovereign";
  }

  async fetch(urlString, options = {}) {
    const startTime = Date.now();
    let redirectCount = 0;

    const doFetch = (currentUrl) => {
      return new Promise((resolve, reject) => {
        const url = new URL(currentUrl);
        const client = url.protocol === "https:" ? https : http;
        const timeout = options.timeout || this.timeout;

        const reqOptions = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method: options.method || "GET",
          headers: {
            "User-Agent": this.userAgent,
            Accept: "text/html,application/json,text/plain,*/*",
            ...(options.headers || {}),
          },
          timeout,
        };

        const req = client.request(reqOptions, (res) => {
          // Handle redirects
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode) &&
            res.headers.location
          ) {
            if (redirectCount >= this.maxRedirects) {
              resolve({
                success: false,
                error: `Too many redirects (max: ${this.maxRedirects})`,
                statusCode: res.statusCode,
                duration_ms: Date.now() - startTime,
              });
              return;
            }
            redirectCount++;
            const redirectUrl = new URL(res.headers.location, currentUrl).href;
            resolve(doFetch(redirectUrl));
            return;
          }

          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const body = Buffer.concat(chunks);
            const contentType = res.headers["content-type"] || "";

            let data;
            if (contentType.includes("application/json")) {
              try {
                data = JSON.parse(body.toString());
              } catch {
                data = body.toString();
              }
            } else {
              data = body.toString();
            }

            resolve({
              success: res.statusCode >= 200 && res.statusCode < 400,
              statusCode: res.statusCode,
              headers: res.headers,
              contentType,
              body: data,
              size_bytes: body.length,
              duration_ms: Date.now() - startTime,
              redirects: redirectCount,
              url: currentUrl,
            });
          });
        });

        req.on("error", (err) => {
          resolve({
            success: false,
            error: err.message,
            code: err.code,
            duration_ms: Date.now() - startTime,
            url: currentUrl,
          });
        });

        req.on("timeout", () => {
          req.destroy();
          resolve({
            success: false,
            error: `Request timeout (${timeout}ms)`,
            duration_ms: Date.now() - startTime,
            url: currentUrl,
          });
        });

        if (options.body) {
          req.write(
            typeof options.body === "string"
              ? options.body
              : JSON.stringify(options.body),
          );
        }

        req.end();
      });
    };

    return doFetch(urlString);
  }
}

// CLI — only run when executed directly (not when required)
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    const url = args.find((a) => a.startsWith("http"));

    if (!url) {
      console.log(
        JSON.stringify({
          error: "URL required",
          usage: 'node web_fetch.js "https://example.com" [--timeout=10000]',
        }),
      );
      process.exit(1);
    }

    const timeoutArg = args.find((a) => a.startsWith("--timeout="));
    const timeout = timeoutArg ? parseInt(timeoutArg.split("=")[1]) : 15000;

    const fetcher = new WebFetch({ timeout });
    const result = await fetcher.fetch(url);
    console.log(JSON.stringify(result, null, 2));
  }

  main().catch((err) => {
    console.log(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  });
}

module.exports = { WebFetch };
