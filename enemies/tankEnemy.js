class tankEnemy extends Enemy{

    constructor(path){
        super(path, .5, 500, 15)
    }

draw(){
push();
fill(255, 0, 0);
circle(this.x, this.y, 30)
pop();

// Health bar background
    push();
    fill(0);
    rect(this.x - 10, this.y - 15, 20, 5);
    pop();

    // Health bar foreground
    push();
    fill(255, 0, 0);
    let w = map(this.health, 0, this.maxHealth, 0, 20);
    rect(this.x - 10, this.y - 15, w, 5);
    pop();
}
}
