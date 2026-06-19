/**
 * 🎨 Visual Topology Generator (SRE v2.0)
 * Generates Mermaid diagrams and SVG representation of the active sovereign swarm nodes.
 */

class VisualTopologyGenerator {
    /**
     * Generates a Mermaid flowchart representing the swarm topology.
     */
    static generateMermaid(agents = [], channels = []) {
        let diagram = 'flowchart TD\n';
        diagram += '    subgraph SovereignSwarm ["سرب الوكلاء النشط (Sovereign Swarm)"]\n';
        
        if (agents.length === 0) {
            diagram += '        EmptyNode["لا يوجد وكلاء نشطون حالياً"]\n';
        } else {
            agents.forEach(agent => {
                const statusEmoji = agent.status === 'completed' ? '✅' : (agent.status === 'failed' ? '❌' : (agent.status ? '⏳' : '🤖'));
                diagram += `        ${agent.id}["${statusEmoji} ${agent.name} (${agent.type})"]\n`;
            });
        }
        diagram += '    end\n';

        channels.forEach(channel => {
            diagram += `    ${channel.from} -->|"${channel.label}"| ${channel.to}\n`;
        });

        return diagram;
    }

    /**
     * Generates a premium SVG visualization map of the active swarm nodes.
     */
    static generateSVG(agents = []) {
        const width = 900;
        const height = 550;
        let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">\n`;
        
        // Definitions for gradients & glow effects
        svg += `  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0b0f19" stop-opacity="1"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>\n`;

        // Background
        svg += `  <rect width="${width}" height="${height}" fill="url(#bgGlow)" />\n`;
        
        // Title
        svg += `  <text x="30" y="45" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="bold" letter-spacing="-0.5px">🧬 خريطة تفاعلية لسرب الوكلاء (Active Swarm Map)</text>\n`;
        svg += `  <text x="30" y="70" fill="#64748b" font-family="sans-serif" font-size="12">الحالة الحية لورشة عمل الـ 20 وكيلاً السياديين</text>\n`;

        if (agents.length === 0) {
            svg += `  <text x="${width/2}" y="${height/2}" fill="#f85149" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">⏳ في انتظار بدء ورشة العمل وتفعيل الوكلاء...</text>\n`;
        } else {
            // Radial layout for a beautiful swarm ring
            const centerX = width / 2;
            const centerY = height / 2 + 30;
            const radius = 180;

            // Draw central coordinator if exists
            const coordinatorIdx = agents.findIndex(a => a.type === 'integrator-coordinator' || a.name.toLowerCase().includes('coordinator'));
            let centralNode = null;
            let outerAgents = [...agents];

            if (coordinatorIdx !== -1) {
                centralNode = agents[coordinatorIdx];
                outerAgents.splice(coordinatorIdx, 1);
                
                // Draw connections from center to outer agents
                outerAgents.forEach((agent, index) => {
                    const angle = (index / outerAgents.length) * 2 * Math.PI;
                    const ax = centerX + radius * Math.cos(angle);
                    const ay = centerY + radius * Math.sin(angle);
                    
                    let strokeColor = 'rgba(88, 166, 255, 0.2)';
                    if (agent.status === 'completed') strokeColor = 'rgba(57, 211, 83, 0.4)';
                    if (agent.status === 'failed') strokeColor = 'rgba(248, 81, 73, 0.4)';

                    svg += `  <line x1="${centerX}" y1="${centerY}" x2="${ax}" y2="${ay}" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="4,4" />\n`;
                });
            } else {
                // Connect in a circle chain
                outerAgents.forEach((agent, index) => {
                    const angle1 = (index / outerAgents.length) * 2 * Math.PI;
                    const angle2 = ((index + 1) / outerAgents.length) * 2 * Math.PI;
                    const x1 = centerX + radius * Math.cos(angle1);
                    const y1 = centerY + radius * Math.sin(angle1);
                    const x2 = centerX + radius * Math.cos(angle2);
                    const y2 = centerY + radius * Math.sin(angle2);
                    svg += `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(188, 140, 255, 0.15)" stroke-width="1" />\n`;
                });
            }

            // Draw outer agents
            outerAgents.forEach((agent, index) => {
                const angle = (index / outerAgents.length) * 2 * Math.PI;
                const ax = centerX + radius * Math.cos(angle);
                const ay = centerY + radius * Math.sin(angle);

                let color = '#38bdf8'; // Blue for pending
                let shadowColor = 'rgba(56, 189, 248, 0.3)';
                if (agent.status === 'completed') {
                    color = '#4ade80'; // Green
                    shadowColor = 'rgba(74, 222, 128, 0.3)';
                } else if (agent.status === 'failed') {
                    color = '#f87171'; // Red
                    shadowColor = 'rgba(248, 113, 113, 0.3)';
                }

                svg += `  <g id="node_${agent.id}" cursor="pointer">\n`;
                svg += `    <circle cx="${ax}" cy="${ay}" r="22" fill="#1e293b" stroke="${color}" stroke-width="2" style="filter: drop-shadow(0px 0px 6px ${shadowColor});" />\n`;
                svg += `    <circle cx="${ax}" cy="${ay}" r="4" fill="${color}" />\n`;
                
                // Wrap text
                const displayName = agent.name.length > 14 ? agent.name.substring(0, 12) + '..' : agent.name;
                svg += `    <text x="${ax}" y="${ay + 34}" fill="#e2e8f0" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${displayName}</text>\n`;
                svg += `    <text x="${ax}" y="${ay + 44}" fill="#64748b" font-family="sans-serif" font-size="8" text-anchor="middle">${agent.type}</text>\n`;
                svg += `  </g>\n`;
            });

            // Draw coordinator at the center
            if (centralNode) {
                let color = '#c084fc'; // Purple for coordinator
                let shadowColor = 'rgba(192, 132, 252, 0.4)';
                if (centralNode.status === 'completed') {
                    color = '#4ade80';
                    shadowColor = 'rgba(74, 222, 128, 0.4)';
                }

                svg += `  <g id="node_${centralNode.id}">\n`;
                svg += `    <circle cx="${centerX}" cy="${centerY}" r="32" fill="#0f172a" stroke="${color}" stroke-width="3" style="filter: drop-shadow(0px 0px 10px ${shadowColor});" />\n`;
                svg += `    <text x="${centerX}" y="${centerY - 2}" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">المنسق</text>\n`;
                svg += `    <text x="${centerX}" y="${centerY + 10}" fill="${color}" font-family="sans-serif" font-size="8" text-anchor="middle">Coordinator</text>\n`;
                svg += `  </g>\n`;
            }
        }

        svg += '</svg>';
        return svg;
    }
}

module.exports = VisualTopologyGenerator;
