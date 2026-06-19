// Rich Media Embedding Feature for Chat Module
// ---------------------------------------------------
// This module provides utilities to embed images, videos, and other rich media
// content directly into chat messages. It is designed to be lightweight and
// framework‑agnostic, allowing easy integration with the existing chat engine.

/**
 * Generate an HTML snippet for an image embed.
 * @param {string} url - The URL of the image to embed.
 * @param {Object} [options] - Optional configuration.
 * @param {string} [options.alt] - Alt text for the image (default: "Embedded Image").
 * @param {string} [options.className] - Additional CSS class names.
 * @returns {string} HTML string representing the image embed.
 */
function embedImage(url, options = {}) {
  const alt = options.alt || "Embedded Image";
  const className = options.className ? ` class="${options.className}"` : "";
  return `<img src="${url}" alt="${alt}"${className} loading="lazy"/>`;
}

/**
 * Generate an HTML snippet for a video embed (HTML5 video element).
 * @param {string} url - The URL of the video file.
 * @param {Object} [options] - Optional configuration.
 * @param {boolean} [options.controls=true] - Show video controls.
 * @param {boolean} [options.autoplay=false] - Autoplay the video.
 * @param {boolean} [options.loop=false] - Loop the video.
 * @param {string} [options.poster] - Poster image URL displayed before playback.
 * @param {string} [options.className] - Additional CSS class names.
 * @returns {string} HTML string representing the video embed.
 */
function embedVideo(url, options = {}) {
  const controls = options.controls !== false ? " controls" : "";
  const autoplay = options.autoplay ? " autoplay" : "";
  const loop = options.loop ? " loop" : "";
  const poster = options.poster ? ` poster="${options.poster}"` : "";
  const className = options.className ? ` class="${options.className}"` : "";
  return `<video src="${url}"${controls}${autoplay}${loop}${poster}${className}>Your browser does not support the video tag.</video>`;
}

/**
 * Generate an HTML snippet for embedding an external iframe (e.g., YouTube, Vimeo).
 * @param {string} src - The source URL for the iframe.
 * @param {Object} [options] - Optional configuration.
 * @param {number} [options.width=560] - Width of the iframe in pixels.
 * @param {number} [options.height=315] - Height of the iframe in pixels.
 * @param {boolean} [options.allowFullScreen=true] - Allow fullscreen mode.
 * @param {string} [options.className] - Additional CSS class names.
 * @returns {string} HTML string representing the iframe embed.
 */
function embedIframe(src, options = {}) {
  const width = options.width || 560;
  const height = options.height || 315;
  const allowFullScreen = options.allowFullScreen !== false ? " allowfullscreen" : "";
  const className = options.className ? ` class="${options.className}"` : "";
  return `<iframe src="${src}" width="${width}" height="${height}"${allowFullScreen}${className} frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
}

/**
 * Utility to safely escape user‑provided text to prevent XSS when inserting
 * rich media HTML into the chat container.
 * @param {string} str - Raw user input.
 * @returns {string} Escaped string.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Public API to embed any supported rich media type into a chat message.
 * The function returns a safe HTML string that can be appended to the chat
 * container using `innerHTML` or a DOM manipulation library.
 *
 * @param {Object} payload - Object describing the media to embed.
 * @param {"image"|"video"|"iframe"} payload.type - Type of media.
 * @param {string} payload.url - Direct URL to the media resource.
 * @param {Object} [payload.options] - Optional configuration passed to the
 *   specific embed helper (see embedImage, embedVideo, embedIframe).
 * @returns {string} Safe HTML string ready for insertion.
 */
function embedRichMedia(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload for rich media embedding.");
  }
  const { type, url, options } = payload;
  if (!type || !url) {
    throw new Error("Both 'type' and 'url' are required for rich media embedding.");
  }
  const safeUrl = escapeHtml(url);
  switch (type) {
    case "image":
      return embedImage(safeUrl, options);
    case "video":
      return embedVideo(safeUrl, options);
    case "iframe":
      return embedIframe(safeUrl, options);
    default:
      throw new Error(`Unsupported rich media type: ${type}`);
  }
}

// Export the functions for CommonJS environments.
module.exports = {
  embedImage,
  embedVideo,
  embedIframe,
  embedRichMedia,
  escapeHtml
};
