import { SovereignForensicAuditTool } from './src/tools/nexus-tools/SovereignForensicAuditTool.js';

async function main() {
  const result = await SovereignForensicAuditTool.execute({
    projectPath: 'C:\\tools\\workspace\\TheSource',
    projectName: 'TheSource'
  });
  console.log(result.content[0].text);
}

main().catch(console.error);
