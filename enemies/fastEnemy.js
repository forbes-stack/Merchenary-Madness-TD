class fastEnemy extends Enemy{
    constructor(path){
        super(path, 3, 25, 1)
    }

// NEW: Only draws the unique body shape
drawBody(){
push();
fill(0, 255, 0);
circle(this.x, this.y, 15)
pop();
}

draw() {
    super.draw(); // Calls base class draw, which draws the body and the health bar.
}
}
