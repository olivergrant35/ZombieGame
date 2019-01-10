let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
        extend: {
            moveKeys: null,
        }
    }
};

let phaser = new Phaser.Game(config);
let game;
let world;
let running = false;
let shop = false;
let gameOver = false;
let player;
let crosshair;
let map;
let worldLayer;
let bullets;
let bulletSpeed = 500;
let shootTime = 0;
let shotInterval = 150;
let particles;
let emitter;
let menuDrawn = false;

let enemies;
let enemySpeed = 220;
let lastSpawned = 0;
let spawnInterval = 750;

let coin;
let medkit;

let moneyText;
let healthText; 
let playButton;
let exitButton;
let difficultyButton;

let difficulty = 2;

let helpText1;
let helpText2;

let healButton;
let slowZombiesButton;

let damage = 5;

let playerHealth = 100;
let money = 0;
let hitTime = 0;
let hitInterval = 250;

let pistolShotSound;

let up;
let down;
let left;
let right;

let camera;

function preload ()
{
    console.log("Preload");

    game = this;
    graphics = game.add.graphics();

    //Load the player, bullet and crosshair images.
    this.load.image('playerHandgun', 'assets/player/soldier_handgun.png');
    this.load.image('bullet', 'assets/player/bullet.png');
    this.load.image('crosshairImage', 'assets/world/crosshair.png');
    this.load.image('particle', 'assets/world/particle.png');

    //Loading enemy images.
    this.load.image('zombie', 'assets/enimies/zombie.png');

    //Loading coin and medkit image
    this.load.image('coin', 'assets/world/coin.png');
    this.load.image('medkit', 'assets/world/medkit.png');

    //Loading siund files
    this.load.audio('9mmShot', 'assets/sounds/9mmPistolShot.wav');

    //Loading map tiles and export from Tiled.
    this.load.image("tiles", "assets/world/tilemap/tilemap.png");
    this.load.tilemapTiledJSON("map", "assets/world/tilemap/map.json");

    console.log("Preload Complete");
}

function create () {
    console.log("Create");

    //Adding the map and creating the layers from the Tiled map.
    map = this.make.tilemap({key: "map"});
    const tileset = map.addTilesetImage("tileMap", "tiles");
    const belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
    worldLayer = map.createStaticLayer("World", tileset, 0, 0);

    //Setting the collisions on the world layer (e.g tree's and large stones)
    worldLayer.setCollisionByProperty({collides: true});

    //Adding the particles and creating the emitter.
    particles = this.add.particles('particle');

    emitter = particles.createEmitter({
        lifespan: 400,
        speed: 25
    });

    //Finding spawnpoint on the map, spawning player and spawnpoubt and adding collider to world layer. (e.g tree's and large stones)
    const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");
    //player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'playerHandgun');
    player = new Player(this, spawnPoint.x, spawnPoint.y);
    this.physics.add.collider(player.sprite, worldLayer);

    //Creating the pistol shot sound
    pistolShotSound = this.sound.add('9mmShot', {volume: 0.1});

    //Creating bullets group and setting collider for the world layer.
    bullets = this.physics.add.group();
    this.physics.add.collider(bullets, worldLayer, destroyBullet, null, this);

    //Adding coin and medkit to screen
    coin = this.add.image(player.sprite.x -370, player.sprite.y - 270, 'coin');
    medkit = this.add.image(player.sprite.x - 370, player.sprite.y - 210, 'medkit');

    //Creating enemies group and setting collider for the world layer.
    enemies = this.physics.add.group();
    this.physics.add.collider(enemies, worldLayer);
    this.physics.add.collider(bullets, enemies, killEnemy, null, this);
    this.physics.add.collider(player.sprite, enemies, player.hitByEnemy, null, this);

    //Adding the crosshair to the screen.
    crosshair = this.physics.add.sprite(450, 300, 'crosshairImage');

    //Setting the world bounds and making the player and crosshair collide with them.
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    //player.setCollideWorldBounds(true);
    crosshair.setCollideWorldBounds(true);

    //Making the camera follow the player.
    camera = this.cameras.main;
    camera.startFollow(player.sprite);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);    

    //mouse pointer code was taken from https://labs.phaser.io/edit.html?src=src\games\topdownShooter\topdown_targetFocus.js
    // Locks pointer on mousedown
    phaser.canvas.addEventListener('mousedown', function () {
        if(running)
        {
            game.input.mouse.requestPointerLock();
        }        
    });

    // Exit pointer lock when Q or escape (by default) is pressed.
    this.input.keyboard.on('keydown_Q', function (event) {
        if (game.input.mouse.locked)
            game.input.mouse.releasePointerLock();
    }, 0, this);

    // Move crosshair upon locked pointer move
    this.input.on('pointermove', function (pointer) {
        if(running) {
            if (this.input.mouse.locked) {
                crosshair.x += pointer.movementX;
                crosshair.y += pointer.movementY;
            }
        }
    }, this);

    //Key to pause game
    this.input.keyboard.on('keydown_P', function (event){
        running = !running;
    });

    this.input.keyboard.on("keydown_C", function(event){
        running = !running;    
        shop = !shop;
    });

    //Detecting mouse click, creating and shooting a bullet.
    this.input.on('pointerdown', function (pointer) {
        if(running) {
            if(this.time.now > shootTime)
            {
                pistolShotSound.play();
                //Working out the x and y speed to move the bullet to the crosshair location.
                let dx = crosshair.x - player.sprite.x;
                let dy = crosshair.y - player.sprite.y;
                let angle = Math.atan2(dy, dx);
                this.xSpeed = bulletSpeed * Math.cos(angle);
                this.ySpeed = bulletSpeed * Math.sin(angle);

                bullets.create(player.sprite.x, player.sprite.y, 'bullet').setVelocity(this.xSpeed, this.ySpeed);
                shootTime = this.time.now + shotInterval;
            }
        }
    }, this);

    //Setting up WASD as the movment keys.
    up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    //Adding and positioning all of the text.
    moneyText = this.add.text(camera.worldView.x, camera.worldView.y, '0', { fontSize: '40px', fill: '#ffffff'});
    healthText = this.add.text(camera.worldView.x, camera.worldView.y, '100', { fontSize: '40px', fill: '#ffffff'});
    playButton = this.add.text(camera.worldView.x, camera.worldView.y, 'Play', { fontSize: '70px', fill: '#ffffff'}).setInteractive().on('pointerdown', () => startGame());
    exitButton = this.add.text(camera.worldView.x, camera.worldView.y, 'Restart', { fontSize: '70px', fill: '#ffffff'}).setInteractive().on('pointerdown', () => restartGame());
    difficultyButton = this.add.text(0, 0, 'Difficulty: Medium', {fontSize: '50px', fill: '#ffffff'}).setInteractive().on('pointerdown', () => changeDifficulty());

    healButton = this.add.text(0, 0, 'Heal: 100 Coins', {fontSize: '30px', fill: '#ffffff'}).setInteractive().on('pointerdown', () => healPlayer());
    slowZombiesButton = this.add.text(0, 0, 'Slow Zombies: 500 Coins', {fontSize: '30px', fill: '#ffffff'}).setInteractive().on('pointerdown', () => slowZombies());

    helpText1 = this.add.text(camera.worldView.x, camera.worldView.y, 'Press "P" to pause', {fontSize: '20px', fill: '#ffffff'});
    helpText2 = this.add.text(camera.worldView.x, camera.worldView.y, 'Press "C" to open shop', {fontSize: '20px', fill: '#ffffff'});

    //Making sure the icons are on top of everything.
    coin.setDepth(1);
    medkit.setDepth(1); 

    console.log("Create Complete");
}

    function update() {
        player.sprite.setVelocity(0);
        if (running) {
            //Rotates the player to face the crosshair.
            player.sprite.rotation = Phaser.Math.Angle.Between(player.sprite.x, player.sprite.y, crosshair.x, crosshair.y);

            menuDrawn = false;
            playButton.alpha = 0;
            exitButton.alpha = 0;
            difficultyButton.alpha = 0;
            healButton.alpha = 0; 
            slowZombiesButton.alpha = 0;

            if (left.isDown) {
                player.left();
            }
            else if (right.isDown) {
                player.right();
            }

            if (up.isDown) {
                player.up();
            }
            else if (down.isDown) {
                player.down();
            }

            //Checking to see if bullets have left the screen.
            bullets.getChildren().forEach(bullet => {
                if (bullet.body.x > map.widthInPixels || bullet.body.y > map.heightInPixels || bullet.body.y < 0 || bullet.body.x < 0) {
                    bullet.destroy();
                }
            });

            //Making the emitter visible when the player is moving.
            if (player.sprite.body.velocity.x != 0 || player.sprite.body.velocity.y != 0) {
                emitter.visible = true;
                emitter.setPosition(player.sprite.x, player.sprite.y);
            }
            else {
                emitter.visible = false;
            }

            //Spawn enemies
            if(this.time.now > lastSpawned)
            {
                let x = Math.floor(Math.random() * 3000) + 200;
                let y = Math.floor(Math.random() * 3000) + 200;
                
                enemies.create(x, y, 'zombie');

                lastSpawned = this.time.now + spawnInterval;
            }

            //Updating enemy movement
            enemies.getChildren().forEach(enemy => {
                if (enemy.active == true && enemy.visible == true) {
                    //Working out the x and y speed to move the enemy to the player location.
                    let dx = player.sprite.x - enemy.x;
                    let dy = player.sprite.y - enemy.y;
                    let angle = Math.atan2(dy, dx);
                    let xSpeed = enemySpeed * Math.cos(angle);
                    let ySpeed = enemySpeed * Math.sin(angle);

                    enemy.body.velocity.x = xSpeed;
                    enemy.body.velocity.y = ySpeed;

                    enemy.rotation = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.sprite.x, player.sprite.y);
                }
            })

            //Make it so the player cannot move faster when going in a diagonal.
            player.sprite.body.velocity.normalize().scale(player.playerSpeed);

            //Making the crosshair and score text move with the player.
            crosshair.body.velocity.x = player.sprite.body.velocity.x;
            crosshair.body.velocity.y = player.sprite.body.velocity.y;
            //Making moneyText, healthtext and icons stay at the top left of screen. 
            moneyText.x = camera.worldView.x + 60;
            moneyText.y = camera.worldView.y + 15;
            healthText.x = camera.worldView.x + 60;
            healthText.y = camera.worldView.y + 73;
            coin.x = camera.worldView.x + 30;
            coin.y = camera.worldView.y + 30;
            medkit.x = camera.worldView.x + 30;
            medkit.y = camera.worldView.y + 90; 

            helpText1.x = camera.worldView.x + 570;
            helpText1.y = camera.worldView.y + 15;
            helpText2.x = camera.worldView.x + 520;
            helpText2.y = camera.worldView.y + 35;

            //Old code used to make text and icons stay at top left. Now using camera location. 
            // if(player.sprite.x < 400)
            // {
            //     moneyText.x = 60;
            //     healthText.x = 60;
            //     coin.x = 30; 
            //     medkit.x = 30; 
            // }else
            // {
            //     moneyText.x = player.sprite.x - 340;
            //     healthText.x = player.sprite.x - 340;
            //     coin.x = player.sprite.x - 370;
            //     medkit.x = player.sprite.x - 370;
            // }

            // if(player.sprite.y < 300)
            // {
            //     moneyText.y = 10;
            //     healthText.y = 73;
            //     coin.y = 30; 
            //     medkit.y = 90;
            // }else
            // {
            //     moneyText.y = player.sprite.y - 285;
            //     healthText.y = player.sprite.y - 227;
            //     coin.y = player.sprite.y - 270; 
            //     medkit.y = player.sprite.y - 210; 
            // }

            //Want to make it so money changes opacity if its covering player.
            if(player.sprite.x < moneyText.x + 85 && player.sprite.y < healthText.y + 70)
            {
                moneyText.alpha = 0.5;
                healthText.alpha = 0.5;
                coin.alpha = 0.5;
                medkit.alpha = 0.5; 
            }else
            {
                moneyText.alpha = 1;
                healthText.alpha = 1;
                coin.alpha = 1;
                medkit.alpha = 1; 
            }            

            constrainCrosshair(crosshair, 275);
        }
        else if(running == false && shop == false && gameOver == false)
        {
            //Game is paused so need to create a menu of sorts
            crosshair.setVelocity(0);
            emitter.visible = false;

            stopEnemies();

            if(menuDrawn == false)
            {
                game.input.mouse.releasePointerLock();
                playButton.setPosition(player.sprite.x - 85, player.sprite.y - 100);
                playButton.alpha = 1;
                exitButton.setPosition(player.sprite.x - 150, player.sprite.y + 50);
                exitButton.alpha = 1;
                difficultyButton.setPosition(player.sprite.x - 300, player.sprite.y + 200);
                difficultyButton.alpha = 1;
                menuDrawn = true;
            }
        }
        else if(running == false && shop == true && gameOver == false)
        {
            //Need to display shop menu
            crosshair.setVelocity(0);
            emitter.visible = false;

            stopEnemies();

            if(menuDrawn == false)
            {
                //Display shop
                game.input.mouse.releasePointerLock();
                healButton.setPosition(player.sprite.x - 120, player.sprite.y - 200);
                healButton.alpha = 1;
                slowZombiesButton.setPosition(player.sprite.x - 190, player.sprite.y - 100);
                slowZombiesButton.alpha = 1;
                menuDrawn = true;
            }            
        }
        else if(gameOver)
        {
            //Need to display game over menu
            crosshair.setVelocity(0);
            emitter.visible = false;

            stopEnemies();

            if(menuDrawn == false)
            {                
                exitButton.setPosition(player.sprite.x - 150, player.sprite.y);
                exitButton.alpha = 1;
                menuDrawn = true;
            }
            game.input.mouse.releasePointerLock();
        }
    }

    function stopEnemies()
    {
        enemies.getChildren().forEach(enemy => {
            if (enemy.active == true && enemy.visible == true) {
                enemy.body.velocity.x = 0;
                enemy.body.velocity.y = 0;
            }
        })
    }

    function destroyBullet(bullet)
    {
        //Bullet hit worldLayer.
        console.log("Bullet hit world layer, destroy bullet");
        bullet.destroy();
    }

    function killEnemy(bullet, enemy)
    {
        money += 2;
        moneyText.setText(money);
        bullet.destroy();
        enemy.destroy();
    }

    function startGame()
    {
        running = true;
        game.input.mouse.requestPointerLock();
    }

    function restartGame()
    {
        //Find how to refresh the page so the game restarts.
        window.location.reload();
    }

    function healPlayer()
    {
        if(money >= 100)
        {
            money = money - 100; 
            playerHealth = 100;
            moneyText.setText(money);
            healthText.setText(playerHealth);
        }
    }

    function slowZombies()
    {
        if(money >= 500)
        {
            money = money - 500;
            moneyText.setText(money);
            enemySpeed = 200;
        }        
    }

    //Difficulties 1 = 1000 (Easy); 2 = 750 (Medium); 3 = 500 (HARD); 4 = 250 (Impossible)
    function changeDifficulty()
    {
        if(difficulty == 1)
        {
            difficulty = 2; 
            spawnInterval = 1000;
            difficultyButton.setText("Difficulty: Easy");
        }
        else if(difficulty == 2)
        {
            difficulty = 3;
            spawnInterval = 750;
            difficultyButton.setText("Difficulty: Medium");
        }
        else if(difficulty == 3)
        {
            difficulty = 4;
            spawnInterval = 500;
            difficultyButton.setText("Difficulty: Hard");
        }
        else if(difficulty == 4)
        {
            difficulty = 1;
            spawnInterval = 250;
            difficultyButton.setText("Difficulty: Impossible");
        }
        else{
            difficulty = 1;
        }        
    }


//BELOW CODE WAS GOT FROM https://labs.phaser.io/edit.html?src=src\games\topdownShooter\topdown_targetFocus.js
    function constrainCrosshair(crosshair, radius) {
        let distX = crosshair.x - player.sprite.x; // X distance between player & crosshair
        let distY = crosshair.y - player.sprite.y; // Y distance between player & crosshair

        // Ensures crosshair cannot be moved crosshair
        if (distX > 800)
            crosshair.x = player.sprite.x + 800;
        else if (distX < -800)
            crosshair.x = player.sprite.x - 800;

        if (distY > 600)
            crosshair.y = player.sprite.y + 600;
        else if (distY < -600)
            crosshair.y = player.sprite.y - 600;

        // Ensures crosshair cannot be moved further than dist(radius) from player
        let distBetween = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, crosshair.x, crosshair.y);
        if (distBetween > radius) {
            // Place crosshair on perimeter of circle on line intersecting player & crosshair
            let scale = distBetween / radius;

            crosshair.x = player.sprite.x + (crosshair.x - player.sprite.x) / scale;
            crosshair.y = player.sprite.y + (crosshair.y - player.sprite.y) / scale;
        }
    }