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
let spawnInterval = 1000;

let moneyText;
let playButton;
let exitButton;

let damage = 5;

let playerHealth = 100;
let money = 0;
let hitTime = 0;
let hitInterval = 250;

let up;
let down;
let left;
let right;

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

    //Creating bullets group and setting collider for the world layer.
    bullets = this.physics.add.group();
    this.physics.add.collider(bullets, worldLayer, destroyBullet, null, this);

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
    const camera = this.cameras.main;
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
        
    });

    //Detecting mouse click, creating and shooting a bullet.
    this.input.on('pointerdown', function (pointer) {
        if(running) {
            if(this.time.now > shootTime)
            {
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

    moneyText = this.add.text(player.sprite.x - 390, player.sprite.y - 290, 'Money:0', { fontSize: '40px', fill: '#ffffff'});
    playButton = this.add.text(player.sprite.x - 85, player.sprite.y - 100, 'Play', { fontSize: '70px', fill: '#ffffff'}).setInteractive().on('pointerdown', () => startGame());
    exitButton = this.add.text(player.sprite.x - 150, player.sprite.y + 50, 'Restart', { fontSize: '70px', fill: '#ffffff'}).setInteractive().on('pointerdown', () => restartGame());
    
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
            //Making moneyText stay at the top left of the screen. Might change "money" to coin icon.
            if(player.sprite.x < 400)
            {
                moneyText.x = 10;
            }else
            {
                moneyText.x = player.sprite.x - 390;
            }

            if(player.sprite.y < 300)
            {
                moneyText.y = 10;
            }else
            {
                moneyText.y = player.sprite.y - 290;
            }

            //Want to make it so money changes opacity if its covering player.
            if(player.sprite.x < moneyText.width + 20 && player.sprite.y < moneyText.height + 20)
            {
                moneyText.alpha = 0.5;
            }else
            {
                moneyText.alpha = 1;
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
                menuDrawn = true;
            }
        }
        else if(running == false && shop == true && gameOver == false)
        {
            //Need to display shop menu
            crosshair.setVelocity(0);
            emitter.visible = false;

            stopEnemies();
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
        moneyText.setText("Money:" + money);
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