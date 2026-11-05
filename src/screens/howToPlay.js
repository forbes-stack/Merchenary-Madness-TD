// howToPlay.js
// "How to Play" page, opened from the start screen: goal, controls, towers, and outlaws.
// Draws on the 700x650 start canvas (wood backdrop shared with the Settings page).

let howToImgs = {};
let howToBackButton = null;

function howToPlayPreload() {
  const load = (key, file) => { howToImgs[key] = loadImage('assets/' + file) };
  load('cowboy', 'icons/cowboy.png')
  load('gatling', 'icons/gatling.png')
  load('cannon', 'icons/cannon.png')
  load('sniper', 'icons/sniper.png')
  load('basic', 'enemies/bandit.png')
  load('fast', 'enemies/runner.png')
  load('tank', 'enemies/brute.png')
  load('dynamite', 'enemies/dynamite.png')
  load('ghost', 'enemies/ghost.png')
  load('doc', 'enemies/doc.png')
  load('ironclad', 'enemies/ironclad.png')
}

function openHowToPlay(onBack) {
  if (!howToBackButton) {
    howToBackButton = createButton('Back');
    styleButton(howToBackButton);
    canvasLayout.place(howToBackButton, 270, 585, 160, 50, 28);
    howToBackButton.mousePressed(() => {
      howToBackButton.hide();
      if (onBack) onBack();
    });
  }
  howToBackButton.show();
}

// Front-facing frame of each outlaw: [sheet key, sx, sy, sw, sh]
// (the 3 original sheets have hand-placed frames; the grid sheets use the top-left cell)
const HOW_TO_OUTLAWS = [
  ['basic', 8, 184, 100, 156, 'Bandit', 'Basic'],
  ['tank', 256, 12, 76, 140, 'Brute', 'Tough'],
  ['fast', 216, 172, 72, 148, 'Runner', 'Fast'],
  ['dynamite', 10, 0, 100, 190, 'Dynamite', 'Splits in 3'],
  ['ghost', 10, 0, 100, 190, 'Ghost', 'Camo'],
  ['doc', 10, 0, 100, 190, 'Doc', 'Heals'],
  ['ironclad', 10, 0, 100, 190, 'Ironclad', 'Cannons only'],
];

const HOW_TO_TOWERS = [
  ['cowboy', 'Cowboy', '$25', 'All-rounder'],
  ['gatling', 'Gatling', '$45', 'Rapid fire'],
  ['cannon', 'Cannoneer', '$70', 'Splash, beats armor'],
  ['sniper', 'Sniper', '$85', 'Any range, spots camo'],
];

function howToPlayDraw() {
  // wood-wall backdrop (center crop of the 1158x650 image)
  image(settingsBg, 0, 0, width, height, (settingsBg.width - width) / 2, 0, width, height)

  push()
  fill(107,65,0)
  strokeWeight(5)
  stroke(74,45,0)
  rect(175,20,350,80, 10)
  rect(20,115,660,455, 10)

  fill('white')
  strokeWeight(1)
  stroke('white')
  textFont('cursive')
  textAlign(CENTER, CENTER)
  textSize(44)
  text('How to Play', width / 2, 58)

  // Goal + controls
  noStroke()
  textAlign(LEFT, TOP)
  textSize(15)
  fill(255, 223, 0)
  text('Stop the outlaws before they reach the end of the trail. Each one that escapes costs 10 health; hit 0 and it\'s Game Over.', 40, 130, 620, 40)
  fill(255)
  const controls = [
    '• Drag mercenaries onto open ground. You have 5 tower slots; buy more in the bottom bar.',
    '• Start Wave sends the next wave. Clearing a wave pays a bonus that grows each round.',
    '• Click a tower for its ring menu: ⚔ dmg, ⏱ fire rate, ◎ target, $ sell at discount',
    '• ⏸ or P pauses  ·  1x/2x/3x changes game speed  ·  F shows FPS',
  ]
  controls.forEach((line, i) => text(line, 40, 175 + i * 21))

  // Towers
  textAlign(CENTER, TOP)
  HOW_TO_TOWERS.forEach(([key, name, cost, role], i) => {
    const x = 105 + i * 163
    imageMode(CENTER)
    image(howToImgs[key], x, 295, 58, 58)
    fill(255, 223, 0)
    textSize(15)
    text(`${name} ${cost}`, x, 327)
    fill(255)
    textSize(13)
    text(role, x, 345)
  })

  // Outlaws
  HOW_TO_OUTLAWS.forEach(([key, sx, sy, sw, sh, name, ability], i) => {
    const x = 70 + i * 93
    const drawH = 82
    const drawW = drawH * sw / sh
    imageMode(CENTER)
    image(howToImgs[key], x, 418, drawW, drawH, sx, sy, sw, sh)
    fill(255, 223, 0)
    textSize(14)
    text(name, x, 463)
    fill(255)
    textSize(12)
    text(ability, x, 481)
  })

  fill(255)
  textSize(13)
  textAlign(CENTER, TOP)
  text('Camo outlaws can only be hit by Snipers, or towers near a Sniper.  Only Cannons can hurt Ironclads.', 40, 510, 620, 40)
  pop()
}
