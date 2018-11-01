class Player {
    constructor(g, spawnX, spawnY) {

        const playerSprite = g.physics.add.sprite(spawnX, spawnY, 'playerHandgun');
        playerSprite.setCollideWorldBounds(true);

        this.playerSpeed = 200;
        this.playerHealth = 100;
        this.money = 0;
        this.sprite = playerSprite;
    }

    hitByEnemy(damage)
    {
        this.playerHealth -= damage;
        if(this.playerHealth <= 0)
        {
            //Player is dead so stopping game and setting gameOver to true;
            running = false;
            gameOver = true;
        }
    }

    enemyKilled()
    {
        this.money += 5;
        moneyText.setText('Money: ' + this.money);
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