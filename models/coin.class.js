import { MovableObject } from "./movable_object.class.js";
import { Picture } from "../js/imghelper.js";

/**
 * Represents a collectable coin entity within the game.
 * Coins feature a continuous rotation animation and track global collection progress.
 * @extends MovableObject
 */
export class Coin extends MovableObject {

    /** * @static
     * @type {number} Global tracker for the percentage of coins collected by the player.
     */
    static coinPercentage = 0;

    /** * @type {Object} Collision offsets to ensure the player must touch the center of the coin.
     * @property {number} top - Pixels clipped from the top.
     * @property {number} bottom - Pixels clipped from the bottom.
     * @property {number} left - Pixels clipped from the left.
     * @property {number} right - Pixels clipped from the right.
     */
    offset = {
        top: 40,
        bottom: 40,
        left: 40,
        right: 40
    };

    /**
     * Creates a Coin instance at specific coordinates and starts its animation.
     * @param {number} x - The horizontal position in the world.
     * @param {number} y - The vertical position in the world.
     */
    constructor(x, y) {
        super();
        /** Preloads the sequence of coin rotation images. */
        this.loadImages(Picture.coin);
        this.playAnimation(Picture.coin);
        this.x = x;
        this.y = y;
        this.width = 150;
        this.height = 150;
        this.animate();
    }

    /**
     * Initializes a recurring interval to cycle through the coin's animation frames.
     * Creates the visual effect of a spinning or shimmering coin.
     */
    animate() {
        setInterval(() => {
            this.playAnimation(Picture.coin);
        }, 300);
    }
}