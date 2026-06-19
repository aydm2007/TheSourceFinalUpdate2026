export class ChaosEngine {
  private crashRate = 0;

  constructor(crashRate = 0) {
    this.crashRate = crashRate;
  }

  setCrashRate(rate: number) {
    this.crashRate = rate;
  }

  executeOrCrash<T>(action: () => T): T {
    if (Math.random() < this.crashRate) {
      throw new Error("ChaosEngine induced worker crash simulation!");
    }
    return action();
  }
}

export default new ChaosEngine();
