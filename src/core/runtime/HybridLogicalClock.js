/**
 * @file HybridLogicalClock.js
 * @description الساعات المنطقية الهجينة للحفاظ على الترتيب الحتمي للأحداث الموزعة.
 */
class HybridLogicalClock {
  constructor() {
    this.physicalTime = Date.now();
    this.logicalCounter = 0;
  }

  tick() {
    const now = Date.now();
    if (now > this.physicalTime) {
      this.physicalTime = now;
      this.logicalCounter = 0;
    } else {
      this.logicalCounter++;
    }
    return this.pack();
  }

  update(remoteHlcString) {
    if (!remoteHlcString) return this.tick();

    const remote = this.unpack(remoteHlcString);
    const now = Date.now();

    const maxPhysical = Math.max(this.physicalTime, remote.physicalTime, now);

    if (
      this.physicalTime === maxPhysical &&
      remote.physicalTime === maxPhysical
    ) {
      this.logicalCounter =
        Math.max(this.logicalCounter, remote.logicalCounter) + 1;
    } else if (this.physicalTime === maxPhysical) {
      this.logicalCounter++;
    } else if (remote.physicalTime === maxPhysical) {
      this.logicalCounter = remote.logicalCounter + 1;
    } else {
      this.logicalCounter = 0;
    }

    this.physicalTime = maxPhysical;
    return this.pack();
  }

  pack() {
    return `${this.physicalTime}:${this.logicalCounter.toString().padStart(5, "0")}`;
  }

  unpack(hlcString) {
    const parts = hlcString.split(":");
    return {
      physicalTime: parseInt(parts[0], 10),
      logicalCounter: parseInt(parts[1], 10),
    };
  }
}

module.exports = HybridLogicalClock;
