let start_button, 
    settings_button,
    settings_header, 
    img, 
    mousePress = false, 
    settingsLoaded = false, 
    mapLoaded = false,
    sources = ['enemies/enemy.js', 'enemies/basicEnemy.js', 'enemies/fastEnemy.js', 'enemies/tankEnemy.js',
               'towers/tower.js', 'defenseTowerBase.js',
               'path.js', 'ui.js', 'map.js', 'sketch.js'
              ]
    page = 'home'; 

function preload() { 
  img = loadImage('assets/start.png') 
  img2 = loadImage('assets/settings_bg.png')
} 

function setup() { 
  createCanvas(700, 650); 
  
  //Startpage Buttons
  start_button = createButton("Start"); 
  
  start_button.size(300, 100); 
  start_button.position(220, 300); 
  styleButton(start_button)
  
  
  settings_button = createButton("Settings"); 
  
  settings_button.size(300, 100); 
  settings_button.position(220, 450) 
  styleButton(settings_button)
  
} 

function draw() { 
  if (page == 'home') { 
    image(img, 0, 0)
  } 

  if (page == 'settings') {
    image(img2, 0, 0)
  }

  
  //Actual Page Changing

  //(Step 2)
  if (page === 'map' && !mapLoaded) { 
    mapLoaded = "loading";
    loadScript(sources, () => { 
      mapLoaded = true;
      mapSetup(); 
    }); 
  }
  
  //(Step 2)
  if (page === 'settings' && !settingsLoaded) { 
    loadScript(['settings.js'], () => { 
      settingsLoaded = true;
      
    }); 
  } 
  
  //(Step 4)
  if (page == 'settings' && settingsLoaded) { 
    settingsDraw(); 
  } 
} 


// Functions 


// (Step 3)
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
}

function styleButton(btn) {
  btn.style('font-size', '50px');
  btn.style('color', 'green');
  btn.style('background-color', 'darkgreen');
  btn.style('border-color', 'forestgreen');
  btn.style('border-width', '5px');
  btn.style('font-family', 'cursive');
}
