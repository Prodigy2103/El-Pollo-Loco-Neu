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
     * Starts the asynchronous logic loops. 
     * Uses different frequencies for physics, input, and state checks.
     */
    run() {
        IntervalHub.startInterval(() => {
            this.checkCollisions()
            this.checkCollectables();
            this.checkBottleCollisions();
            this.cleanUpThrowableObjects();
        }, 1000 / 60);
        
        // Lower frequency for user input and game state
        IntervalHub.startInterval(() => this.checkThrowObjects(), 200);
        IntervalHub.startInterval(() => this.checkGameState(), 100);
    }

    /**
     * Monitors win/loss conditions based on entity energy levels.
     */
    checkGameState() {
        if (this.gameEndingStarted) return;
        
        if (this.character.energy <= 0) {
            this.gameEndingStarted = true;
            this.character.handleDeath();
            setTimeout(() => this.finishGame('lose'), 1000);
            return;
        }

        const boss = this.level.enemies.find(e => e instanceof Endboss);
        if (boss && boss.energy <= 0) {
            this.gameEndingStarted = true;
            setTimeout(() => this.finishGame('win'), 1500); // Give time for boss death animation
        }
    }

    /**
     * Stops all game loops and triggers the UI transition.
     * @param {'win'|'lose'} result 
     */
    finishGame(result) {
        this.gameEnded = true;
        IntervalHub.stopAllIntervals();
        AudioHub.stopAll();
        if (this.onGameOver) this.onGameOver(result);
    }

    /**
     * High-frequency check for physical intersections. 
     * Distinguishes between "Stomping" (kill) and "Hitting" (damage).
     */
    checkCollisions() {
        this.level.enemies.forEach((enemy) => {
            if (enemy.isDead()) return;

            if (this.character.isCollidingAbove(enemy)) {
                this.handleStomp(enemy);
            } else if (this.character.isColliding(enemy)) {
                this.handlePlayerHit();
            }
        });
    }

    handleStomp(enemy) {
        this.playDeathSound(enemy);
        enemy.energy = 0;
        this.character.speedY = 15; // Bounce off the enemy

        setTimeout(() => {
            let index = this.level.enemies.indexOf(enemy);
            if (index > -1) this.level.enemies.splice(index, 1);
        }, 500);
    }

    handlePlayerHit() {
        this.character.hit(); // Internally manages invincibility frames
        this.statusBar.setPercentage(this.character.energy, Picture.statusBar.health);
    }

    /**
     * Master render loop.
     */
    draw() {
        if (this.gameEnded) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let newCameraX = -this.character.x + 100;
        this.camera_x = Math.min(0, newCameraX);

        this.ctx.translate(this.camera_x, 0);
        this.addMovableObjects();
        this.ctx.translate(-this.camera_x, 0);

        this.addFixedObjects();
        requestAnimationFrame(() => this.draw());
    }

    addMovableObjects() {
        this.addObjectsToMap(this.level.backgroundObjects);
        this.addObjectsToMap(this.level.clouds);
        this.addObjectsToMap(this.level.collectibles.coins);
        this.addObjectsToMap(this.level.collectibles.bottles);
        this.addObjectsToMap(this.level.enemies);
        this.addObjectsToMap(this.throwableObject);
        this.addToMap(this.character);
    }

    addFixedObjects() {
        this.addToMap(this.statusBar);
        this.addToMap(this.coinBar);
        this.addToMap(this.bottleBar);
        this.addToMap(this.endbossBar);
    }

    addObjectsToMap(objects) {
        objects.forEach((o) => this.addToMap(o));
    }

    addToMap(mO) {
        if (mO.otherDirection) this.flipImage(mO);
        mO.draw(this.ctx);
        if (mO.otherDirection) this.flipImageBack(mO);
        if (mO.drawFrame) mO.drawFrame(this.ctx);
        if (mO.drawOffsetFrame) mO.drawOffsetFrame(this.ctx);
    }

    flipImage(mo) {
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.translate(-mo.width - (mo.x * 2), 0);
    }

    flipImageBack(mo) {
        this.ctx.restore();
    }

    checkCollectables() {
        this.collectCoin();
        this.collectBottle();
    }

    collectCoin() {
        this.level.collectibles.coins.forEach((coin, index) => {
            if (this.character.isColliding(coin)) {
                AudioHub.playOne(AudioHub.COIN_COLLECTED);
                GameState.coinPercentage += 20;
                this.level.collectibles.coins.splice(index, 1);
                this.coinBar.setPercentage(GameState.coinPercentage, Picture.statusBar.coin);
            }
        });
    }

    collectBottle() {
        if (!this.level?.collectibles?.bottles) return;
        for (let i = this.level.collectibles.bottles.length - 1; i >= 0; i--) {
            let bottle = this.level.collectibles.bottles[i];
            if (this.character.isColliding(bottle) && Bottle.canBeStored()) {
                AudioHub.playOne(AudioHub.BOTTLE_COLLECTED);
                GameState.bottlePercentage += 20;
                this.level.collectibles.bottles.splice(i, 1);
                this.bottleBar.setPercentage(GameState.bottlePercentage, Picture.statusBar.bottle);
            }
        }
    }

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
            AudioHub.playOne(AudioHub.BREAK_BOTTLE);
            this.lastThrow = now;
        }
    }

    checkBottleCollisions() {
        this.throwableObject.forEach((bottle) => {
            this.level.enemies.forEach((enemy) => {
                if (bottle.isColliding(enemy) && !bottle.hit && !enemy.isDead()) {
                    bottle.splash();
                    enemy.hit(20);
                    if (enemy instanceof Endboss) {
                        this.endbossBar.setPercentage(enemy.energy, Picture.statusBar.endboss);
                    }
                }
            });
        });
    }

    /**
     * Filters out bottles that have finished their splash animation or gone out of bounds.
     */
    cleanUpThrowableObjects() {
        this.throwableObject = this.throwableObject.filter(bottle => !bottle.isFullyRemoved);
    }

    updateBars() {
        this.coinBar.setPercentage(GameState.coinPercentage, Picture.statusBar.coin);
        this.bottleBar.setPercentage(GameState.bottlePercentage, Picture.statusBar.bottle);
    }

    playDeathSound(enemy) {
        if (enemy instanceof Endboss) return;
        let sound = enemy.constructor.name === 'Smallchicken' ? AudioHub.LITTLECHICK_DEAD : AudioHub.NORMALCHICK_DEAD;
        AudioHub.playOne(sound);
    }
}