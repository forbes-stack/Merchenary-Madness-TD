class UpgradeManager {
    constructor() {
const createDamagePath = () => [
      { cost: 60, damageMod: 1.5, rateMod: 1.0, label: "Dmg Lvl 1" },
      { cost: 180, damageMod: 2.5, rateMod: 1.0, label: "Dmg Lvl 2" },
      { cost: 300, damageMod: 3.0, rateMod: 1.0, label: "Dmg Lvl 3" }
    ];

    // Rate Path: smaller rateMod = less time between shots (faster)
    const createRatePath = () => [
      { cost: 50, damageMod: 1.0, rateMod: 0.80, label: "Rate Lvl 1" },
      { cost: 100, damageMod: 1.0, rateMod: 0.60, label: "Rate Lvl 2" },
      { cost: 250, damageMod: 1.0, rateMod: 0.50, label: "Rate Lvl 3" }
    ];

    this.upgrades = {
      'gatling': { damage: createDamagePath(), rate: createRatePath() },
      'cannon':  { damage: createDamagePath(), rate: createRatePath() },
      'basic':   { damage: createDamagePath(), rate: createRatePath() },
      'sniper':  { damage: createDamagePath(), rate: createRatePath() }
    };
  }

  /**
   * Returns available options based on current level and locked path.
   */
  getUpgradeOptions(tower) {
    const type = tower.towerType;
    const level = tower.level;
    const path = tower.upgradePath; // 'damage', 'rate', or null

    // If max level (3), no upgrades available
    if (level >= 3) return { damage: null, rate: null };

    // If tower type not found, return nulls
    if (!this.upgrades[type]) return { damage: null, rate: null };

    let damageOpt = null;
    let rateOpt = null;

    // 1. Get Damage Option (if not locked out)
    if (path === null || path === 'damage') {
      damageOpt = this.upgrades[type].damage[level];
    }

    // 2. Get Rate Option (if not locked out)
    if (path === null || path === 'rate') {
      rateOpt = this.upgrades[type].rate[level];
    }

    return { damage: damageOpt, rate: rateOpt };
  }

  applyUpgrade(tower, choice, infoTracker) {
    const options = this.getUpgradeOptions(tower);
    const data = options[choice]; // choice is 'damage' or 'rate'

    if (!data) return false; // Upgrade not available or locked

    if (infoTracker.decreaseCurrency(data.cost)) {
      // Apply stats
      if (data.damageMod !== 1.0) tower.damage = Math.ceil(tower.damage * data.damageMod);
      if (data.rateMod !== 1.0) tower.rate = tower.rate * data.rateMod;

      // Lock path and increment level
      if (tower.upgradePath === null) tower.upgradePath = choice;
      tower.level++;

      return true;
    }
    return false;
  }
}
