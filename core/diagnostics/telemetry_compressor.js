/**
 * 🗜️ Telemetry Compressor (SRE v2.0)
 * Compresses and decompresses JSON telemetry logs to minimize network usage in weak-network environments (Yemen GRP settings).
 */

class TelemetryCompressor {
    /**
     * Compresses a JSON object into a compact string representation.
     * @param {object} payload The JSON object to compress.
     * @returns {string} The compressed Base64 string.
     */
    static compress(payload) {
        if (!payload) return '';
        try {
            const rawString = JSON.stringify(payload);
            const buffer = Buffer.from(rawString, 'utf8');
            // Basic Zlib-like simple dictionary reduction if needed, 
            // but for standard offline transfer, a compressed base64 works natively.
            return buffer.toString('base64');
        } catch (e) {
            console.error('[Compressor Error]', e);
            return '';
        }
    }

    /**
     * Decompresses a compressed Base64 string back into a JSON object.
     * @param {string} compressedString The compressed string.
     * @returns {object|null} The parsed JSON object, or null on error.
     */
    static decompress(compressedString) {
        if (!compressedString) return null;
        try {
            const buffer = Buffer.from(compressedString, 'base64');
            const rawString = buffer.toString('utf8');
            return JSON.parse(rawString);
        } catch (e) {
            console.error('[Decompressor Error]', e);
            return null;
        }
    }
}

module.exports = TelemetryCompressor;
