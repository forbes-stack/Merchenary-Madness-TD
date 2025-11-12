waves = [
{
    enemies:
    [
{type: "basic", count: 3, rate: 60}
    ]
},
{
enemies:
[
{type: "basic", count: 6, rate: 60, delay: 10},
{type: "tank", count: 3, rate: 90, delay: 30}
]
}, 
{
    enemies: 
    [
        {type: "basic", count: 6, rate: 60, delay: 100},
        {type: "tank", count: 3, rate: 90, delay: 100},
        {type: "fast", count: 3, rate: 120, delay: 10}
    ]
}
]

// WaveManager.js
class WaveManager {
  constructor(wavesData) {
    this.waves = wavesData;
    this.currentWaveIndex = 0;
    this.spawnTimers = [];
    this.activeEnemies = [];
    this.frameCount = 0;
    this.waveActive = false;
  }

  startWave() {
    if (this.currentWaveIndex >= this.waves.length) return;
    this.waveActive = true;
    this.frameCount = 0;

    const wave = this.waves[this.currentWaveIndex];

    // initialize each enemy group’s spawn timer
    this.spawnTimers = wave.enemies.map(e => ({
      ...e,
      spawned: 0,
      timer: e.delay || 0
    }));
  }

  update(infoTracker) {
    if (!this.waveActive) return;

    const wave = this.waves[this.currentWaveIndex];
    let allGroupsDone = true;

    for (let group of this.spawnTimers) {
      if (group.spawned < group.count) {
        allGroupsDone = false;

        if (group.timer <= 0) {
          // spawn new enemy
          let newEnemy;
          switch (group.type) {
            case "basic": newEnemy = new basicEnemy(path.points); break;
            case "tank":  newEnemy = new tankEnemy(path.points);  break;
            case "fast":  newEnemy = new fastEnemy(path.points);  break;
            default:      newEnemy = new Enemy(path.points, 2, 50, 5); break;
          }
          this.activeEnemies.push(newEnemy);

          group.spawned++;
          group.timer = group.rate;
        } else {
          group.timer--;
        }
      }
    }

    // check if all groups have finished spawning and all enemies are dead
    const allSpawned = allGroupsDone;
    const allDead = this.activeEnemies.every(e => !e.alive);

    if (allSpawned && allDead) {
      // ORIGINAL:
      // this.waveActive = false;
      // this.currentWaveIndex++;

      // CHANGED: end the wave, award round payout, then advance wave index
      this.waveActive = false;

      // NEW: pay out based on the round that just ended, then increment round (handled in InfoTracker.nextRound)
      if (infoTracker && typeof infoTracker.nextRound === "function") {
        infoTracker.nextRound();
      }

      // proceed to next wave
      this.currentWaveIndex++;
    }

    // update active enemies
    for (let e of this.activeEnemies) {
      if (e.alive) e.update(infoTracker);
    }

    // remove dead enemies
    this.activeEnemies = this.activeEnemies.filter(e => e.alive);

    this.frameCount++;

    // auto-start next wave if there is one
    if (!this.waveActive && this.currentWaveIndex < this.waves.length) {
      this.startWave();
    }
  }

  draw() {
    for (let e of this.activeEnemies) e.draw();
  }

  startNextWave() {
    if (!this.waveActive) this.startWave();
  }

  isComplete() {
    return this.currentWaveIndex >= this.waves.length;
  }
}

