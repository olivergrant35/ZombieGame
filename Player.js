class Player
{
    constructor(g, spawnX, spawnY) {
        const playerSprite = g.physics.add.sprite(spawnX, spawnY, 'playerHandgun');
        playerSprite.setCollideWorldBounds(true);

        this.playerSpeed = 200;

        this.sprite = playerSprite;
    }

    up()
    {
        this.sprite.setVelocityY(-this.playerSpeed);
    }

    down()
    {
        this.sprite.setVelocityY(this.playerSpeed);
    }

    left()
    {
        this.sprite.setVelocityX(-this.playerSpeed);
    }

    right()
    {
        this.sprite.setVelocityX(this.playerSpeed);
    }
}