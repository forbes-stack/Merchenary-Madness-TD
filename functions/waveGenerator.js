class WaveManager {
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
   * Generates a new wave based on the round number.
   * @param {number} roundNumber - The current round (from info.round)
   */
  generateWave(roundNumber) {
    let waveEnemies = [];

    // --- 1. Adjust Spawn Interval (Difficulty Scaling) ---
    // Decrease the interval (faster spawn) as the round number increases.
    // Decrease by 3 per round, capping at a minimum of 10 frames (0.16 seconds).
    let reduction = Math.min((roundNumber - 1) * 3, this.initialSpawnInterval - 10);
    this.spawnInterval = this.initialSpawnInterval - reduction;
    this.spawnInterval = Math.max(this.spawnInterval, 10); // Don't go below 10 frames (0.16s)

    console.log(`Round ${roundNumber}: Spawn Interval set to ${this.spawnInterval} frames.`);

    // --- 2. Enemy Count Scaling ---

    // Basic enemies: Always spawn, moderate growth.
    let basicCount;
    if (roundNumber <= 5) {
      basicCount = 5 + ((roundNumber - 1) * 3);
    } else {
      basicCount = 17 + ((roundNumber - 5) * 10);
    }
    for (let i = 0; i < basicCount; i++) {
      waveEnemies.push('basicEnemy');
    }

    // Tank enemies: Start spawning at round 3.
    if (roundNumber >= 3) {
      let tankCount;
      if (roundNumber <= 5) {
        tankCount = roundNumber - 2;
      } else {
        tankCount = 3 + Math.floor(Math.pow(1.5, roundNumber - 5));
      }
      for (let i = 0; i < tankCount; i++) {
        waveEnemies.push('tankEnemy');
      }
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

    let round = infoTracker.round;
    this.spawnQueue = this.generateWave(round);

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
      }
    }

    // 2. Spawning logic
    if (this.spawning) {
      this.spawnTimer--;

      if (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
        let enemyType = this.spawnQueue.pop(); // Get next enemy type (string)
        let newEnemy;

        // Create the new Enemy instance based on its type
        if (enemyType === 'basicEnemy') {
          newEnemy = new basicEnemy(this.pathPoints);
        } else if (enemyType === 'tankEnemy') {
          newEnemy = new tankEnemy(this.pathPoints);
        } else if (enemyType === 'fastEnemy') {
          newEnemy = new fastEnemy(this.pathPoints);
        }

        // --- APPLY STAT BOOSTS (Every 10 Rounds) ---
        if (newEnemy) {
            // Calculate Tier: 0 for Rounds 1-10, 1 for 11-20, 2 for 21-30, etc.
            const tier = Math.floor((infoTracker.round - 1) / 10);

            if (tier > 0) {
                // Buffs:
                // Health: +30% per tier
                // Speed: +10% per tier (capped at max 3x speed to prevent glitching)

                const hpMultiplier = 1 + (tier * 0.30);
                const spdMultiplier = 1 + (tier * 0.10);

                newEnemy.maxHealth = Math.floor(newEnemy.maxHealth * hpMultiplier);
                newEnemy.health = newEnemy.maxHealth; // Reset current health to new max

                // Apply speed buff, but cap it so they don't fly off the map
                newEnemy.speed = Math.min(newEnemy.speed * spdMultiplier, newEnemy.speed * 3);
            }

            this.activeEnemies.push(newEnemy);
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

  startNextWave(infoTracker) {
    if (this.waitingForPlayer) {
      this.waitingForPlayer = false;
      infoTracker.nextRound();
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
