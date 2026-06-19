export class RecoveryGraph {
  async recover(error: { type: string; message?: string }): Promise<string> {
    switch (error.type) {
      case "memory":
        return "restartMemory";
      case "network":
        return "switchRegion";
      case "agent":
        return "restartAgent";
      default:
        return "unknownRecoveryPath";
    }
  }
}

export default new RecoveryGraph();
