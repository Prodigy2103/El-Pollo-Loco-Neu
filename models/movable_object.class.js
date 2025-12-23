import { DrawableObject } from "./drawable_object.class.js";

export class MovableObject extends DrawableObject {

    speed = 0.15;
    speedY = 0;
    acceleration = 2.5;
    energy = 100;
    lastHit = 0;
    otherDirection = false;

    /**
     * Applies a gravitational force to the object's vertical position.
     * Decreases vertical speed until the object returns to the ground.
     */
    applyGravity = () => {
        if (this.isAboveGround() || this.speedY > 0) {
            this.y -= this.speedY;
            this.speedY -= this.acceleration;
        } else {
            this.speedY = 0; // Das hier ist die wichtigste Zeile!
            this.y = 135;    // Optional: Pepe exakt auf Bodenhöhe fixieren
        }
    };

    /**
     * Checks if the object is currently in the air.
     * @returns {boolean} True if the y-coordinate is above the ground level.
     */
    isAboveGround() {
        return this.y < 135;
    }

    /**
     * Cycles through an array of image paths to create a frame-by-frame animation.
     * @param {string[]} array - List of image paths from the image cache.
     */
    playAnimation(array) {
        let i = this.currentImage % array.length;
        let path = array[i];
        this.img = this.imageCache[path];
        this.currentImage++;
    }

    /** Moves the object horizontally to the right based on its speed. */
    moveRight() {
        this.x += this.speed;
    }

    /** Moves the object horizontally to the left based on its speed. */
    moveLeft() {
        this.x -= this.speed;
    }

    /** Sets the vertical velocity to trigger a jump. */
    jump() {
        this.speedY = 30;
    }

    /**
     * Specialized collision check to determine if an object is being stomped on.
     * @param {MovableObject} mO - The object to check against (usually an enemy).
     * @returns {boolean} True if this object is falling onto the top of the other object.
     */
    isCollidingAbove(mO) {
        const isBasicCollision = this.isColliding(mO);
        const isFalling = this.speedY < 0;
        const characterBottomY = this.rY + this.rHeight;
        const enemyTopY = mO.rY;
        const isHittingTop = characterBottomY >= enemyTopY && characterBottomY <= enemyTopY + 0;
        const isInAir = this.isAboveGround();
        return isBasicCollision && isFalling && isInAir && isHittingTop;
    }

    /**
     * Reduces energy and updates the lastHit timestamp.
     */
    hit() {
        this.energy -= 20;
        if (this.energy < 0) {
            this.energy = 0;
        }
        this.lastHit = new Date().getTime();
    }

    /**
     * Checks if the object's health has reached zero.
     * @returns {boolean}
     */
    isDead() {
        return this.energy == 0;
    }

    /**
     * Determines if the object is currently in a "hurt" state based on time elapsed since the last hit.
     * Used to trigger hurt animations or temporary invincibility.
     * @returns {boolean} True if less than 0.6 seconds have passed since the last hit.
     */
    isHurt() {
        let timepassed = new Date().getTime() - this.lastHit;
        timepassed = timepassed / 1000; // Convert to seconds
        return timepassed < 0.4;
    }

    isColliding(mo) {
        return this.x + this.width - this.offset.right > mo.x + mo.offset.left &&
            this.y + this.height - this.offset.bottom > mo.y + mo.offset.top &&
            this.x + this.offset.left < mo.x + mo.width - mo.offset.right &&
            this.y + this.offset.top < mo.y + mo.height - mo.offset.bottom;
    }
}