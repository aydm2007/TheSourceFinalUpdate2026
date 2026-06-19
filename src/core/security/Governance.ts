export interface Action {
  name: string;
  risk: number;
  [key: string]: any;
}

export class Governance {
  private defaultRiskThreshold = 0.9;

  approve(action: Action): "approved" | "human-review" | "rejected" {
    if (action.risk >= 1.0) {
      return "rejected";
    }
    if (action.risk >= this.defaultRiskThreshold) {
      return "human-review";
    }
    return "approved";
  }

  setThreshold(threshold: number) {
    this.defaultRiskThreshold = threshold;
  }
}

export default new Governance();
