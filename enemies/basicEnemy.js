class basicEnemy extends Enemy{
    
constructor(path){
    super(path, 2, 100, 10)
}

draw(){
push();
fill(0, 0, 255);
circle(this.x, this.y, 20)
pop();
}
}