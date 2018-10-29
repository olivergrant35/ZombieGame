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

let game = new Phaser.Game(config);
let world;

let running = true;

let player;
let playerSpeed = 200;

let crosshair;
let cursors;

let map;
let worldLayer;

let bullets;
let bulletSpeed = 500;
let shootTime = 0;

let enemies;
let enemySpeed = 300;

let particles;
let emitter;

function preload ()
{
    console.log("Preload");

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
    bullets = this.physics.add.group({
        maxSize: 30
    });
    this.physics.add.collider(bullets, worldLayer);

    //Creating enemies group and setting collider for the world layer.
    enemies = this.physics.add.group({

    });
    this.physics.add.collider(enemies, worldLayer);

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

    //Creating the cursor object.
    cursors = this.input.keyboard.createCursorKeys();

    //mouse pointer code was taken from https://labs.phaser.io/edit.html?src=src\games\topdownShooter\topdown_targetFocus.js
    // Locks pointer on mousedown
    game.canvas.addEventListener('mousedown', function () {
        if(running) {
            game.input.mouse.requestPointerLock();
        }
    });

    // Exit pointer lock when Q or escape (by default) is pressed.
    this.input.keyboard.on('keydown_Q', function (event) {
        if(running) {
            if (game.input.mouse.locked)
                game.input.mouse.releasePointerLock();
        }
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

    this.input.keyboard.on('keydown_P', function (event){
       running = !running;
    });

    //Detecting mouse click, creating and shooting a bullet.
    this.input.on('pointerdown', function (pointer) {
        if(running) {

        }
    }, this);

    console.log("Create Complete");
}

    function update() {
        player.sprite.setVelocity(0);
        if (running) {
            //Rotates the player to face the crosshair.
            player.sprite.rotation = Phaser.Math.Angle.Between(player.x, player.y, crosshair.x, crosshair.y);

            if (cursors.left.isDown) {
                player.sprite.body.setVelocityX(-playerSpeed);
            }
            else if (cursors.right.isDown) {
                player.sprite.body.setVelocityX(playerSpeed);
            }

            if (cursors.up.isDown) {
                player.sprite.body.setVelocityY(-playerSpeed);
            }
            else if (cursors.down.isDown) {
                player.sprite.body.setVelocityY(playerSpeed);
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

            //Updating enemy movement
            enemies.getChildren().forEach(enemy => {
                if (enemy.active == true && enemy.visible == true) {
                    //Working out the x and y speed to move the bullet to the crosshair location.
                    let dx = player.sprite.x - enemy.x;
                    let dy = player.sprite.y - enemy.y;
                    let angle = Math.atan2(dy, dx);
                    let xSpeed = enemySpeed * Math.cos(angle);
                    let ySpeed = enemySpeed * Math.sin(angle);

                    enemy.body.velocity.x = xSpeed;
                    enemy.body.velocity.y = ySpeed;
                }
            })

            //Make it so the player cannot move faster when going in a diagonal.
            player.sprite.body.velocity.normalize().scale(playerSpeed);

            //Making the crosshair move with the player.
            crosshair.body.velocity.x = player.sprite.body.velocity.x;
            crosshair.body.velocity.y = player.sprite.body.velocity.y;

            constrainCrosshair(crosshair, 275);
        }
        else
        {
            //Game is paused so need to create a menu of sorts
            crosshair.setVelocity(0);
            emitter.visible = false;
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