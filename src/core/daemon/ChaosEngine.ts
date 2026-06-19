import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { parse, print } from 'recast';

export class ChaosEngine {
    private isRunning: boolean = false;
    private targetDir: string;

    constructor(targetDir: string = 'src') {
        this.targetDir = path.resolve(process.cwd(), targetDir);
    }

    public async runChaosCycle(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        
        console.log(`[ChaosEngine] 🧬 Initiating Chaos Cycle...`);
        
        try {
            // Pick a random TS file
            const files = this.getAllTSFiles(this.targetDir);
            if (files.length === 0) return;
            const targetFile = files[Math.floor(Math.random() * files.length)];
            
            // Backup
            const originalContent = fs.readFileSync(targetFile, 'utf8');
            
            try {
                // Mutate
                const mutatedContent = this.mutateAST(originalContent);
                if (originalContent === mutatedContent) {
                    console.log(`[ChaosEngine] ℹ️ No suitable AST nodes to mutate in ${path.basename(targetFile)}.`);
                    return;
                }

                fs.writeFileSync(targetFile, mutatedContent);
                console.log(`[ChaosEngine] ⚠️ Mutated ${path.basename(targetFile)}. Running tests...`);
                
                // Test
                const result = cp.spawnSync('npm', ['run', 'test'], { cwd: process.cwd(), encoding: 'utf8' });
                
                if (result.status === 0) {
                    // Vulnerability found: The mutation was NOT caught by tests!
                    console.log(`[ChaosEngine] 🚨 DANGER: Mutation in ${path.basename(targetFile)} was NOT caught by tests!`);
                    this.logSovereignAlert(targetFile);
                } else {
                    console.log(`[ChaosEngine] ✅ Immune System Active: Mutation was caught by test suite.`);
                }
            } finally {
                // Restore
                fs.writeFileSync(targetFile, originalContent);
                console.log(`[ChaosEngine] 🩹 Restored ${path.basename(targetFile)}.`);
            }
        } catch (e: any) {
            console.error(`[ChaosEngine] ❌ Cycle failed: ${e.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    private logSovereignAlert(file: string) {
        const bugsPath = path.resolve(process.cwd(), '.agents/memory/bugs.md');
        if (fs.existsSync(bugsPath)) {
            const entry = `\n## 🚨 [CHAOS ALERT] Uncaught Mutation\n- **File**: ${file}\n- **Date**: ${new Date().toISOString()}\n- **Details**: ChaosEngine successfully mutated this file without breaking the test suite. This indicates poor test coverage or loose types.\n<!-- APPEND -->`;
            const content = fs.readFileSync(bugsPath, 'utf8');
            fs.writeFileSync(bugsPath, content.replace('<!-- APPEND -->', entry));
        }
    }

    private mutateAST(source: string): string {
        try {
            const ast = parse(source, { parser: require("recast/parsers/typescript") });
            let mutated = false;
            
            // Very simple AST visitor to swap binary operators as a mutation
            require('ast-types').visit(ast, {
                visitBinaryExpression(nodePath: any) {
                    if (mutated) return false;
                    const op = nodePath.node.operator;
                    if (op === '===' || op === '==') {
                        nodePath.node.operator = '!==';
                        mutated = true;
                    } else if (op === '+') {
                        nodePath.node.operator = '-';
                        mutated = true;
                    }
                    this.traverse(nodePath);
                }
            });
            
            return mutated ? print(ast).code : source;
        } catch (e) {
            return source;
        }
    }

    private getAllTSFiles(dir: string, fileList: string[] = []): string[] {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if (!filePath.includes('__tests__')) this.getAllTSFiles(filePath, fileList);
            } else if (filePath.endsWith('.ts') && !filePath.endsWith('.d.ts')) {
                fileList.push(filePath);
            }
        }
        return fileList;
    }
}
