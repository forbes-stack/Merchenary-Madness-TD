class basicEnemy{
    
constructor(path){
    super(path, 2, 100, 10)
}

draw(){
push;
fill(0, 0, 255);
circ(this.x, this.y, 20)
}
}