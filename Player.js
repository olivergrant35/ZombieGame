class Player
{
    constructor(g, spawnX, spawnY) {
        const playerSprite = g.physics.add.sprite(spawnX, spawnY, 'playerHandgun');
        playerSprite.setCollideWorldBounds(true);

        this.playerSpeed = 200;

        this.sprite = playerSprite;
    }

    setVel(x, y)
    {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    up()
    {
        this.sprite.x -= playerSpeed;
    }

    down()
    {
        this.sprite.x += playerSpeed;
    }

    left()
    {
        this.sprite.y -= playerSpeed;
    }

    right()
    {
        this.sprite.y += playerSpeed;
    }
}