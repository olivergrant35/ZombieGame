class Player
{
    constructor(g, spawnX, spawnY) {
        const playerSprite = g.physics.add.sprite(spawnX, spawnY, 'playerHandgun');

        playerSprite.setCollideWorldBounds(true);

        this.sprite = playerSprite;
        console.log(game);
        console.log(game.physics);
    }

    setVel(x, y)
    {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    up()
    {

    }

    down()
    {

    }

    left()
    {

    }

    right()
    {

    }
}