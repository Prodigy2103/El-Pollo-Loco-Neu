import { Character } from "../models/character.class.js";
import { Level } from "../models/level.class.js";
import { IntervalHub } from "../js/intervalhub.class.js";
import { Statusbar } from "./statusbar.class.js";
import { Picture } from "../js/imghelper.js";
import { Coinbar } from "../models/coinbar.class.js";
import { BottleBar } from "./bottlebar.class.js";
import { ThrowableObject } from "./throwable_object.class.js";
import { Bottle } from "./bottlemain.js";
import { AudioHub } from './../js/audio_hub.class.js';
import { EndbossBar } from "./endbossbar.class.js";
import { Endboss } from "./endboss.class.js";
import { GameState } from "./game-state.class.js";

/**
 * The central game engine class.
 * Orchestrates rendering, collision detection, object management, and game state transitions.
 */
export class World {

    character;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    level;
    statusBar = new Statusbar();
    coinBar = new Coinbar();
    bottleBar = new BottleBar();
    throwableObject = [];
    endbossBar = new EndbossBar();
    lastThrow = 0;
    gameEnded = false;
    gameEndingStarted = false;
    onGameOver;

    /**
     * Initializes a new game world instance.
     * @param {HTMLCanvasElement} canvas 
     * @param {Keyboard} keyboard 
     * @param {Function} onGameOver 
     */
    constructor(canvas, keyboard, onGameOver) {
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.onGameOver = onGameOver;
        this.level = new Level();
        this.character = new Character();

        this.updateBars();
        this.setWorld();
        this.character.startAnimation();
        this.run();
        this.draw();
    }

    /**
     * Injects a reference of this world instance into key entities.
     */
    setWorld() {
        this.character.world = this;
        if (this.level && this.level.enemies) {
            this.level.enemies.forEach(enemy => {
                if (enemy instanceof Endboss) enemy.world = this;
            });
        }
    }

    /**
     * Starts the asynchronous logic loops for the game engine.
     */
    run() {
        IntervalHub.startInterval(() => this.checkCollisions(), 1000 / 180);
        IntervalHub.startInterval(() => this.checkCollectables(), 1000 / 60);
        IntervalHub.startInterval(() => this.checkThrowObjects(), 200);
        IntervalHub.startInterval(() => this.checkBottleCollisions(), 1000 / 60);
        IntervalHub.startInterval(() => this.checkGameState(), 100);
    }

    /**
     * Monitors win/loss conditions based on entity energy levels.
     */
    checkGameState() {
        if (this.gameEndingStarted) return;

        // Check Pepe Death
        if (this.character.energy <= 0) {
            this.gameEndingStarted = true;
            this.character.handleDeath();
            setTimeout(() => this.finishGame('lose'), 2000);
            return; // Wichtig, damit nicht beide Screens triggern
        }

        // Check Boss Death
        const boss = this.level.enemies.find(e => e instanceof Endboss);
        if (boss && boss.energy <= 0) {
            this.gameEndingStarted = true;
            // Wir warten 2 Sekunden, damit die Dead-Animation des Bosses zu sehen ist
            setTimeout(() => this.finishGame('win'), 2000);
        }
    }

    finishGame(result) {
        this.gameEnded = true;
        IntervalHub.stopAllIntervals(); // Stoppt jetzt erst die Animationen
        AudioHub.stopAll();

        if (this.onGameOver) {
            this.onGameOver(result); // Ruft showEndscreen in game.js auf
        }
    }

    /**
     * Manages the visual transition to the game over screen.
     * @param {'win'|'lose'} result 
     */
    handleGameOver(result) {
        const endScreenImgRef = document.getElementById("end-screen-img");
        if (typeof toggleElement === 'function') {
            toggleElement(document.getElementById('end-screen'), true, 'flex');
        }

        setTimeout(() => {
            const isWin = result === 'win';
            const sound = isWin ? AudioHub.GAME_WIN : AudioHub.GAME_LOSE;
            if (endScreenImgRef) {
                endScreenImgRef.src = isWin
                    ? "assets/img/You won, you lost/You win B.png"
                    : "assets/img/You won, you lost/You lost b.png";
            }
            AudioHub.playOne(sound);
        }, 300);
    }

    /**
     * High-frequency check for physical intersections between entities.
     */
    checkCollisions() {
        this.level.enemies.forEach((enemy) => {
            if (this.character.isCollidingAbove(enemy) && !enemy.isDead()) {
                this.playDeathSound(enemy);
                enemy.energy = 0;
                setTimeout(() => {
                    let index = this.level.enemies.indexOf(enemy);
                    if (index > -1) this.level.enemies.splice(index, 1);
                }, 500);
            } else if (this.character.isColliding(enemy) && !enemy.isDead()) {
                if (!this.character.isHurt()) {
                    this.character.hit();
                    this.statusBar.setPercentage(this.character.energy, Picture.statusBar.health);
                }
            }
        });
        this.checkCollectables();
    }

    /**
     * Master render loop. Executes at the screen refresh rate.
     */
    draw() {
        if (this.gameEnded) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Camera positioning logic
        let newCameraX = -this.character.x + 100;
        this.camera_x = Math.min(0, newCameraX);

        this.ctx.translate(this.camera_x, 0);
        this.addMovableObjects();
        this.ctx.translate(-this.camera_x, 0);

        this.addFixedObjects();

        requestAnimationFrame(() => this.draw());
    }

    /**
     * Renders objects that scroll with the game world.
     */
    addMovableObjects() {
        this.addObjectsToMap(this.level.backgroundObjects);
        this.addObjectsToMap(this.level.clouds);
        this.addObjectsToMap(this.level.collectibles.coins);
        this.addObjectsToMap(this.level.collectibles.bottles);
        this.addObjectsToMap(this.level.enemies);
        this.addObjectsToMap(this.throwableObject);
        this.addToMap(this.character);
    }

    /**
     * Iterates through an array of objects to draw them.
     * @param {DrawableObject[]} objects 
     */
    addObjectsToMap(objects) {
        objects.forEach((o) => this.addToMap(o));
    }

    /**
     * Handles drawing, including image mirroring for direction changes and debug frames.
     * @param {MovableObject} mO 
     */
    addToMap(mO) {
        if (mO.otherDirection) this.flipImage(mO);
        mO.draw(this.ctx);
        if (mO.otherDirection) this.flipImageBack(mO);

        if (mO.drawFrame) mO.drawFrame(this.ctx);
        if (mO.drawOffsetFrame) mO.drawOffsetFrame(this.ctx);
    }

    /**
     * Renders UI elements that remain stationary (Heads-up Display).
     */
    addFixedObjects() {
        this.addToMap(this.statusBar);
        this.addToMap(this.coinBar);
        this.addToMap(this.bottleBar);
        this.addToMap(this.endbossBar);
    }

    /**
     * Flips the rendering context to draw sprites facing the opposite direction.
     * @param {MovableObject} mo 
     */
    flipImage(mo) {
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.translate(-mo.width - (mo.x * 2), 0);
    }

    /**
     * Restores the rendering context after a flip.
     */
    flipImageBack(mo) {
        this.ctx.restore();
    }

    /**
     * Wrapper for all item collection checks.
     */
    checkCollectables() {
        this.collectCoin();
        this.collectBottle();
    }

    /**
     * Checks collision with coins and updates the GameState.
     */
    collectCoin() {
        this.level.collectibles.coins.forEach((coin, index) => {
            if (this.character.isColliding(coin)) {
                AudioHub.COIN_COLLECTED.sound.volume = 0.25;
                AudioHub.playOne(AudioHub.COIN_COLLECTED);
                GameState.coinPercentage += 20;
                this.level.collectibles.coins.splice(index, 1);
                this.coinBar.setPercentage(GameState.coinPercentage, Picture.statusBar.coin);
            }
        });
    }

    /**
     * Checks collision with bottles and updates ammunition inventory.
     */
    collectBottle() {
        if (!this.level?.collectibles?.bottles) return;
        for (let i = this.level.collectibles.bottles.length - 1; i >= 0; i--) {
            let bottle = this.level.collectibles.bottles[i];
            if (this.character.isColliding(bottle) && Bottle.canBeStored()) {
                AudioHub.BOTTLE_COLLECTED.sound.volume = 0.25;
                AudioHub.playOne(AudioHub.BOTTLE_COLLECTED);
                GameState.bottlePercentage += 20;
                this.level.collectibles.bottles.splice(i, 1);
                this.bottleBar.setPercentage(GameState.bottlePercentage, Picture.statusBar.bottle);
            }
        }
    }

    /**
     * Plays the appropriate death sound based on the enemy type with specific volumes.
     * @param {Object} enemy 
     */
    playDeathSound(enemy) {
        if (enemy instanceof Endboss) return;

        if (enemy.constructor.name === 'Smallchicken') {
            AudioHub.LITTLECHICK_DEAD.sound.volume = 0.20;
            AudioHub.playOne(AudioHub.LITTLECHICK_DEAD);
        } else {
            AudioHub.NORMALCHICK_DEAD.sound.volume = 0.25;
            AudioHub.playOne(AudioHub.NORMALCHICK_DEAD);
        }
    }

    /**
     * Synchronizes UI status bars with the global GameState.
     */
    updateBars() {
        this.coinBar.setPercentage(GameState.coinPercentage, Picture.statusBar.coin);
        this.bottleBar.setPercentage(GameState.bottlePercentage, Picture.statusBar.bottle);
    }

    /**
     * Checks for projectile input and instantiates ThrowableObjects.
     */
    checkThrowObjects() {
        let now = new Date().getTime();
        let canThrow = this.keyboard.D && GameState.bottlePercentage > 0 && (now - this.lastThrow) > 400;

        if (canThrow) {
            let bottle = new ThrowableObject({
                _x: this.character.x + 100,
                _y: this.character.y + 100,
                _otherDirection: this.character.otherDirection
            });

            this.throwableObject.push(bottle);
            GameState.bottlePercentage -= 20;
            this.updateBars();
            AudioHub.BREAK_BOTTLE.sound.volume = 0.20;
            AudioHub.playOne(AudioHub.BREAK_BOTTLE);
            this.lastThrow = now;
        }
    }

    /**
     * Manages collision between active projectiles and enemies.
     */
    checkBottleCollisions() {
        this.throwableObject.forEach((bottle, bottleIndex) => {
            this.level.enemies.forEach((enemy) => {
                if (bottle.isColliding(enemy) && !bottle.hit) {
                    bottle.hit = true;
                    enemy.hit(20);
                    if (enemy instanceof Endboss) {
                        this.endbossBar.setPercentage(enemy.energy, Picture.statusBar.endboss);
                    }
                    setTimeout(() => this.throwableObject.splice(bottleIndex, 1), 500);
                }
            });
        });
    }
}