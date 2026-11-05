// let retry_button,
//     quit_button

// function preload() {
//   gameover = loadImage('assets/gameover.png')
// }

// function setup() {
//   createCanvas(700,650)
//   image(gameover, 0, 0)
// }

// function draw() {

// }

let start_button,
    settings_button,
    howto_button,
    img,
    img3,
    mousePress = false,
    mapLoaded = false,
    loadError = null

// "Click anywhere to ride into town" splash: browsers block sound until the player
// interacts, so the first click / tap / key press starts the music and wind and brings in
// the menu buttons. The desktop app (Electron) allows sound right away, so it skips this.
const IS_DESKTOP_APP = /Electron/i.test(navigator.userAgent);
let showSplash = !IS_DESKTOP_APP;

    //each js script for map.js (order matters: base classes before subclasses)
let sources = ['enemies/enemy.js','enemies/basicEnemy.js', 'enemies/fastEnemy.js', 'enemies/tankEnemy.js',
                'enemies/gridEnemy.js', 'enemies/dynamiteEnemy.js', 'enemies/ghostEnemy.js', 'enemies/docEnemy.js', 'enemies/ironcladEnemy.js',
                'towers/tower.js','towers/gatlingTower.js', 'towers/cannonTower.js', 'towers/sniperTower.js',
                'functions/path.js', 'functions/towerDragger.js','functions/upgradeManager.js',
                'bottomUI/ui.js', 'bottomUI/infoTracker.js',
                'functions/waveGenerator.js', 'functions/SpeedButton.js', 'functions/effects.js', 'functions/tutorial.js',
                'functions/map.js'

              ]
let page = 'home';

function preload() {
  img = loadImage('assets/start.png')
  img3 = loadImage('assets/home.png')
  settingsPreload()
  howToPlayPreload()
}

// show / hide the three title-screen buttons together
function showHomeButtons(visible) {
  for (const btn of [start_button, settings_button, howto_button]) {
    if (visible) btn.show();
    else btn.hide();
  }
}

function backToHome() {
  page = 'home';
  showHomeButtons(true);
  titleAmbience.start();
}

function setup() {
  createCanvas(700, 650);
  document.body.classList.add('title-screen'); // the title drawing fills the whole window
  canvasLayout.fit();
  titleAmbience.start(); // wind + tumbleweeds on the title screen
  sfx.startMenuMusic();  // plays on the title / Settings / How to Play screens

  // Browsers only allow sound after the player interacts: the first click, tap, or key
  // press anywhere starts the menu music and wind, and dismisses the splash.
  const firstInteraction = () => {
    window.removeEventListener('pointerdown', firstInteraction);
    window.removeEventListener('keydown', firstInteraction);
    sfx.unlock();
    if (showSplash) {
      showSplash = false;
      if (page === 'home') showHomeButtons(true);
    }
  };
  window.addEventListener('pointerdown', firstInteraction);
  window.addEventListener('keydown', firstInteraction);

  //Startpage Buttons (placed in canvas coordinates; scaled with the canvas)
  start_button = createButton("Start");
  styleButton(start_button)
  canvasLayout.place(start_button, 200, 300, 300, 100, 50);

  start_button.mousePressed(() => {
    sfx.unlock(); // browsers only allow audio after a click
    showHomeButtons(false);
    document.body.classList.remove('title-screen'); // back to the dusty backdrop in game
    titleAmbience.stop();
    sfx.stopMenuMusic(); // the gameplay music takes over in mapSetup
    page = 'map';
    console.log('page is map');
  });

  settings_button = createButton("Settings");
  styleButton(settings_button)
  canvasLayout.place(settings_button, 130, 420, 200, 60, 30);

  settings_button.mousePressed(() => {
    sfx.unlock();
    showHomeButtons(false);
    titleAmbience.stop();
    page = 'settings';
    openSettings(backToHome);
  });

  howto_button = createButton("How to Play");
  styleButton(howto_button)
  canvasLayout.place(howto_button, 370, 420, 200, 60, 26);

  howto_button.mousePressed(() => {
    showHomeButtons(false);
    titleAmbience.stop();
    page = 'howto';
    openHowToPlay(backToHome);
  });

  // menu buttons appear once the splash is dismissed (first click / key press)
  if (showSplash) showHomeButtons(false);
}

// Pulsing "Click anywhere to ride into town" where the menu buttons will appear
function drawSplash() {
  const pulse = 0.65 + 0.35 * Math.sin(millis() / 450)
  push()
  rectMode(CENTER)
  noStroke()
  fill(40, 20, 0, 150)
  rect(width / 2, 395, 520, 74, 16)
  textAlign(CENTER, CENTER)
  textFont('cursive')
  textSize(34)
  stroke(20, 10, 0)
  strokeWeight(5)
  fill(255, 236, 200, 255 * pulse)
  text('Click anywhere to ride into town', width / 2, 393)
  pop()
}

function draw() {

  //background images
  if (page == 'home') {
    image(img, 0, 0)
    if (showSplash) drawSplash()
  }

  if (page == 'settings') {
    settingsDraw()
  }

  if (page == 'howto') {
    howToPlayDraw()
  }


  //Actual Page Changing

  //(Step 1) load the game scripts, then the game images, then set up the map
  if (page === 'map' && !mapLoaded) {
    mapLoaded = "loading";
    loadScript(sources, () => {
      mapPreload(() => {
        mapSetup();
        mapLoaded = true;
      });
    });
  }

  if (page == 'map' && mapLoaded == true) {
    mapDraw();
  } else if (page == 'map') {
    drawLoadingScreen();
  }
}


// Functions


// (Step 2)
function loadScript(srcArray, callback) {
  let loaded = 0;
  for (let x = 0; x < srcArray.length; x++) {
    console.log('loading script', srcArray[x])
    let script = document.createElement('script');
    script.src = srcArray[x] + '?v=' + new Date().getTime();
    // injected scripts run in download order by default; this keeps them in array order
    script.async = false;
    script.onload = () => {
      loaded++;
      if (loaded === srcArray.length) callback();
    };
    script.onerror = () => {
      console.error('failed to load script', srcArray[x]);
      loadError = 'Failed to load ' + srcArray[x];
    };
    document.head.appendChild(script);
  }
}

// shown while the game scripts/images load, or if one of them fails
function drawLoadingScreen() {
  push();
  background(0);
  fill('white');
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  text(loadError || 'Loading...', width / 2, height / 2);
  pop();
}

// keep the canvas (start screen or map) fitted to the window
function windowResized() {
  canvasLayout.fit();
}

//styles button on startpage
function styleButton(btn) {
  btn.style('font-size', '50px');
  btn.style('color', 'green');
  btn.style('background-color', 'darkgreen');
  btn.style('border-color', 'forestgreen');
  btn.style('border-width', '5px');
  btn.style('font-family', 'cursive');
}
