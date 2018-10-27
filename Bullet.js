class Bullet
{
    constructor()
    {
        const bullets = game.physics.add.group();
        this.xSeed = 0;
        this.ySpeed = 0;
        console.log('Bullet Created');

        //Creating the bullet and giving it a speed of 0 and setting visible to false.
        this.bullet = bullets.create(playerX, playerY, 'bullet').setVelocity(xSpeed, ySpeed).visible = false;
    }

    spawnBullet()
    {

    }

    calculateSpeed(playerX, playerY, crosshairX, crosshairY)
    {
        //Working out the x and y speed to move the bullet to the crosshair location.
        let dx = crosshairX - playerX;
        let dy = crosshairY - playerY;
        let angle = Math.atan2(dy, dx);
        this.xSpeed = bulletSpeed * Math.cos(angle);
        this.ySpeed = bulletSpeed * Math.sin(angle);
    }
}