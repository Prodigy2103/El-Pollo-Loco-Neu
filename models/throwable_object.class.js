import { MovableObject } from "./movable_object.class.js"; 
import { Picture } from "./../js/imghelper.js";
import { IntervalHub } from "./../js/intervalhub.class.js"; 

/**
 * Represents a projectile object (Salsa Bottle) thrown by the character.
 */
export class ThrowableObject extends MovableObject {
    speedY = 15;
    thrown = false;
    hit = false;
    direction = 1;
    animationInterval;
    movementInterval;

    constructor({_x = 50, _y = 100, _otherDirection = false} = {}) {
        super();
        this.loadImage(Picture.bottle.rotate[0]);
        this.loadImages(Picture.bottle.rotate);
        this.loadImages(Picture.bottle.splash);

        this.x = _x;
        this.y = _y;
        this.width = 70;
        this.height = 70;
        this.direction = _otherDirection ? -1 : 1;

        this.throw();
        this.startAnimation();
    }

    /**
     * Starts the animation loop for the object.
     * Sets an interval to trigger the animation frame at approximately 20 FPS.
     */
    startAnimation() {
        this.animationInterval = IntervalHub.startInterval(() => this.animate(), 1000 / 20);
    }

    /**
     * Initiates the throwing physics for the object.
     * Sets the vertical velocity, marks the object as thrown, and 
     * starts the movement update loop at approximately 60 FPS.
     */
    throw() {
        this.thrown = true;
        this.speedY = 15;
        this.movementInterval = IntervalHub.startInterval(() => this.updatePosition(), 1000 / 60);
    }

    /**
     * Triggers the splash sequence ONLY when an enemy is hit.
     */
    splash() {
    this.hit = true;
    if (this.movementInterval) {
        IntervalHub.stopInterval(this.movementInterval);
    }
    this.playAnimation(Picture.bottle.splash);
}

    updatePosition() {
        if (this.hit) return; 

        this.x += 18 * this.direction; 
        this.applyGravity();
        if (this.y > 400) {
            this.removeObject();
        }
    }

    /**
     * Cleans up the object immediately without showing a splash.
     */
    removeObject() {
        IntervalHub.stopInterval(this.movementInterval);
        IntervalHub.stopInterval(this.animationInterval);
        this.y = 1000; 
    }

    isAboveGround() {
        return !this.hit;
    }

    animate() {
        if (this.hit) {
            this.playAnimation(Picture.bottle.splash);
        } else {
            this.playAnimation(Picture.bottle.rotate);
        }
    }
}