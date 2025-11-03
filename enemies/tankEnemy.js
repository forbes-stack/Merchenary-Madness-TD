class tankEnemy extends Enemy{

    constructor(path){
        super(path, 1, 300, 15)
    }

draw(){
push();
fill(255, 0, 0);
circle(this.x, this.y, 30)
pop();
}
}