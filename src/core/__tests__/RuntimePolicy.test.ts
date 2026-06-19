import { describe, it, expect } from "vitest"
import { RuntimePolicy } from "../RuntimePolicy"

describe("Runtime Policy", () => {
  it("blocks unauthorized tools", () => {
    const p = new RuntimePolicy(['FileRead'])
    const verdict = p.enforce({
      tool: 'FileWrite',
      action: 'write-some-file'
    })
    expect(verdict.allowed).toBe(false)
    expect(verdict.reason).toContain("not authorized via Nexus Bridge")
  })

  it("blocks forbidden patterns", () => {
    const p = new RuntimePolicy(['Bash'])
    const verdict = p.enforce({
      tool: 'Bash',
      action: 'unsafe_exec'
    })
    expect(verdict.allowed).toBe(false)
    expect(verdict.reason).toContain("Forbidden pattern detected")
  })
})
