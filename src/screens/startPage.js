// let retry_button,
//     quit_button

// function preload() {
//   gameover = loadImage('assets/screens/gameover.png')
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
let sources = ['src/enemies/enemy.js','src/enemies/basicEnemy.js', 'src/enemies/fastEnemy.js', 'src/enemies/tankEnemy.js',
                'src/enemies/gridEnemy.js', 'src/enemies/dynamiteEnemy.js', 'src/enemies/ghostEnemy.js', 'src/enemies/docEnemy.js', 'src/enemies/ironcladEnemy.js',
                'src/towers/tower.js','src/towers/gatlingTower.js', 'src/towers/cannonTower.js', 'src/towers/sniperTower.js',
                'src/game/path.js', 'src/game/towerDragger.js','src/game/upgradeManager.js',
                'src/ui/ui.js', 'src/ui/infoTracker.js',
                'src/game/waveGenerator.js', 'src/game/speedButton.js', 'src/core/effects.js', 'src/game/tutorial.js',
                'src/game/map.js'

              ]
let page = 'home';

function preload() {
  img = loadImage('assets/backgrounds/title.png')
  img3 = loadImage('assets/icons/home.png')
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
  setBackdrop('title-screen');
  showHomeButtons(true);
  titleAmbience.start();
}

// Which picture fills the window around the canvas: the extended title drawing on the
// title screen, the extended wood wall on Settings / How to Play (see style.css)
function setBackdrop(name) {
  document.body.classList.remove('title-screen', 'wood-screen');
  if (name) document.body.classList.add(name);
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
    titleAmbience.stop(); // the desert backdrop stays up through the loading screen
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
    setBackdrop('wood-screen');
    page = 'settings';
    openSettings(backToHome);
  });

  howto_button = createButton("How to Play");
  styleButton(howto_button)
  canvasLayout.place(howto_button, 370, 420, 200, 60, 26);

  howto_button.mousePressed(() => {
    showHomeButtons(false);
    titleAmbience.stop();
    setBackdrop('wood-screen');
    page = 'howto';
    openHowToPlay(backToHome);
  });

  // menu buttons appear once the splash is dismissed (first click / key press)
  if (showSplash) showHomeButtons(false);
}

// Pulsing "Click anywhere to ride into town" where the menu buttons will appear
function drawSplash() {
  drawBanner('Click anywhere to ride into town')
}

// Pulsing message on a dark band over the title drawing (splash + loading screen);
// the band widens for longer messages
function drawBanner(message) {
  const pulse = 0.75 + 0.25 * Math.sin(millis() / 450) // never fainter than half
  push()
  textFont('cursive')
  textSize(34)
  const bandW = constrain(textWidth(message) + 60, 520, width - 20)
  if (textWidth(message) > bandW - 30) textSize(34 * (bandW - 30) / textWidth(message))
  rectMode(CENTER)
  noStroke()
  fill(40, 20, 0, 150)
  rect(width / 2, 395, bandW, 74, 16)
  textAlign(CENTER, CENTER)
  stroke(20, 10, 0)
  strokeWeight(5)
  fill(255, 236, 200, 255 * pulse)
  text(message, width / 2, 393)
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
        setBackdrop(null); // the dusty in-game backdrop (style.css), now that the map is up
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
// While the game loads: the title drawing (and its extended desert around the canvas)
// with a pulsing "Loading..." banner, or the error if something failed to load
function drawLoadingScreen() {
  image(img, 0, 0);
  drawBanner(loadError || 'Loading...');
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
