class UpgradeManager {
    constructor() {
        // Defines the upgrade tiers for each tower type.
        // Each array index corresponds to the *NEXT* level (e.g., index 0 is the upgrade from Lvl 1 to Lvl 2).
        this.upgrades = {
            'gatling': [
                { cost: 75, rate: 0.05, damage: null, range: null, description: "Increased Rate of Fire (Rate: 0.1s -> 0.05s)" },  // Lvl 1 -> Lvl 2
                { cost: 150, rate: null, damage: 5, range: 120, description: "Increased Damage and Radius (Dmg: 3 -> 5, Range: 100 -> 120)" } // Lvl 2 -> Lvl 3
            ],
            'cannon': [
                { cost: 120, rate: 1.5, damage: null, range: null, description: "Increased Rate of Fire (Rate: 2.0s -> 1.5s)" },  // Lvl 1 -> Lvl 2
                { cost: 150, rate: null, damage: 75, range: null, description: "Increased Damage (Dmg: 50 -> 75)" },               // Lvl 2 -> Lvl 3
                { cost: 175, rate: null, damage: null, range: 180, description: "Increased Engagement Radius (Range: 150 -> 180)" }  // Lvl 3 -> Lvl 4
            ],
            'basic': [] // No upgrades for the basic tower, will be updated.
        };
    }

    /**
     * Gets the upgrade data for the next level of a given tower.
     * @param {Tower} tower - The tower instance to check.
     * @returns {Object | null} The upgrade object or null if max level is reached.
     */
    getUpgrade(tower) {
        const type = tower.towerType;
        const currentLevel = tower.level;

        // Check if the tower type is configured and if the current level is below the maximum upgrade index
        if (this.upgrades[type] && this.upgrades[type].length >= currentLevel) {
            // Index is currentLevel - 1 because an array starts at 0.
            // Example: Lvl 1 -> Lvl 2 uses index 0.
            return this.upgrades[type][currentLevel - 1];
        }
        return null;
    }

    /**
     * Applies the next available upgrade to the tower instance.
     * @param {Tower} tower - The tower instance to upgrade.
     * @param {InfoTracker} infoTracker - Used to decrease player currency.
     * @returns {boolean} True if the upgrade was successful, false otherwise.
     */
    applyUpgrade(tower, infoTracker) {
        const upgradeData = this.getUpgrade(tower);

        if (!upgradeData) {
            console.log(`Upgrade Failed: ${tower.towerType} is max level or no data exists.`);
            return false;
        }

        if (infoTracker.decreaseCurrency(upgradeData.cost)) {
            // Apply all non-null stat changes
            if (upgradeData.rate !== null) tower.rate = upgradeData.rate;
            if (upgradeData.damage !== null) tower.damage = upgradeData.damage;
            if (upgradeData.range !== null) tower.range = upgradeData.range;

            // Increment level and max level if necessary (Cannon max is 4, Gatling max is 3)
            tower.level++;
            tower.maxLevel = Math.max(tower.maxLevel, tower.level);

            console.log(`${tower.towerType} upgraded to Level ${tower.level}.`);
            return true;
        } else {
            console.log(`Upgrade Failed: Not enough currency. Needed $${upgradeData.cost}.`);
            return false;
        }
    }
}
