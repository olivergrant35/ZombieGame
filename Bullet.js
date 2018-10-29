class Bullet
{
    constructor()
    {
        this.xSeed = 0;
        this.ySpeed = 0;
        this.bulletSpeed = 500;
        this.bullet = bullets.create(playerX, playerY, 'bullet').setVelocity(this.xSpeed, this.ySpeed).visible = false;
        console.log('Bullet Created');
    }

    shootBullet(playerX, playerY, crosshairX, crosshairY)
    {

    }

    calculateSpeed(playerX, playerY, crosshairX, crosshairY, x)
    {
        //Working out the x and y speed to move the bullet to the crosshair location.
        let dx = crosshairX - playerX;
        let dy = crosshairY - playerY;
        let angle = Math.atan2(dy, dx);
        this.xSpeed = this.bulletSpeed * Math.cos(angle);
        this.ySpeed = this.bulletSpeed * Math.sin(angle);
    }
}