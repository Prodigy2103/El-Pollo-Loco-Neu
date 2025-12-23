import { MovableObject } from "./movable_object.class.js";
import { Picture } from "../js/imghelper.js";
import { GameState } from "./game-state.class.js";

export class Bottle extends MovableObject {

    static bottlePercentage = 0;
    static MAX_BOTTLE_STORAGE = 100;
    static canBeStored() {
        return GameState.bottlePercentage < 100;
    }

    offset = {
        top: 10,
        bottom: 10,
        left: 15,
        right: 15
    };

    /**
     * Creates a Bottle instance at a specific location.
     * Randomly selects one of the available bottle ground textures.
     * @param {number} x - The horizontal position in the game world.
     * @param {number} y - The vertical position in the game world.
     */
    constructor(x, y) {
        super();
        this.loadImage(Picture.bottle.bottleGround[Math.floor(Math.random() * 2)]);
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
    }
}