class basicEnemy extends Enemy{
    
constructor(path){
    super(path, 1, 100, 10)
}

draw(){
push();
fill(0, 0, 255);
circle(this.x, this.y, 20)
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