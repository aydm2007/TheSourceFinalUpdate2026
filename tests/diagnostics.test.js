import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ArabicErrorMapper = require('../core/diagnostics/arabic_error_mapper.js');
const VisualTopologyGenerator = require('../core/diagnostics/visual_topology_generator.js');
const TelemetryCompressor = require('../core/diagnostics/telemetry_compressor.js');
const SecurityRedactor = require('../core/diagnostics/security_redactor.js');

describe('SRE v2.0 Core Diagnostics Components', () => {
    it('ArabicErrorMapper - should translate system errors', () => {
        const err = { code: 'ENOENT', message: 'File not found' };
        const translation = ArabicErrorMapper.translate(err);
        expect(translation).toContain('غير موجود');
    });

    it('ArabicErrorMapper - should identify SyntaxError pattern', () => {
        const msg = 'SyntaxError: Unexpected token';
        const translation = ArabicErrorMapper.translate(msg);
        expect(translation).toContain('خطأ في صياغة وقواعد بناء الكود');
    });

    it('VisualTopologyGenerator - should output Mermaid format', () => {
        const agents = [{ id: 'a1', name: 'Translator', type: 'General' }];
        const mermaid = VisualTopologyGenerator.generateMermaid(agents);
        expect(mermaid).toContain('🤖 Translator');
        expect(mermaid).toContain('flowchart TD');
    });

    it('VisualTopologyGenerator - should output SVG format', () => {
        const agents = [{ id: 'a1', name: 'Translator', type: 'General' }];
        const svg = VisualTopologyGenerator.generateSVG(agents);
        expect(svg).toContain('<svg');
        expect(svg).toContain('Translator');
    });

    it('TelemetryCompressor - should compress and decompress correctly', () => {
        const payload = { test: 'value', number: 42 };
        const compressed = TelemetryCompressor.compress(payload);
        const decompressed = TelemetryCompressor.decompress(compressed);
        expect(decompressed).toEqual(payload);
    });

    it('SecurityRedactor - should scrub raw api keys', () => {
        const text = 'API_KEY = sk-ant-123456789abcde';
        const redacted = SecurityRedactor.redact(text);
        expect(redacted).toContain('[REDACTED_SECRET]');
        expect(redacted).not.toContain('sk-ant-123456789abcde');
    });
});
