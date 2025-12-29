import { MovableObject } from "./movable_object.class.js";
import { Picture } from "./../js/imghelper.js";
import { IntervalHub } from "./../js/intervalhub.class.js";

/**
 * Represents a projectile (salsa bottle) that can be thrown by the character.
 * Handles parabolic flight physics, rotation animations, and collision impact (splash).
 * @extends MovableObject
 */
export class ThrowableObject extends MovableObject {
    speedY = 15;
    thrown = false;
    hit = false;
    direction = 1;
    animationInterval;
    movementInterval;

    /**
     * Creates a ThrowableObject.
     * @param {Object} options - Configuration for the throw.
     * @param {number} [_x=50] - Initial horizontal start position.
     * @param {number} [_y=100] - Initial vertical start position.
     * @param {boolean} [_otherDirection=false] - Direction of the throw (true for left, false for right).
     */
    constructor({ _x = 50, _y = 100, _otherDirection = false } = {}) {
        super();
        this.loadImage(Picture.bottle.rotate[0]);
        this.loadImages(Picture.bottle.rotate);
        this.loadImages(Picture.bottle.splash);

        this.x = _x;
        this.y = _y;
        this.width = 70;
        this.height = 70;
        /** @type {number} Horizontal multiplier based on throw direction. */
        this.direction = _otherDirection ? -1 : 1;

        this.throw();
        this.startAnimation();
    }

    /**
     * Starts the visual animation loop.
     * Toggles between rotation during flight and splash sequence on impact.
     */
    startAnimation() {
        this.animationInterval = IntervalHub.startInterval(() => this.animate(), 1000 / 20);
    }

    /**
     * Initiates the physics for the throw.
     * Sets an initial vertical impulse and starts the high-frequency position update loop.
     */
    throw() {
        this.thrown = true;
        this.speedY = 15;
        this.movementInterval = IntervalHub.startInterval(() => this.updatePosition(), 1000 / 60);
    }

    /**
     * Transitions the object into the splash state.
     * Stops horizontal and vertical movement immediately to play the impact animation.
     */
    splash() {
        this.hit = true;
        if (this.movementInterval) {
            IntervalHub.stopInterval(this.movementInterval);
        }
        this.playAnimation(Picture.bottle.splash);
    }

    /**
     * Updates the object's coordinates during flight.
     * Applies horizontal velocity and gravity. Removes the object if it falls out of bounds.
     */
    updatePosition() {
        if (this.hit) return;

        this.x += 18 * this.direction;
        this.applyGravity();

        if (this.y > 400) {
            this.removeObject();
        }
    }

    /**
     * Instantly removes the object from the active game logic.
     * Stops all intervals and moves the object out of the visible canvas area.
     */
    removeObject() {
        IntervalHub.stopInterval(this.movementInterval);
        IntervalHub.stopInterval(this.animationInterval);
        this.y = 1000;
    }

    /**
     * Overrides the ground check logic.
     * Projectiles are considered "above ground" as long as they haven't hit a target.
     * @returns {boolean} True if the bottle is still in flight.
     */
    isAboveGround() {
        return !this.hit;
    }

    /**
     * Animation controller that selects the frame set based on the hit state.
     */
    animate() {
        if (this.hit) {
            this.playAnimation(Picture.bottle.splash);
        } else {
            this.playAnimation(Picture.bottle.rotate);
        }
    }
}