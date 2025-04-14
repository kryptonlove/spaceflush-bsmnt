const jwt = new URLSearchParams(window.location.search).get('token');
const API_URL = 'https://api.basement.fun/launcher';

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: "StartScene" });
    }

    preload() {
        this.load.image("bg", "https://kryptonlove.files.show/poster.png");
        
        this.fontsLoaded = false;
        document.fonts.ready.then(() => {
            this.fontsLoaded = true;
        });
    }

    create() {
        this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, "bg")
        .setOrigin(0.5,0.5)
        .setDisplaySize(this.scale.width, this.scale.height);

        this.add.text(this.scale.width * 0.5, this.scale.height * 0.3, "SPACE FLUSH", { 
            fontSize: "32px", 
            fontFamily: 'Orbitron, sans-serif',
            color: "#fff",
            resolution: window.devicePixelRatio,
        })
        .setOrigin(0.5);


        let playButton = this.add.text(this.scale.width * 0.5, this.scale.height * 0.6, "PLAY", { 
            fontSize: "28px", 
            fontFamily: 'Orbitron, sans-serif', 
            color: "#ff8800", 
            backgroundColor: "#000",
            resolution: window.devicePixelRatio
        })
        .setOrigin(0.5)
        .setInteractive()
        .setPadding(this.scale.width, 10)
        .on("pointerdown", () => {
            playButton.setStyle({ fill: "#000", backgroundColor: "#ff8800" });
            this.time.delayedCall(800, () => this.scene.start("MainScene"));
        });
    }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    this.load.spritesheet("player", "https://kryptonlove.files.show/poopman-sprite.png", { frameWidth: 128, frameHeight: 128 });
    this.load.image("bullet", "https://kryptonlove.files.show/poop.png");
    this.load.spritesheet("enemy", "https://kryptonlove.files.show/snake-sprite.png", { frameWidth: 128, frameHeight: 128 });
  }

  create() {
    this.score = 0;
    this.lives = 2;
    this.gameOver = false;
    this.isPaused = false;
    this.lastBulletTime = 0;
    this.bulletCooldown = 200;
    this.isInvulnerable = false;

    this.pauseButton = this.add.text(this.scale.width * 0.05, 20, "PAUSE", { fontSize: "20px", fontFamily: 'Orbitron, sans-serif', color: "#fff", backgroundColor: "#444" })
      .setInteractive()
      .on("pointerdown", () => this.togglePause());
    this.scoreText = this.add.text(this.scale.width * 0.95, 20, "SCORE: 0", { fontSize: "20px", fontFamily: 'Orbitron, sans-serif', color: "#fff" }).setOrigin(1.0, 0.0);
    this.livesText = this.add.text(this.scale.width * 0.95, 40, "LIVES: 2", { fontSize: "20px", fontFamily: 'Orbitron, sans-serif', color: "#fff" }).setOrigin(1.0, 0.0);

    this.enemySpeed = -50;
    this.enemySpawnDelay = 2500;

    this.anims.create({
      key: "player_move",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });
    this.player = this.physics.add.sprite(this.scale.width * 0.5, 150, "player");
    this.player.anims.play("player_move");
    this.player.body.setSize(64, 64);
    this.player.setOffset(32, 32);
    this.player.setCollideWorldBounds(true);

    this.physics.world.setBounds(10, 10, this.scale.width - 20, this.scale.height - 140, true, true, true, true);

    this.anims.create({
      key: "enemy_move",
      frames: this.anims.generateFrameNumbers("enemy", { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1
    });

    this.bullets = this.physics.add.group({ defaultKey: "bullet", maxSize: 100, runChildUpdate: true });
    this.enemies = this.physics.add.group({ defaultKey: "enemy", maxSize: 10, runChildUpdate: true });

    this.moveDirection = 1;
    this.moving = false;

    this.input.keyboard.on("keydown-SPACE", () => this.movePlayer());
    this.input.keyboard.on("keydown-ENTER", () => this.shootBullet());

    // BUTTONS
    const btnWidth = this.scale.width / 2;
    const btnHeight = 100;

    // MOVE BUTTON
    this.moveButton = new UIButton(
        this,
        btnWidth / 2,                    // x
        this.scale.height - btnHeight / 2, // y
        btnWidth, btnHeight,
        "MOVE",
        {
          bgColor: 0xFFA900,
          color: "#000000",
          fontSize: "20px"
        },
        () => this.movePlayer()
      );
      
      // FLUSH BUTTON
      this.shootButton = new UIButton(
        this,
        this.scale.width - btnWidth / 2,
        this.scale.height - btnHeight / 2,
        btnWidth, btnHeight,
        "FLUSH",
        {
          bgColor: 0xFF5C00,
          color: "#000000",
          fontSize: "20px"
        },
        () => this.shootBullet()
      );

    this.enemySpawnEvent = this.time.addEvent({
      delay: this.enemySpawnDelay,
      loop: true,
      callback: () => {
        if (!this.gameOver && !this.isPaused) {
          let enemy = this.enemies.create(Phaser.Math.Between(50, this.scale.width - 50), this.physics.world.bounds.bottom - 50, "enemy");
          enemy.setScale(0.8);
          enemy.anims.play("enemy_move");
          enemy.setActive(true).setVisible(true);
          enemy.body.setVelocityY(this.enemySpeed);
        }
      }
    });

    this.difficultyTimer = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        this.enemySpeed -= 20;
        this.enemySpawnDelay = Math.max(500, this.enemySpawnDelay - 100);
        this.enemySpawnEvent.reset({
          delay: this.enemySpawnDelay,
          loop: true,
          callback: this.enemySpawnEvent.callback,
          callbackScope: this.enemySpawnEvent.callbackScope
        });
      }
    });

    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      bullet.destroy();
      enemy.destroy();
      this.score++;
      this.scoreText.setText(`SCORE: ${this.score}`);
    });

    this.physics.add.overlap(this.enemies, this.player, (player, enemy) => {
    if (!this.isInvulnerable && !this.gameOver) {
        this.isInvulnerable = true;
        this.lives--;
        this.livesText.setText(`LIVES: ${this.lives}`);

        const enemySprite = enemy;

        if (enemySprite && enemySprite.body) {
            enemySprite.body.enable = false;
            enemySprite.setVelocity(0, 0);
            enemySprite.setActive(false);
            enemySprite.setVisible(false);
        }
        
        // GAME OVER
        if (this.lives <= 0) {
            this.gameOver = true;
            this.physics.pause();

              // Save points to Basement
            fetch(API_URL, {
                method: 'POST',
                headers: {
                'X-Service-Method': 'setUserScore',
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                launcherJwt: jwt,
                nonce: "latestScore",
                score: this.score
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                userNonce = data.newScore.nonce;
                console.log('Points saved:', data.newScore);
                } else {
                console.error('Error while saving:', data);
                }
            })
            .catch(err => console.error('💀 Fetch error:', err));

            // TEXT
            this.add.text(this.scale.width * 0.5, this.scale.height * 0.2, `Game Over`, {
                fontSize: "32px",
                fontFamily: 'Orbitron, sans-serif',
                color: "#fff"
            }).setOrigin(0.5);

            this.add.text(this.scale.width * 0.5, this.scale.height * 0.3, `High Score: ${this.score}`, {
                fontSize: "20px",
                fontFamily: 'Orbitron, sans-serif',
                color: "#fff"
            }).setOrigin(0.5);

            this.add.text(this.scale.width * 0.5, this.scale.height * 0.4, `Share result on Twitter, follow @digglefun and @bsmntdotfun and get some SHMIGGLE`, {
                fontSize: "16px",
                fontFamily: 'Orbitron, sans-serif',
                color: "#fff",
                align: "center",
                wordWrap: { width: this.scale.width * 0.9 }
            }).setOrigin(0.5);

            // SHARE ON TWITTER BUTTON
            let shareButton = this.add.text(this.scale.width * 0.5, this.scale.height * 0.6, "SHARE ON TWITTER", {
              fontSize: "20px",
              fontFamily: 'Orbitron, sans-serif',
              color: "#000",
              backgroundColor: "#07D4FF",
            })
            .setOrigin(0.5)
            .setInteractive()
            .setPadding(this.scale.width, 5)
            .on("pointerdown", () => {
              let tweetText = encodeURIComponent(`I fought off cosmic snakes in Space Flush @bsmntdotfun and scored ${this.score}. Can you beat my score? @digglefun`);
              let tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=https://diggle.fun`;
              window.open(tweetUrl, "_blank");
            });

            // START AGAIN BUTTON
            let restartButton = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, "START AGAIN", {
                fontSize: "20px",
                fontFamily: 'Orbitron, sans-serif',
                color: "#000",
                backgroundColor: "#FFA900"
            })
            .setOrigin(0.5)
            .setInteractive()
            .setPadding(this.scale.width, 5)
            .on("pointerdown", () => {
                this.scene.restart();
            });

        } else {
            this.tweens.add({
                targets: this.player,
                alpha: 0.3,
                duration: 200,
                ease: 'Linear',
                repeat: 3,
                yoyo: true,
                onComplete: () => {
                    this.player.setAlpha(1);
                    this.isInvulnerable = false;
                }
            });
        }

        this.time.delayedCall(50, () => {
            enemy.destroy();
        });
    }
});

  }
  
  update() {
    if (this.isPaused || this.gameOver) return;

    if (this.moving) {
      this.player.setVelocityX(this.moveDirection * 700);
      if (this.player.body.blocked.left || this.player.body.blocked.right) {
        this.moving = false;
        this.player.setVelocityX(0);
      }
    }

    this.bullets.children.iterate((bullet) => {
      if (bullet && bullet.y > this.scale.height - 140) bullet.destroy();
    });

    this.enemies.children.iterate((enemy) => {
      if (enemy && enemy.y < 140) enemy.destroy();
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseButton.setText(this.isPaused ? "RESUME" : "PAUSE");
    this.physics[this.isPaused ? "pause" : "resume"]();
    this.enemySpawnEvent.paused = this.isPaused;
  }

  movePlayer() {
    if (!this.isPaused) {
      this.moveDirection *= -1;
      this.moving = true;
    }
  }

  shootBullet() {
    if (!this.isPaused && this.time.now - this.lastBulletTime > this.bulletCooldown) {
      this.lastBulletTime = this.time.now;
      let bullet = this.bullets.get(this.player.x, this.player.y + 45, "bullet");
      if (bullet) {
        bullet.setActive(true).setVisible(true);
        bullet.body.enable = true;
        bullet.body.setVelocityY(200);
      }
    }
  }
}

const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: Math.min(Math.max(window.innerWidth, 320), 430), // Max width limited by 430px
    height: Math.min(Math.max(window.innerHeight, 568), 932),
    backgroundColor: '#000000',
    physics: { default: "arcade", arcade: { debug: false } },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
    },
    scene: [ StartScene, MainScene ]
});

class UIButton extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, label, style, callback) {
      super(scene, x, y);
  
      // Default style
      const bgColor = style?.bgColor || 0x333333;
      const textColor = style?.color || '#ffffff';
      const fontSize = style?.fontSize || '20px';
  
      // Background
      this.bg = scene.add.rectangle(0, 0, width, height, bgColor)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
  
      // Text
      this.label = scene.add.text(0, 0, label, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: fontSize,
        color: textColor,
      }).setOrigin(0.5);
  
      // Events
      this.bg.on('pointerdown', () => {
        this.bg.setAlpha(0.8);
        callback();
      });
  
      this.bg.on('pointerup', () => this.bg.setAlpha(1));
      this.bg.on('pointerout', () => this.bg.setAlpha(1));
  
      // Add to container
      this.add([this.bg, this.label]);
      scene.add.existing(this);
    }
  }