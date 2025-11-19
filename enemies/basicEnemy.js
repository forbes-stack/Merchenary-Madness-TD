class basicEnemy extends Enemy{

constructor(path){
    super(path, 1, 100, 10)
}

// NEW: Only draws the unique body shape
drawBody(){
push();
fill(0, 0, 255);
circle(this.x, this.y, 20)
pop();
}

draw() {
    super.draw(); // Calls base class draw, which draws the body and the health bar.
}
}
