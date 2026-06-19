const { spawnSync } = require('child_process');

function mcpWrite(file, content) {
    console.error(`[MCP FileWrite] Writing to ${file}...`);
    const result = spawnSync('node', ['nexus_bridge.js', 'FileWrite', JSON.stringify({ file, content })], { stdio: 'inherit' });
    if (result.error) console.error(result.error);
}

mcpWrite('C:\\tools\\workspace\\calc\\Chess_Engine\\tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`);

mcpWrite('C:\\tools\\workspace\\calc\\Chess_Engine\\src\\index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .glass {
    @apply bg-white/10 backdrop-blur-md border border-white/20 shadow-xl;
  }
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1b4b, #312e81, #1e3a8a);
  color: white;
}
`);

console.error("MCP FileWrite completed.");
