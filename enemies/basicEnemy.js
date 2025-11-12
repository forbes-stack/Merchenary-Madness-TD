class basicEnemy extends Enemy{
    
constructor(path){
    super(path, 1, 100, 10)
}

draw(){
push();
fill(0, 0, 255);
circle(this.x, this.y, 20)
pop();

 //health bar background
    push();
    fill(0);
    rect(this.x - 10, this.y - 15, 20, 5);
    pop();

    //health bar front (active health)
    push();
    fill(255, 0, 0);
            //Returns the percentage value 1 is between 0-maxHealth
      let w = map(this.health, 0, this.maxHealth, 0, 20);
    rect(this.x - 10, this.y - 15, w, 5)
    pop();
}
}