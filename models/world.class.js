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

export class World {
    character = new Character();
    level = new Level();
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new Statusbar();
    coinBar = new Coinbar();
    bottleBar = new BottleBar();
    endbossBar = new EndbossBar();
    throwableObject = [];
    lastThrow = 0;
    gameEnded = false;
    gameEndingStarted = false;
    onGameOver;

    constructor(canvas, keyboard, onGameOver) {
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.onGameOver = onGameOver;

        this.updateBars();
        this.setWorld();
        this.character.startAnimation();
        this.run();
        this.draw();
    }

    /**
     * Injects a reference of this world instance into key entities to allow communication.
     */
    setWorld() {
        this.character.world = this;
        this.level?.enemies?.forEach(enemy => {
            if (enemy instanceof Endboss) enemy.world = this;
        });
    }

    /**
     * Starts the asynchronous logic loops for the game engine at 60 FPS.
     */
    run() {
        IntervalHub.startInterval(() => {
            if (!this.gameEnded) {
                this.checkCollisions();
                this.checkCollectables();
                this.checkThrowObjects();
                this.checkBottleCollisions();
                this.checkGameState();
            }
        }, 1000 / 60);
    }

    /**
     * Monitors the current health of the character and the boss to determine win/loss conditions.
     */
    checkGameState() {
        if (this.gameEndingStarted) return;

        if (this.character.energy <= 0) {
            this.triggerEndSequence('lose');
        }

        const boss = this.level.enemies.find(e => e instanceof Endboss);
        if (boss && boss.energy <= 0) {
            setTimeout(() => this.triggerEndSequence('win'), 500);
        }
    }

    /**
     * Initiates the end of the game by setting the transition state.
     * @param {string} result - The outcome of the game ('win' or 'lose').
     */
    triggerEndSequence(result) {
        this.gameEndingStarted = true;
        this.finishGame(result);
    }

    /**
     * Stops all game activities, sounds, and intervals, then triggers the game over callback.
     * @param {string} result - The outcome of the game ('win' or 'lose').
     */
    finishGame(result) {
        this.gameEnded = true;
        IntervalHub.stopAllIntervals();
        AudioHub.stopAll();
        if (this.onGameOver) this.onGameOver(result);
    }

    /**
     * Checks for physical intersections between the character and enemies.
     * Handles both jump-kills and damage taken by the character.
     */
    checkCollisions() {
        this.level.enemies.forEach((enemy) => {
            if (enemy.isDead() || enemy.energy <= 0) return;

            if (this.character.isColliding(enemy)) {
                const isAbove = this.character.isAboveGround();
                if (isAbove && !(enemy instanceof Endboss)) {
                    this.handleEnemyJumpKill(enemy);
                }
                else if (!this.character.isHurt()) {
                    this.character.hit();
                    this.statusBar.setPercentage(this.character.energy, Picture.statusBar.health);
                }
            }
        });
    }

    /**
     * Executes the logic for defeating an enemy by jumping on it.
     * @param {Object} enemy - The enemy instance being defeated.
     */
    handleEnemyJumpKill(enemy) {
        this.playDeathSound(enemy);
        enemy.energy = 0;
        this.character.speedY = 15;
        setTimeout(() => {
            let index = this.level.enemies.indexOf(enemy);
            if (index > -1) this.level.enemies.splice(index, 1);
        }, 200);
    }

    /**
     * Main drawing loop. Clears the canvas and renders all game objects.
     */
    draw() {
        if (this.gameEnded) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.camera_x = Math.min(0, -this.character.x + 100);
        this.ctx.translate(this.camera_x, 0);

        this.addMovableObjects();

        this.ctx.translate(-this.camera_x, 0);
        this.addFixedObjects();

        requestAnimationFrame(() => this.draw());
    }

    /**
     * Adds all dynamic objects (enemies, clouds, items) to the rendering map.
     */
    addMovableObjects() {
        [this.level.backgroundObjects, this.level.clouds, this.level.collectibles.coins,
        this.level.collectibles.bottles, this.level.enemies, this.throwableObject]
            .forEach(group => this.addObjectsToMap(group));
        this.addToMap(this.character);
    }

    /**
     * Iterates over an array of objects to add them to the canvas.
     * @param {Array} objects - Array of MovableObjects.
     */
    addObjectsToMap(objects) {
        objects.forEach((o) => this.addToMap(o));
    }

    /**
     * Draws a single object on the canvas, handling mirrored images if necessary.
     * @param {MovableObject} mO - The object to be drawn.
     */
    addToMap(mO) {
        if (mO.otherDirection) this.flipImage(mO);
        mO.draw(this.ctx);
        if (mO.drawFrame) mO.drawFrame(this.ctx);
        if (mO.drawOffsetFrame) mO.drawOffsetFrame(this.ctx);
        if (mO.otherDirection) this.flipImageBack(mO);
    }

    /**
     * Renders UI elements that do not move with the camera (status bars).
     */
    addFixedObjects() {
        [this.statusBar, this.coinBar, this.bottleBar, this.endbossBar].forEach(bar => this.addToMap(bar));
    }

    /**
     * Flips the context horizontally to draw mirrored images.
     * @param {MovableObject} mo - The object whose image needs to be flipped.
     */
    flipImage(mo) {
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.translate(-mo.width - (mo.x * 2), 0);
    }

    /**
     * Restores the drawing context after a flip operation.
     */
    flipImageBack() {
        this.ctx.restore();
    }

    /**
     * Checks if the character is collecting coins or bottles.
     */
    checkCollectables() {
        this.collectCoin();
        this.collectBottle();
    }

    /**
     * Logic for coin collection: updates score, plays sound, and removes the item.
     */
    collectCoin() {
        this.level.collectibles.coins.forEach((coin, index) => {
            if (this.character.isColliding(coin)) {
                AudioHub.playOne(AudioHub.COIN_COLLECTED, 0.25);
                GameState.coinPercentage += 20;
                this.level.collectibles.coins.splice(index, 1);
                this.coinBar.setPercentage(GameState.coinPercentage, Picture.statusBar.coin);
            }
        });
    }

    /**
     * Logic for bottle collection: checks storage capacity and updates inventory.
     */
    collectBottle() {
        for (let i = this.level.collectibles.bottles.length - 1; i >= 0; i--) {
            let bottle = this.level.collectibles.bottles[i];
            if (this.character.isColliding(bottle) && Bottle.canBeStored()) {
                AudioHub.playOne(AudioHub.BOTTLE_COLLECTED, 0.25);
                GameState.bottlePercentage += 20;
                this.level.collectibles.bottles.splice(i, 1);
                this.bottleBar.setPercentage(GameState.bottlePercentage, Picture.statusBar.bottle);
            }
        }
    }

    /**
     * Plays the appropriate death sound based on the type of enemy.
     * @param {Object} enemy - The enemy that was killed.
     */
    playDeathSound(enemy) {
        if (enemy instanceof Endboss) return;
        const sound = enemy.constructor.name === 'Smallchicken' ? AudioHub.LITTLECHICK_DEAD : AudioHub.NORMALCHICK_DEAD;
        AudioHub.playOne(sound, 0.25);
    }

    /**
     * Synchronizes the visual bars with the current global GameState.
     */
    updateBars() {
        this.coinBar.setPercentage(GameState.coinPercentage, Picture.statusBar.coin);
        this.bottleBar.setPercentage(GameState.bottlePercentage, Picture.statusBar.bottle);
    }

    /**
     * Handles the logic for spawning a throwable bottle if conditions are met.
     */
    checkThrowObjects() {
        let now = Date.now();
        if (this.keyboard.D && GameState.bottlePercentage > 0 && (now - this.lastThrow) > 400) {
            let bottle = new ThrowableObject({
                _x: this.character.x + 100,
                _y: this.character.y + 100,
                _otherDirection: this.character.otherDirection
            });
            this.throwableObject.push(bottle);
            GameState.bottlePercentage -= 20;
            this.updateBars();
            this.lastThrow = now;
        }
    }

    /**
     * Checks for collisions between thrown bottles and enemies.
     */
    checkBottleCollisions() {
        this.throwableObject.forEach((bottle, bIdx) => {
            if (bottle.hit) return;
            this.level.enemies.forEach((enemy) => {
                if (!bottle.hit && bottle.isColliding(enemy)) {
                    this.handleBottleImpact(bottle, enemy, bIdx);
                }
            });
        });
    }

    /**
     * Processes the result of a bottle hitting an enemy.
     * @param {ThrowableObject} bottle - The thrown object.
     * @param {Object} enemy - The enemy hit by the bottle.
     * @param {number} bottleIndex - The index of the bottle in the throwableObject array.
     */
    handleBottleImpact(bottle, enemy, bottleIndex) {
        bottle.hit = true;
        enemy.hit(20);
        if (enemy instanceof Endboss) {
            bottle.splash();
            this.endbossBar.setPercentage(enemy.energy, Picture.statusBar.endboss);
            AudioHub.playOne(AudioHub.BREAK_BOTTLE, 0.20);
        } else {
            bottle.removeObject();
            this.playDeathSound(enemy);
        }
        setTimeout(() => this.throwableObject.splice(bottleIndex, 1), enemy instanceof Endboss ? 500 : 0);
    }
}