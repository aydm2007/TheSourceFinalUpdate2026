import vm from "vm";

/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🛡️ SkillSandbox — Sovereign Execution Environment            │
 * │  Provides secure, isolated VM execution for untrusted skills  │
 * └────────────────────────────────────────────────────────────────┘
 */
export class SkillSandbox {
  private defaultTimeout: number;

  constructor(timeoutMs: number = 5000) {
    this.defaultTimeout = timeoutMs;
  }

  /**
   * Executes code in an isolated VM context.
   */
  async run(code: string, input: any, executionTimeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      // Define a secure, minimal sandbox environment
      const sandboxContext = {
        input,
        console: {
          log: (...args: any[]) => console.log("[Sandbox Log]", ...args),
          error: (...args: any[]) => console.error("[Sandbox Error]", ...args),
          warn: (...args: any[]) => console.warn("[Sandbox Warn]", ...args)
        },
        setTimeout,
        clearTimeout,
        Buffer,
        // Provide a safe way for the script to return its result
        __sandboxResult: undefined
      };

      // Ensure code assigns its result to __sandboxResult or returns it
      const wrappedCode = `
        (async () => {
          try {
            const result = eval(${JSON.stringify(code)});
            __sandboxResult = { success: true, data: result };
          } catch (e) {
            __sandboxResult = { success: false, error: e.message };
          }
        })();
      `;

      try {
        const context = vm.createContext(sandboxContext);
        const script = new vm.Script(wrappedCode);
        
        script.runInContext(context, {
          timeout: executionTimeout || this.defaultTimeout,
          displayErrors: true,
        });

        // Use setImmediate to wait for promises to resolve within the context
        setImmediate(() => {
          if (sandboxContext.__sandboxResult) {
             const res = sandboxContext.__sandboxResult as any;
             if (res.success) resolve(res.data);
             else reject(new Error(res.error));
          } else {
             resolve(undefined);
          }
        });
      } catch (err: any) {
        reject(new Error(`Sandbox Execution Failed: ${err.message}`));
      }
    });
  }
}

export default new SkillSandbox();
