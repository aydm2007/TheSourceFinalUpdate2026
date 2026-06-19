/**
 * @file SchemaEvolutionEngine.js
 * @description محرك تطور الهياكل (Backward/Forward Compatibility).
 */

class SchemaEvolutionEngine {
  constructor() {
    this.migrations = new Map();
    this.registerCoreMigrations();
  }

  registerCoreMigrations() {
    // Example Migration
    this.addMigration("FinanceEvent", 1, 2, (oldData) => {
      return {
        ...oldData,
        auditTrailId: oldData.auditTrailId || "LEGACY_UNKNOWN",
        timestamp: oldData.timestamp || Date.now(),
      };
    });
  }

  addMigration(schemaName, fromVersion, toVersion, upgraderFunction) {
    const key = `${schemaName}_v${fromVersion}_to_v${toVersion}`;
    this.migrations.set(key, upgraderFunction);
  }

  migrate(schemaName, data, targetVersion = 2) {
    let currentVersion = data.version || 1;
    let upgradedData = { ...data };

    while (currentVersion < targetVersion) {
      const key = `${schemaName}_v${currentVersion}_to_v${currentVersion + 1}`;
      const upgrader = this.migrations.get(key);

      if (!upgrader) {
        // If no strict migration path exists, we assume it's compatible or fallback
        break;
      }

      upgradedData = upgrader(upgradedData);
      currentVersion++;
      upgradedData.version = currentVersion;
    }

    return upgradedData;
  }
}

module.exports = SchemaEvolutionEngine;
