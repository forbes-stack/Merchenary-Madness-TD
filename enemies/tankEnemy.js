class tankEnemy extends Enemy{

    constructor(path){
        super(path, .5, 500, 5)
    }

// NEW: Only draws the unique body shape
drawBody(){
push();
fill(255, 0, 0);
circle(this.x, this.y, 30)
pop();
}

draw() {
    super.draw(); // Calls base class draw, which draws the body and the health bar.
}
}
