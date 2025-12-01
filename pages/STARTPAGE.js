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
    settings_header,
    settings_body,
    img, 
    mousePress = false, 
    settingsLoaded = false, 
    mapLoaded = false
    

    //each js script for map.js
    sources = ['functions/map.js', 'functions/waveGenerator.js', 'enemies/enemy.js', 'bottomUI/ui.js', 'bottomUI/infoTracker.js',
               'towers/tower.js', 'functions/towerDragger.js',
               'functions/path.js', 'enemies/basicEnemy.js', 'enemies/fastEnemy.js', 'enemies/tankEnemy.js',
               'towers/gatlingTower.js', 'towers/cannonTower.js', 'towers/sniperTower.js', 'functions/upgradeManager.js'
              ]
    page = 'home'; 

function preload() { 
  img = loadImage('assets/start.png') 
  img2 = loadImage('assets/settings_bg.png')
  img3 = loadImage('assets/home.png')
} 

function setup() { 
  createCanvas(700, 650); 
  
  //Startpage Buttons
  start_button = createButton("Start"); 
  
  start_button.size(300, 100); 
  start_button.position(CENTER, 350); 
  styleButton(start_button)
  
  
  settings_button = createButton("Settings"); 
  
  settings_button.size(300, 100); 
  settings_button.position(CENTER, 500) 
  styleButton(settings_button)
  
} 

function draw() { 

  //background images
  if (page == 'home') { 
    image(img, 0, 0)
  } 

  if (page == 'settings') {
    image(img2, 0, 0)
    image(img3, 0,0,100,100)
  }

  
  //Actual Page Changing

  // Once you hit Start/Settings, the page var will change to map/settings,
  //leading to (Step 1), which will then call loadScript() and load the scripts
  //corresponding to 

  //(Step 1)
  if (page === 'map' && !mapLoaded) { 
    mapLoaded = "loading";
    loadScript(sources, () => { 
      mapLoaded = true;
      mapPreload();
      mapSetup(); 
    }); 
  }
  
  //(Step 1)
  if (page === 'settings' && !settingsLoaded) { 
    loadScript(['pages/settings.js'], () => { 
      settingsLoaded = true;
      
    }); 
  } 
  
  //(Step 3 for settings)
  if (page == 'settings' && settingsLoaded) { 
    settingsDraw(); 
  } 

  if (page == 'map' && mapLoaded == true) {
    mapDraw();
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
    script.onload = () => {
      loaded++;
      if (loaded === srcArray.length) callback();
    };
    document.head.appendChild(script); 
  }
}

// determines when button is pressed
function mousePressed() {
  if (page === 'home') {
    if (mouseX >= 220 && mouseX <= 550 && mouseY >= 300 && mouseY <= 400) {
      start_button.hide();
      settings_button.hide();
      page = 'map';
      console.log('page is map');
    }
    if (mouseX >= 220 && mouseX <= 550 && mouseY >= 450 && mouseY <= 550) {
      start_button.hide();
      settings_button.hide();
      page = 'settings';
      console.log('page is settings');
    }
  }
  else if (page == 'settings') {
    if (mouseX >= 0 && mouseX <= 100 && mouseY >= 0 && mouseY <= 100) {
      setup()
      page = 'home'
      console.log('page is home')
    }
  }
  else if (page == 'map') {
    ui.mousePressed();
  }
}

//styles each button on startpage
function styleButton(btn) {
  btn.style('font-size', '50px');
  btn.style('color', 'green');
  btn.style('background-color', 'darkgreen');
  btn.style('border-color', 'forestgreen');
  btn.style('border-width', '5px');
  btn.style('font-family', 'cursive');
}
