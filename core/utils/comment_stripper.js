/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ✂️ Quantum Comment Stripper & Token Compressor (V1)       │
 * │  Strips redundant JS/TS/Python comments and boilerplate     │
 * │  to minimize token consumption for AI agents.               │
 * └─────────────────────────────────────────────────────────────┘
 */

class CommentStripper {
    /**
     * Strips JS/TS style block and line comments.
     */
    stripJS(code) {
        if (typeof code !== 'string') return '';
        
        // Remove block comments /* ... */
        let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove single line comments // ... (taking care not to match URL protocols)
        cleaned = cleaned.replace(/^(?!\s*https?:\/\/)\s*\/\/.*$/gm, '');
        cleaned = cleaned.replace(/(\s)+(\/\/)(?!.*https?:\/\/).*$/gm, '$1');
        
        // Collapse multiple blank lines into a single blank line
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return cleaned.trim();
    }

    /**
     * Strips Python style block and line comments.
     */
    stripPython(code) {
        if (typeof code !== 'string') return '';

        // Remove block docstrings """ ... """ and ''' ... '''
        let cleaned = code.replace(/"""[\s\S]*?"""/g, '');
        cleaned = cleaned.replace(/'''[\s\S]*?'''/g, '');

        // Remove single line comments # ...
        cleaned = cleaned.replace(/^\s*#.*$/gm, '');
        cleaned = cleaned.replace(/(\s)+#.*$/gm, '$1');

        // Collapse multiple blank lines
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

        return cleaned.trim();
    }

    /**
     * Strips comments based on file extension.
     */
    compress(filePath, content) {
        if (!content) return '';
        const ext = filePath.split('.').pop().toLowerCase();
        
        if (['js', 'ts', 'jsx', 'tsx', 'json', 'css', 'scss'].includes(ext)) {
            return this.stripJS(content);
        } else if (['py', 'yaml', 'yml', 'ini', 'toml'].includes(ext)) {
            return this.stripPython(content);
        }
        
        // Fallback: return trimmed content
        return content.trim();
    }
}

module.exports = new CommentStripper();
