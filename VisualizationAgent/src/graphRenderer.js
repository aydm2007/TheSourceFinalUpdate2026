// src/graphRenderer.js
// Utility module to generate interactive SVG network graphs and dynamic Mermaid flowcharts.
// Exported functions:
//   - renderSvgGraph(nodes, edges, options) -> string (SVG markup)
//   - renderMermaidDiagram(definition, options) -> string (HTML snippet with Mermaid init)

/**
 * Generate an SVG representation of a simple force‑directed network graph.
 * @param {Array<{id:string,label:string}>} nodes - List of node objects.
 * @param {Array<{source:string,target:string}>} edges - List of edge objects.
 * @param {Object} [options] - Optional configuration.
 * @returns {string} SVG markup string.
 */
function renderSvgGraph(nodes, edges, options = {}) {
  const width = options.width || 800;
  const height = options.height || 600;
  const radius = options.nodeRadius || 20;
  const color = options.nodeColor || '#4a90e2';
  const edgeColor = options.edgeColor || '#999';

  // Simple circular layout for deterministic output (no d3 dependency).
  const angleStep = (2 * Math.PI) / nodes.length;
  const positions = {};
  nodes.forEach((node, i) => {
    const angle = i * angleStep;
    const x = width / 2 + (width / 2 - radius - 10) * Math.cos(angle);
    const y = height / 2 + (height / 2 - radius - 10) * Math.sin(angle);
    positions[node.id] = { x, y };
  });

  const svgParts = [];
  svgParts.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);

  // Draw edges first (so they appear beneath nodes)
  edges.forEach(edge => {
    const src = positions[edge.source];
    const tgt = positions[edge.target];
    if (!src || !tgt) return; // skip missing nodes
    svgParts.push(
      `<line x1="${src.x}" y1="${src.y}" x2="${tgt.x}" y2="${tgt.y}" stroke="${edgeColor}" stroke-width="2" />`
    );
  });

  // Draw nodes
  nodes.forEach(node => {
    const pos = positions[node.id];
    svgParts.push(
      `<circle cx="${pos.x}" cy="${pos.y}" r="${radius}" fill="${color}" />`
    );
    // Label
    svgParts.push(
      `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dy="0.35em" fill="#fff" font-size="12" font-family="Arial,Helvetica,sans-serif">${node.label}</text>`
    );
  });

  svgParts.push('</svg>');
  return svgParts.join('\n');
}

/**
 * Generate an HTML snippet that renders a Mermaid diagram.
 * The caller should include the Mermaid library on the page (e.g., via CDN).
 * @param {string} definition - Mermaid diagram definition (flowchart, sequence, etc.).
 * @param {Object} [options] - Optional configuration (theme, width, height).
 * @returns {string} HTML string containing the diagram container and init script.
 */
function renderMermaidDiagram(definition, options = {}) {
  const theme = options.theme || 'default';
  const containerId = options.containerId || `mermaid-${Math.random().toString(36).substr(2, 9)}`;
  const width = options.width ? `style="width:${options.width}px"` : '';
  const height = options.height ? `height="${options.height}"` : '';

  const escapedDef = definition
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `
<div class="mermaid" id="${containerId}" ${width} ${height}>${escapedDef}</div>
<script>
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad:true, theme: '${theme}' });
  } else {
    console.warn('Mermaid library not loaded. Include it via <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>');
  }
</script>
`;
}

module.exports = {
  renderSvgGraph,
  renderMermaidDiagram,
};
