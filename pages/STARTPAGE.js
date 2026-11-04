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
}

function setup() {
  createCanvas(700, 650);
  canvasLayout.fit();

  //Startpage Buttons (placed in canvas coordinates; scaled with the canvas)
  start_button = createButton("Start");
  styleButton(start_button)
  canvasLayout.place(start_button, 200, 300, 300, 100, 50);

  start_button.mousePressed(() => {
    sfx.unlock(); // browsers only allow audio after a click
    showHomeButtons(false);
    page = 'map';
    console.log('page is map');
  });

  settings_button = createButton("Settings");
  styleButton(settings_button)
  canvasLayout.place(settings_button, 130, 420, 200, 60, 30);

  settings_button.mousePressed(() => {
    sfx.unlock();
    showHomeButtons(false);
    page = 'settings';
    openSettings(backToHome);
  });

  howto_button = createButton("How to Play");
  styleButton(howto_button)
  canvasLayout.place(howto_button, 370, 420, 200, 60, 26);

  howto_button.mousePressed(() => {
    showHomeButtons(false);
    page = 'howto';
    openHowToPlay(backToHome);
  });
}

function draw() {

  //background images
  if (page == 'home') {
    image(img, 0, 0)
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
