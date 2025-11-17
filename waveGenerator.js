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
    this.spawnInterval = 30; // Spawn a new enemy every 0.5 seconds (30 frames)
  }

  /**
   * Generates a new wave based on the round number.
   * @param {number} roundNumber - The current round (from info.round)
   */
  generateWave(roundNumber) {
    let waveEnemies = [];


    // 1. Basic enemies: Always spawn, more over time.
    let basicCount;
    if (roundNumber < 5) {
      basicCount = 5 + (roundNumber * 4);
    }
    if (roundNumber >= 5 && roundNumber < 10) {
      basicCount = 5 * (roundNumber * 5);
    }
    if (roundNumber > 10) {
      basicCount = 5 * (roundNumber * 10);
    }
    for (let i = 0; i < basicCount; i++) {
      waveEnemies.push('basicEnemy');
    }

    // 2. Tank enemies: Start spawning at round 3.
    if (roundNumber >= 3) {
      let tankCount = 5 * (roundNumber - 3);
      for (let i = 0; i < tankCount; i++) {
        waveEnemies.push('tankEnemy');
      }
    }

    // 3. Fast enemies: Start spawning at round 5.
    if (roundNumber >= 5) {
      let fastCount = 10 * (roundNumber - 5);
      for (let i = 0; i < fastCount; i++) {
        waveEnemies.push('fastEnemy');
      }
    }

    console.log(`Round ${roundNumber}: Spawning ${waveEnemies.length} enemies.`);

    // reverse the array so we can efficiently .pop() from the end
    // without re-indexing the whole array.
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
      // Pass infoTracker, as the enemy's update method
      // needs it to damage the player if it finishes.
      enemy.update(infoTracker);

      // If enemy is no longer alive (either killed or finished path),
      // remove it. The enemy's own methods (takeDamage, update)
      // will handle giving rewards or losing health.
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

        if (newEnemy) {
          this.activeEnemies.push(newEnemy);
        }

        // Reset timer for next spawn
        this.spawnTimer = this.spawnInterval;
      }

      // If spawn queue is empty, we are done spawning this wave
      if (this.spawnQueue.length === 0) {
        this.spawning = false;
      }
    }

    // 3. Check for End-of-Wave
    // If we are NOT spawning, and there are NO active enemies, the round is over.
    if (!this.spawning && this.activeEnemies.length === 0 && this.spawnQueue.length === 0) {

      // Tell infoTracker to advance the round (gives money, increments round)
      infoTracker.nextRound();

      // Immediately start the next wave! This creates the endless loop.
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
