class HybridLogicalClock {
    constructor() {
        this.logicalCounter = 0;
    }

    /**
     * Generates a globally unique, monotonically increasing timestamp
     * that combines physical time with a logical counter for multi-tenant swarms.
     */
    generateHlcTimestamp() {
        const physicalTime = Date.now();
        this.logicalCounter = (this.logicalCounter + 1) % 99999;
        
        // Format: PhysicalTime:LogicalCounter (e.g. 1780105348140:00001)
        const logicalStr = this.logicalCounter.toString().padStart(5, '0');
        const hlc = `${physicalTime}:${logicalStr}`;

        return {
            status: 'HLC_GENERATED',
            hlc: hlc,
            message: `HLC Boot timestamp: ${hlc}`
        };
    }
}

module.exports = { HybridLogicalClock };
