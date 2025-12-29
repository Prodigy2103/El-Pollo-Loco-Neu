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
      * This allows entities to access global properties like the character or keyboard state.
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
     * Runs physics, collision, and cleanup at 60 FPS, while throttling state checks.
     */
    run() {
        IntervalHub.startInterval(() => {
            this.checkCollisions()
            this.checkCollectables();
            this.checkBottleCollisions();
        }, 1000 / 60);

        // Lower frequency for user input and game state
        IntervalHub.startInterval(() => this.checkThrowObjects(), 200);
        IntervalHub.startInterval(() => this.checkGameState(), 100);
    }

    /**
     * Monitors win/loss conditions based on entity energy levels.
     * Triggers the game ending sequence if the character or boss is defeated.
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
     * Finalizes the game session.
     * Stops all active intervals and sounds before invoking the game over callback.
     * @param {'win'|'lose'} result - The outcome of the game.
     */
    finishGame(result) {
        this.gameEnded = true;
        IntervalHub.stopAllIntervals();
        AudioHub.stopAll();
        if (this.onGameOver) this.onGameOver(result);
    }

    /**
     * High-frequency check for physical intersections between entities.
     * Distinguishes between jumping on an enemy's head (stomp) or taking damage.
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

    /**
     * Processes an enemy defeat when the character lands on top of it.
     * @param {MovableObject} enemy - The enemy object being stomped.
     */
    handleStomp(enemy) {
        this.playDeathSound(enemy);
        enemy.energy = 0;
        this.character.speedY = 15; // Bounce off the enemy

        setTimeout(() => {
            let index = this.level.enemies.indexOf(enemy);
            if (index > -1) this.level.enemies.splice(index, 1);
        }, 500);
    }

    /**
     * Inflicts damage on the character and updates the health status bar.
     */
    handlePlayerHit() {
        this.character.hit(20); // Internally manages invincibility frames
        this.statusBar.setPercentage(this.character.energy, Picture.statusBar.health);
    }

    /**
     * Main rendering loop synchronized with the screen's refresh rate.
     * Clears the canvas and draws all game objects in their current state.
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

    /**
     * Renders objects that move relative to the character (enemies, items, etc.).
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
     * Renders user interface elements that remain in a fixed screen position.
     */
    addFixedObjects() {
        this.addToMap(this.statusBar);
        this.addToMap(this.coinBar);
        this.addToMap(this.bottleBar);
        this.addToMap(this.endbossBar);
    }

    /**
     * Iterates through an array of objects and draws them on the canvas.
     * @param {MovableObject[]} objects - Array of drawable entities.
     */
    addObjectsToMap(objects) {
        objects.forEach((o) => this.addToMap(o));
    }

    /**
     * Draws a single object, handling horizontal mirroring if necessary.
     * @param {MovableObject} mO - The object to be drawn.
     */
    addToMap(mO) {
        if (mO.otherDirection) this.flipImage(mO);
        mO.draw(this.ctx);
        if (mO.otherDirection) this.flipImageBack(mO);
        if (mO.drawFrame) mO.drawFrame(this.ctx);
        if (mO.drawOffsetFrame) mO.drawOffsetFrame(this.ctx);
    }

    /**
     * Mirrors the canvas context for objects facing the left direction.
     * @param {MovableObject} mo - The object whose image is being flipped.
     */
    flipImage(mo) {
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.translate(-mo.width - (mo.x * 2), 0);
    }

    /**
     * Restores the canvas context to the standard non-mirrored state.
     * @param {MovableObject} mo - The object whose image was flipped.
     */
    flipImageBack(mo) {
        this.ctx.restore();
    }

    /**
     * Checks for collisions with collectible items (coins and bottles).
     */
    checkCollectables() {
        this.collectCoin();
        this.collectBottle();
    }

    /**
     * Handles logic for picking up coins and updating the coin bar.
     */
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

    /**
     * Handles logic for picking up bottles if inventory space is available.
     */
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

    /**
     * Checks for throw input and spawns new ThrowableObjects.
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
            AudioHub.playOne(AudioHub.BREAK_BOTTLE);
            this.lastThrow = now;
        }
    }

    /**
     * Manages collision detection between flying projectiles and enemies.
     */
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
     * Synchronizes UI status bars with the current global game state.
     */
    updateBars() {
        this.coinBar.setPercentage(GameState.coinPercentage, Picture.statusBar.coin);
        this.bottleBar.setPercentage(GameState.bottlePercentage, Picture.statusBar.bottle);
    }

    /**
     * Plays the appropriate death sound based on the type of enemy defeated.
     * @param {MovableObject} enemy - The enemy whose death sound should be played.
     */
    playDeathSound(enemy) {
        if (enemy instanceof Endboss) return;
        let sound = enemy.constructor.name === 'Smallchicken' ? AudioHub.LITTLECHICK_DEAD : AudioHub.NORMALCHICK_DEAD;
        AudioHub.playOne(sound);
    }
}