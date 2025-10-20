let start_button;
let settings_button;
let img

function preload() {
  img = loadImage('STARTPAGE_BACKGROUND.png')
}

function setup() {
  createCanvas(700, 650);

  start_button = createButton("Start");
  settings_button = createButton("Settings");

}

function draw() {
  image(img, 0,0)
  
  textSize(70);
  color(0,0,0);
  rect(175, 25, 400, 200);
  text("Mercenary\n Madness", 205, 100);

  start_button.size(300, 100);
  start_button.position(220, 300);
  start_button.style('font-size', '50px')
  start_button.style('color', 'brown')
  start_button.style("background-color", "pink")
  start_button.style("border-color", "yellow")
  start_button.style('border-width', '5px')
  start_button.style("font-family", "cursive")

  
  start_button.mousePressed();

  settings_button.size(300, 100);
  settings_button.position(220, 450)
  settings_button.style('font-size', '50px')
  settings_button.style('color', 'brown')
  settings_button.style("background-color", "pink")
  settings_button.style("border-color", "yellow")
  settings_button.style('border-width', '5px')
  settings_button.style("font-family", "cursive")
}
