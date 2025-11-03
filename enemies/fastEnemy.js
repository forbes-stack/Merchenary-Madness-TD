class fastEnemy extends Enemy{
    constructor(path){
        super(path, 3, 25, 10)
    }

draw(){
push();
fill(0, 255, 0);
circle(this.x, this.y, 15)
pop();

}
}