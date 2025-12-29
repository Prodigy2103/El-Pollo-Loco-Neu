import { DrawableObject } from "./drawable_object.class.js";

/**
 * Base class for all objects that move or have physical interactions in the game world.
 * Provides core physics like gravity, collision detection, and health management.
 * @extends DrawableObject
 */
export class MovableObject extends DrawableObject {
    speed = 0.15;
    speedY = 0;
    acceleration = 2.5;
    energy = 100;
    lastHit = 0;
    otherDirection = false;

    /**
     * Applies constant gravity to the object.
     * Decreases the vertical position based on current vertical speed until ground level is reached.
     */
    applyGravity = () => {
        if (this.isAboveGround() || this.speedY > 0) {
            this.y -= this.speedY;
            this.speedY -= this.acceleration;
        }
        this.getRealFrame();
    };

    /**
     * Checks if the object is currently in the air.
     * Throwable objects are always considered in the air.
     * @returns {boolean} True if the object's y-coordinate is above ground level.
     */
    isAboveGround() {
        if (this.constructor.name === 'ThrowableObject') {
            return true;
        } else {
            return this.y < 135;
        }
    }

    /**
     * Plays a sequence of images to create an animation.
     * Uses modulo to loop through the provided image array.
     * @param {string[]} array - Array of image paths for the animation.
     */
    playAnimation(array) {
        let i = this.currentImage % array.length;
        let path = array[i];
        this.img = this.imageCache[path];
        this.currentImage++;
    }

    /**
     * Moves the object to the right by its current speed.
     */
    moveRight() {
        this.x += this.speed;
    }

    /**
     * Moves the object to the left by its current speed.
     */
    moveLeft() {
        this.x -= this.speed;
    }

    /**
     * Triggers a jump by setting the vertical speed.
     * Typically called when a jump key is pressed and the object is grounded.
     */
    jump() {
        this.speedY = 30;
    }

    /**
     * Specialized check for landing on top of another object (e.g., stomping an enemy).
     * Requires a basic collision, downward movement, and correct vertical alignment.
     * @param {MovableObject} mO - The object (enemy) to check against.
     * @returns {boolean} True if the object is falling onto the top of mO.
     */
    isCollidingAbove(mO) {
        if (mO.constructor.name === 'Endboss') return false;

        const isBasicCollision = this.isColliding(mO);
        const isFalling = this.speedY < 0;
        const characterBottomY = this.rY + this.rHeight;
        const enemyTopY = mO.rY;
        const isHittingTop = characterBottomY >= enemyTopY && characterBottomY <= enemyTopY + 40;
        const isInAir = this.isAboveGround();

        return isBasicCollision && isFalling && isInAir && isHittingTop;
    }

    /**
     * Reduces the object's energy when hit.
     * Sets the timestamp for the last hit to manage invincibility frames.
     */
    hit(damage = 5) {
        if (this.isHurt()) return;
        this.energy -= damage;
        if (this.energy < 0) this.energy = 0;
        this.lastHit = new Date().getTime();
    }

    isDead() {
        return this.energy <= 0;
    }

    isHurt() {
        let timepassed = (new Date().getTime() - this.lastHit) / 1000;
        return timepassed < 0.5;
    }
}