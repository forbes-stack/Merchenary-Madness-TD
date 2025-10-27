//general tower class

class Tower{
    constructor(x, y, range, damage, rate){
        this.x = x;
        this.y = y;
        this.range = range;
        this.damage = damage;
        this.rate = rate
        this.cooldown = 0;
    }

    update(enemy){
        if(!enemy.alive) return;

        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        //distance to enemy
        let distEnemy = dist(this.x, this.y, enemy.x, enemy.y);

        //if in range do damage
        if(distEnemy <= this.range) {
            enemy.takeDamage(this.damage)
            this.cooldown = Math.ceil(this.rate * 60);
        }
    }

    draw() {
        fill(100, 100, 255);
    circle(this.x, this.y, 30);

    noFill();
    stroke(0, 0, 255, 50);
    circle(this.x, this.y, this.range * 2);
    }
}