import { describe, it, expect } from "vitest"
import { SkillArbitrator } from "../SkillArbitrator"

describe("Skill Arbitration", () => {
  it("selects highest priority", () => {
    const arb = new SkillArbitrator()
    const result = arb.resolve([
      {
        name: "master",
        priority: 100,
        requiredTools: []
      },
      {
        name: "secondary",
        priority: 50,
        requiredTools: []
      }
    ])
    expect(result.selectedSkill.name).toBe("master")
  })
})
