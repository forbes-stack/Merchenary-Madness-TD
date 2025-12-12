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
    img, 
    mousePress = false, 
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
  img3 = loadImage('assets/home.png')
} 

function setup() { 
  createCanvas(700, 650); 
  
  //Startpage Buttons
  start_button = createButton("Start"); 
  
  start_button.size(300, 100); 
  start_button.position(CENTER, 350); 
  styleButton(start_button)
  
} 

function draw() { 

  //background images
  if (page == 'home') { 
    image(img, 0, 0)
  } 

  
  //Actual Page Changing

  //(Step 1)
  if (page === 'map' && !mapLoaded) { 
    mapLoaded = "loading";
    loadScript(sources, () => { 
      mapLoaded = true;
      mapPreload();
      mapSetup(); 
    }); 
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
      page = 'map';
      console.log('page is map');
    }
  }
  else if (page == 'map') {
    ui.mousePressed();
  }
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
