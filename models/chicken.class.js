import { Picture } from "../js/imghelper.js";
import { MovableObject } from "./movable_object.class.js";
import { IntervalHub } from "../js/intervalhub.class.js";

/**
 * Represents a basic chicken enemy in the game.
 * Automatically moves left and handles its own walking and death animations.
 * @extends MovableObject
 */
export class Chicken extends MovableObject {
    y = 350;
    width = 70;
    height = 90;

    /** * @type {Object} Collision offsets to refine the hit area.
     * @property {number} top - Pixels clipped from the top.
     * @property {number} left - Pixels clipped from the left.
     * @property {number} bottom - Pixels clipped from the bottom.
     * @property {number} right - Pixels clipped from the right.
     */
    offset = {
        top: 5,
        left: 0,
        bottom: 8,
        right: 0
    };

    /**
     * Creates a Chicken instance.
     * Randomizes the starting x-position and speed to vary enemy behavior.
     */
    constructor() {
        super();
        this.loadImage(Picture.normalChick.walk[0]);
        this.loadImages(Picture.normalChick.walk);
        this.loadImages(Picture.normalChick.dead);

        /** @type {number} Random starting position beyond the initial view. */
        this.x = 600 + Math.random() * 1440;

        /** @type {number} Randomized movement speed for variety. */
        this.speed = 0.15 + Math.random() * 0.5;

        this.animate();
    }

    /**
     * Initializes the movement and animation intervals.
     * Separates logic (left movement) from visuals (animation frames).
     */
    animate() {
        /** * Logic Interval: Handles the horizontal movement.
         * Runs at ~60 FPS for smooth motion.
         * @type {number}
         */
        this.moveInterval = IntervalHub.startInterval(() => {
            if (!this.isDead()) {
                this.moveLeft();
            }
        }, 1000 / 60);

        /** * Visual Interval: Handles the frame-by-frame animation.
         * Automatically stops movement logic upon death.
         * @type {number}
         */
        this.animationInterval = IntervalHub.startInterval(() => {
            if (this.isDead()) {
                this.playAnimation(Picture.normalChick.dead);
                IntervalHub.stopInterval(this.moveInterval);
            } else {
                this.playAnimation(Picture.normalChick.walk);
            }
        }, 125);
    }
}