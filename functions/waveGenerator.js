class WaveManager {
  // Brutes per wave relative to the Tank curve
  static BRUTE_MULTIPLIER = 1.5;

  // Enemies get a stat boost (see applyTierBoost) every this many HUD rounds
  static BOOST_EVERY = 5;

  // Special enemies and the HUD round each first appears in (weakest first)
  static SPECIAL_UNLOCKS = [
    ['dynamiteEnemy', 5],
    ['ghostEnemy', 8],
    ['docEnemy', 11],
    ['ironcladEnemy', 14],
  ];

  // Enemy type string (used in spawn queues) -> class.
  // A function so it reads the classes when called, after every enemy script has loaded.
  static ENEMY_CLASSES() {
    return {
      basicEnemy, tankEnemy, fastEnemy,
      dynamiteEnemy, ghostEnemy, docEnemy, ironcladEnemy,
    };
  }

  /**
   * @param {Path} path - The path object enemies will follow.
   */
  constructor(path) {
    // We store the raw points from the path object,
    // as the new Enemy classes expect the path array.
    this.pathPoints = path.points;

    this.activeEnemies = [];
    this.spawnQueue = []; // Enemies waiting to spawn this wave
    this.spawning = false;
    this.spawnTimer = 0; // Frames between spawns
    this.initialSpawnInterval = 60; // Start at 1 second (60 frames)
    this.spawnInterval = this.initialSpawnInterval; // Current interval, will decrease
  }

  /**
   * Difficulty used for a round's wave recipe and stat boosts.
   * Wave 1 uses the Round 2 recipe so the game keeps its original balance.
   */
  difficultyRound(round) {
    return round + 1;
  }

  /**
   * The Tank's growth curve, by how many rounds an enemy type has been unlocked
   * (k = 1 in its first round): 1, 2, 3, then 3 + 1.5^(k-3) → 4, 5, 6, 8, 10, 14...
   */
  tankCurve(k) {
    if (k <= 0) return 0;
    if (k <= 3) return k;
    return 3 + Math.floor(Math.pow(1.5, k - 3));
  }

  /**
   * Generates a new wave based on the round number.
   * @param {number} roundNumber - Difficulty round (see difficultyRound)
   * @param {number} hudRound - Round shown on the HUD (special enemy unlocks use this)
   */
  generateWave(roundNumber, hudRound) {
    let waveEnemies = [];

    // --- 1. Adjust Spawn Interval (Difficulty Scaling) ---
    // Decrease the interval (faster spawn) as the round number increases.
    // Decrease by 3 per round, capping at a minimum of 10 frames (0.16 seconds).
    let reduction = Math.min((roundNumber - 1) * 3, this.initialSpawnInterval - 10);
    this.spawnInterval = this.initialSpawnInterval - reduction;
    this.spawnInterval = Math.max(this.spawnInterval, 10); // Don't go below 10 frames (0.16s)

    console.log(`Round ${roundNumber}: Spawn Interval set to ${this.spawnInterval} frames.`);

    // --- 2. Enemy Count Scaling ---

    // Tank enemies (Brutes): Start spawning at round 3 (HUD round 2), at 1.5x the Tank curve.
    const baseTanks = roundNumber >= 3 ? this.tankCurve(roundNumber - 2) : 0;
    const tankCount = Math.ceil(baseTanks * WaveManager.BRUTE_MULTIPLIER);

    // Basic enemies: Always spawn, moderate growth.
    let basicCount;
    if (roundNumber <= 5) {
      basicCount = 2 + ((roundNumber - 1) * 3);
    } else {
      basicCount = 17 + ((roundNumber - 5) * 10);
    }
    for (let i = 0; i < basicCount; i++) {
      waveEnemies.push('basicEnemy');
    }

    for (let i = 0; i < tankCount; i++) {
      waveEnemies.push('tankEnemy');
    }

    // Fast enemies: Start spawning at round 5.
    if (roundNumber >= 5) {
      let fastCount;
      if (roundNumber == 5) {
        fastCount = 5;
      } else {
        fastCount = 5 + ((roundNumber - 5) * 15);
      }
      for (let i = 0; i < fastCount; i++) {
        waveEnemies.push('fastEnemy');
      }
    }

    // Special enemies: one new type every 3 HUD rounds from round 5, weakest first,
    // each growing on the Tank's curve once unlocked.
    for (const [type, unlockRound] of WaveManager.SPECIAL_UNLOCKS) {
      const count = this.tankCurve(hudRound - unlockRound + 1);
      for (let i = 0; i < count; i++) {
        waveEnemies.push(type);
      }
    }

    // --- 3. Shuffle the Wave (Mix types together) ---
    // Fisher-Yates Shuffle to prevent enemies from spawning in blocks (e.g. all Tanks then all Basics)
    for (let i = waveEnemies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [waveEnemies[i], waveEnemies[j]] = [waveEnemies[j], waveEnemies[i]];
    }

    console.log(`Round ${roundNumber}: Spawning ${waveEnemies.length} enemies.`);

    // reverse the array so we can efficiently .pop() from the end
    return waveEnemies.reverse();
  }

  /**
   * Kicks off the wave spawning process.
   * @param {InfoTracker} infoTracker - Used to get the current round number.
   */
  startWave(infoTracker) {
    if (this.spawning || this.spawnQueue.length > 0) return;

    let round = this.difficultyRound(infoTracker.round);
    this.spawnQueue = this.generateWave(round, infoTracker.round);

    // Waves can overlap (Start Wave is allowed early), so each wave counts its own
    // enemies not yet killed or escaped; every enemy keeps a reference to its wave.
    // Tier (stat boosts) by HUD round: 0 for rounds 1-4, 1 for 5-9, 2 for 10-14, etc.
    this.currentWave = {
      remaining: this.spawnQueue.length,
      tier: Math.floor(infoTracker.round / WaveManager.BOOST_EVERY),
      round: infoTracker.round, // HUD round, for the wave-clear bonus
    };

    this.spawning = true;
    this.spawnTimer = 0; // Spawn first enemy immediately
  }

  /**
   * Main update loop. Called every frame by sketch.js.
   * @param {InfoTracker} infoTracker - Used to give money, take lives, and advance rounds.
   */
  update(infoTracker) {
    if (infoTracker.isGameOver) {
      this.activeEnemies = [];
      this.spawnQueue = [];
      return;
    }

    // 1. Update all active enemies
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      let enemy = this.activeEnemies[i];
      enemy.update(infoTracker);

      if (!enemy.alive) {
        this.activeEnemies.splice(i, 1);

        // Explosive enemies burst into smaller ones when killed (not when they escape).
        // The children join the same wave, so its payout waits for them too.
        if (enemy.killed && typeof enemy.splitOnDeath === "function") {
          sfx.play('explode');
          for (let child of enemy.splitOnDeath()) {
            this.applyTierBoost(child, enemy.wave ? enemy.wave.tier : 0);
            child.wave = enemy.wave;
            if (enemy.wave) enemy.wave.remaining++;
            this.activeEnemies.push(child);
          }
        }

        this.enemyGone(enemy.wave, infoTracker);
      }
    }

    // 2. Spawning logic
    if (this.spawning) {
      this.spawnTimer--;

      if (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
        let enemyType = this.spawnQueue.pop(); // Get next enemy type (string)

        // Create the new Enemy instance based on its type
        const EnemyClass = WaveManager.ENEMY_CLASSES()[enemyType];
        let newEnemy = EnemyClass ? new EnemyClass(this.pathPoints) : null;

        if (newEnemy) {
            this.applyTierBoost(newEnemy, this.currentWave.tier);
            newEnemy.wave = this.currentWave;
            this.activeEnemies.push(newEnemy);
        } else {
            // Unknown type: don't leave the wave waiting on an enemy that never spawned
            this.enemyGone(this.currentWave, infoTracker);
        }

        // Reset timer for next spawn
        this.spawnTimer = this.spawnInterval;
      }

      // If spawn queue is empty, we are done spawning this wave
      if (this.spawnQueue.length === 0) {
        this.spawning = false;
        this.waitingForPlayer = true;
      }
    }
  }

  /**
   * Stat boosts every BOOST_EVERY rounds (5, 10, 15, ...).
   * Health: +50% per tier. Speed: +30% per tier (capped at 3x so they don't fly off the map).
   */
  applyTierBoost(enemy, tier) {
    if (!tier || tier <= 0) return;

    const hpMultiplier = 1 + (tier * 0.50);
    const spdMultiplier = 1 + (tier * 0.30);

    enemy.maxHealth = Math.floor(enemy.maxHealth * hpMultiplier);
    enemy.health = enemy.maxHealth; // Reset current health to new max
    enemy.speed = Math.min(enemy.speed * spdMultiplier, enemy.speed * 3);
  }

  /**
   * An enemy from `wave` was killed or escaped. Pays the round bonus
   * once the whole wave is gone.
   */
  enemyGone(wave, infoTracker) {
    if (!wave) return;
    wave.remaining--;
    if (wave.remaining === 0) {
      infoTracker.waveCleared(wave.round);
    }
  }

  startNextWave(infoTracker) {
    if (this.waitingForPlayer) {
      this.waitingForPlayer = false;
      infoTracker.nextRound();
      sfx.play('waveStart');
      this.startWave(infoTracker);
    }
  }

  /**
   * Main draw loop. Called every frame by sketch.js.
   */
  draw() {
    for (let enemy of this.activeEnemies) {
      enemy.draw();
    }
  }
}
